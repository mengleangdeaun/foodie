<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use App\Models\Category;
use App\Models\Product;
use App\Models\BranchProduct;
use App\Models\BranchProductSize;
use Illuminate\Http\Request;

class PublicMenuController extends Controller
{
    public function show($token)
    {
        $table = RestaurantTable::where('qr_code_token', $token)
            ->where('is_active', true)
            ->with('branch')
            ->firstOrFail();

        $branch = $table->branch;

        $categories = Category::where('owner_id', $branch->owner_id)
            ->where('is_active', true)
            ->with(['remarkPresets' => function($query) use ($branch) {
                $query->whereHas('branches', function($q) use ($branch) {
                    $q->where('branches.id', $branch->id);
                });
            }])
            ->get();

        // Get all products for this branch
        $products = Product::where('owner_id', $branch->owner_id)
            ->where('is_active', true)
            ->whereHas('branches', function($query) use ($branch) {
                $query->where('branch_id', $branch->id)
                      ->where('is_available', true); 
            })
            ->with([
                'tags', 
                'sizes',
                'modifierGroups.modifiers' => function($q) {
                    $q->where('is_available', true);
                },
                'branches' => function($query) use ($branch) {
                    $query->where('branch_id', $branch->id);
                }
            ])
            ->join('branch_product', 'products.id', '=', 'branch_product.product_id')
            ->where('branch_product.branch_id', $branch->id)
            ->orderBy('branch_product.sort_order', 'asc')
            ->select('products.*', 'branch_product.id as branch_product_id') // Get branch_product_id directly
            ->get();

        // Process each product
        $processedProducts = $products->map(function($product) use ($branch) {
            $branchProduct = $product->branches->first();
            $branchProductId = $product->branch_product_id ?? ($branchProduct->pivot->id ?? null);
            
            // Log for debugging (remove in production)
            // \Log::info("Product {$product->id}, Branch Product ID: {$branchProductId}");
            
            // Process sizes with branch-specific pricing
            $sizesWithPricing = collect();
            
            if ($product->sizes->isNotEmpty()) {
                // Get all branch_product_size records for this branch_product
                $branchProductSizes = BranchProductSize::where('branch_product_id', $branchProductId)
                    ->whereIn('size_id', $product->sizes->pluck('id'))
                    ->get();
                    
                // Log for debugging
                // \Log::info("Found " . $branchProductSizes->count() . " branch product sizes for product {$product->id}");
                
                $branchProductSizes = $branchProductSizes->keyBy('size_id');
                
                foreach ($product->sizes as $size) {
                    $branchProductSize = $branchProductSizes[$size->id] ?? null;
                    
                    // Skip if branch_product_size exists and is_available = 0
                    if ($branchProductSize && !$branchProductSize->is_available) {
                        continue;
                    }
                    
                    // Log for debugging
                    // \Log::info("Size {$size->id}, BranchProductSize: " . ($branchProductSize ? 'Exists' : 'Not exists'));
                    
                    // DETERMINE PRICE - FOLLOWING OWNER CONTROLLER LOGIC
                    $effectivePrice = null;
                    $priceSource = 'product_base';
                    
                    // Check if we have a branch_product_size record
                    if ($branchProductSize) {
                        // Size-specific pricing exists
                        if ($branchProductSize->branch_size_price !== null) {
                            // Use branch_size_price even if it's 0.00
                            $effectivePrice = (float) $branchProductSize->branch_size_price;
                            $priceSource = 'branch_size';
                        } else {
                            // branch_size_price is NULL, check branch_product price
                            if ($branchProduct && $branchProduct->pivot->branch_price !== null) {
                                $effectivePrice = (float) $branchProduct->pivot->branch_price;
                                $priceSource = 'branch_product';
                            } else {
                                $effectivePrice = (float) $product->base_price;
                                $priceSource = 'product_base';
                            }
                        }
                    } else {
                        // No branch_product_size record, use branch_product or product base
                        if ($branchProduct && $branchProduct->pivot->branch_price !== null) {
                            $effectivePrice = (float) $branchProduct->pivot->branch_price;
                            $priceSource = 'branch_product';
                        } else {
                            $effectivePrice = (float) $product->base_price;
                            $priceSource = 'product_base';
                        }
                    }
                    
                    // DETERMINE DISCOUNT
                    $discountPercentage = 0;
                    $isDiscountActive = false;
                    $discountSource = 'none';
                    
                    if ($branchProductSize) {
                        // Use branch_product_size discount settings
                        $discountPercentage = (float) $branchProductSize->discount_percentage;
                        $isDiscountActive = (bool) $branchProductSize->is_discount_active;
                        $discountSource = 'branch_size';
                    } else {
                        // Use branch_product discount settings
                        $discountPercentage = (float) ($branchProduct->pivot->discount_percentage ?? 0);
                        $isDiscountActive = (bool) ($branchProduct->pivot->has_active_discount ?? false);
                        $discountSource = 'branch_product';
                    }
                    
                    // Calculate final price
                    $finalPrice = $effectivePrice;
                    if ($isDiscountActive && $discountPercentage > 0) {
                        $finalPrice = $effectivePrice - ($effectivePrice * ($discountPercentage / 100));
                    }
                    
$sizesWithPricing->push([
    'id' => $size->id,
    'name' => $size->name,

    'base_price' => $effectivePrice,
    'final_price' => round($finalPrice, 2, PHP_ROUND_HALF_UP),

    'discount_percentage' => $discountPercentage,
    'has_active_discount' => $isDiscountActive,
    'is_available' => true,

    'price_source' => $priceSource,
    'discount_source' => $discountSource,

    'has_branch_product_size_record' => !is_null($branchProductSize),
    'branch_product_id' => $branchProductId,
    'branch_product_size_id' => $branchProductSize->id ?? null,
]);

                }
            }
            
            // Calculate product base price (for products without sizes)
            $productBasePrice = $branchProduct->pivot->branch_price ?? $product->base_price;
            $productDiscountPercentage = $branchProduct->pivot->discount_percentage ?? 0;
            $productHasActiveDiscount = $branchProduct->pivot->has_active_discount ?? false;
            $productEffectivePrice = (float) $productBasePrice;
            
            if ($productHasActiveDiscount && $productDiscountPercentage > 0) {
                $productEffectivePrice = (float) ($productBasePrice - ($productBasePrice * ($productDiscountPercentage / 100)));
            }
            
            return [
                'id' => $product->id,
                'name' => $product->name,
                'category_id' => $product->category_id,
                'short_description' => $product->short_description,
                'image_path' => $product->image_path,
                'tags' => $product->tags,
                'sizes' => $sizesWithPricing->isEmpty() ? null : $sizesWithPricing,
                'has_sizes' => !$sizesWithPricing->isEmpty(),
                'modifier_groups' => $product->modifierGroups->map(function($group) {
                    return [
                        'id' => $group->id,
                        'name' => $group->name,
                        'selection_type' => $group->selection_type,
                        'min_selection' => $group->min_selection,
                        'max_selection' => $group->max_selection,
                        'modifiers' => $group->modifiers->map(function($modifier) {
                            return [
                                'id' => $modifier->id,
                                'name' => $modifier->name,
                                'price' => (float) $modifier->price
                            ];
                        })
                    ];
                }),
                'pricing' => [
                    'product_base_price' => (float) $product->base_price,
                    'branch_product_price' => $branchProduct ? (float) $branchProduct->pivot->branch_price : null,
                    'is_available' => (bool)($branchProduct->pivot->is_available ?? true),
                    'discount_percentage' => (float) $productDiscountPercentage,
                    'has_active_discount' => (bool) $productHasActiveDiscount,
                    'effective_price' => (float) $productEffectivePrice,
                    'is_popular' => (bool)($branchProduct->pivot->is_popular ?? false),
                    'is_signature' => (bool)($branchProduct->pivot->is_signature ?? false),
                    'is_chef_recommendation' => (bool)($branchProduct->pivot->is_chef_recommendation ?? false),
                ],
            ];
        });

        return response()->json([
            'branch' => [
                ...$branch->toArray(),
                'tax_rate' => $branch->tax_rate ?? 10.00,
                'tax_is_active' => $branch->tax_is_active ?? true,
                'tax_name' => $branch->tax_name ?? 'Tax'
            ],
            'table_number' => $table->table_number,
            'categories' => $categories,
            'products' => $processedProducts
        ]);
    }
}