<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderHistory;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Branch;
use App\Models\RestaurantTable;
use App\Models\BranchProduct;
use App\Models\BranchProductSize;
use App\Models\Modifier;
use App\Models\Category;
use App\Services\TelegramService;
use App\Events\NewOrderRegistered;
use Illuminate\Http\Request;
use App\Models\Size;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class POSController extends Controller
{
    public function show(Request $request)
    {
        $request->validate(['branch_id' => 'required|exists:branches,id']);
        $branch = Branch::find($request->branch_id);

        // Get categories with remark presets for this branch
        $categories = Category::where('owner_id', $branch->owner_id)
            ->with(['remarkPresets' => function($query) use ($branch) {
                $query->whereHas('branches', function($q) use ($branch) {
                    $q->where('branches.id', $branch->id);
                });
            }])
            ->get();

        // Get products with branch-specific pricing
        $products = Product::where('owner_id', $branch->owner_id)
            ->where('is_active', true)
            ->whereHas('branches', function($query) use ($branch) {
                $query->where('branch_id', $branch->id)
                      ->where('is_available', true); 
            })
            ->with([
                'category', 
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
            ->where('branch_product.is_available', true)
            ->select([
                'products.*', 
                'branch_product.branch_price',
                'branch_product.discount_percentage as branch_discount_percentage',
                'branch_product.has_active_discount as branch_has_active_discount',
                'branch_product.is_popular',
                'branch_product.is_signature',
                'branch_product.is_chef_recommendation',
                'branch_product.sort_order',
                'branch_product.id as branch_product_id'
            ])
            ->orderBy('branch_product.sort_order')
            ->get()
            ->map(function ($product) use ($branch) {
                $branchProduct = $product->branches->first();
                $branchProductId = $product->branch_product_id;
                
                // Process sizes with branch-specific pricing
                $sizesWithPricing = collect();
                
                if ($product->sizes->isNotEmpty()) {
                    // Get all branch_product_size records for this branch_product
                    $branchProductSizes = BranchProductSize::where('branch_product_id', $branchProductId)
                        ->whereIn('size_id', $product->sizes->pluck('id'))
                        ->get()
                        ->keyBy('size_id');
                    
                    foreach ($product->sizes as $size) {
                        $branchProductSize = $branchProductSizes[$size->id] ?? null;
                        
                        // Skip if branch_product_size exists and is_available = 0
                        if ($branchProductSize && !$branchProductSize->is_available) {
                            continue;
                        }
                        
                        // DETERMINE PRICE
                        $effectivePrice = null;
                        $priceSource = 'product_base';
                        
                        if ($branchProductSize) {
                            // Size-specific pricing exists
                            if ($branchProductSize->branch_size_price !== null) {
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
                            $discountPercentage = (float) ($product->branch_discount_percentage ?? 0);
                            $isDiscountActive = (bool) ($product->branch_has_active_discount ?? false);
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
                            'final_price' => round($finalPrice, 2),
                            'discount_percentage' => $discountPercentage,
                            'has_active_discount' => $isDiscountActive,
                            'is_available' => true,
                            'price_source' => $priceSource,
                            'discount_source' => $discountSource,
                        ]);
                    }
                }
                
                // Calculate product base price (for products without sizes)
                $productBasePrice = $branchProduct->pivot->branch_price ?? $product->base_price;
                $productDiscountPercentage = (float) ($product->branch_discount_percentage ?? 0);
                $productHasActiveDiscount = (bool) ($product->branch_has_active_discount ?? false);
                $productEffectivePrice = (float) $productBasePrice;
                
                if ($productHasActiveDiscount && $productDiscountPercentage > 0) {
                    $productEffectivePrice = (float) ($productBasePrice - ($productBasePrice * ($productDiscountPercentage / 100)));
                }
                
                // Prepare modifier groups
                $modifierGroups = $product->modifierGroups->map(function ($group) {
                    return [
                        'id' => (int)$group->id,
                        'name' => $group->name,
                        'selection_type' => $group->selection_type,
                        'min_selection' => (int)$group->min_selection,
                        'max_selection' => $group->max_selection ? (int)$group->max_selection : null,
                        'is_active' => (bool)$group->is_active,
                        'modifiers' => $group->modifiers->map(function ($modifier) {
                            return [
                                'id' => (int)$modifier->id,
                                'name' => $modifier->name,
                                'price' => (float)$modifier->price,
                                'is_available' => (bool)$modifier->is_available
                            ];
                        })
                    ];
                });
                
                // Return product data
                return [
                    'id' => (int)$product->id,
                    'name' => $product->name,
                    'category_id' => (int)$product->category_id,
                    'short_description' => $product->short_description,
                    'description' => $product->description,
                    'image_path' => $product->image_path,
                    'category' => $product->category ? [
                        'id' => (int)$product->category->id,
                        'name' => $product->category->name
                    ] : null,
                    'sizes' => $sizesWithPricing->isEmpty() ? null : $sizesWithPricing,
                    'has_sizes' => !$sizesWithPricing->isEmpty(),
                    'modifier_groups' => $modifierGroups,
                    'tags' => $product->tags,
                    'final_price' => round($productEffectivePrice, 2),
                    'original_price' => round($productBasePrice, 2),
                    'has_discount' => $productHasActiveDiscount && $productDiscountPercentage > 0,
                    'discount_percentage' => $productDiscountPercentage,
                    'is_popular' => (bool)$product->is_popular,
                    'is_signature' => (bool)$product->is_signature,
                    'is_chef_recommendation' => (bool)$product->is_chef_recommendation,
                    'branch_specific' => true,
                    'pricing' => [
                        'product_base_price' => (float) $product->base_price,
                        'branch_product_price' => $branchProduct ? (float) $branchProduct->pivot->branch_price : null,
                        'is_available' => (bool)($branchProduct->pivot->is_available ?? true),
                        'discount_percentage' => $productDiscountPercentage,
                        'has_active_discount' => $productHasActiveDiscount,
                        'effective_price' => (float) $productEffectivePrice,
                        'is_popular' => (bool)($product->is_popular ?? false),
                        'is_signature' => (bool)($product->is_signature ?? false),
                        'is_chef_recommendation' => (bool)($product->is_chef_recommendation ?? false),
                    ],
                ];
            });

        return response()->json([
            'categories' => $categories,
            'products' => $products
        ]);
    }

public function store(Request $request, TelegramService $telegram)
{
    $validator = Validator::make($request->all(), [
        'branch_id' => 'required|exists:branches,id',
        'order_type' => 'required|in:walk_in,delivery',
        'delivery_partner_id' => 'nullable|exists:delivery_partners,id',
        'table_id' => 'nullable|exists:restaurant_tables,id',
        'items' => 'required|array|min:1',
        'items.*.product_id' => 'required|exists:products,id',
        'items.*.quantity' => 'required|integer|min:1',
        'items.*.selected_size' => 'nullable|array',
        'items.*.selected_modifiers' => 'nullable|array',
        'items.*.remark' => 'nullable|string',
        'order_discount_amount' => 'nullable|numeric|min:0',
        'order_discount_percentage' => 'nullable|numeric|min:0|max:100',
        'delivery_partner_discount' => 'nullable|numeric|min:0',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'message' => 'Validation failed',
            'errors' => $validator->errors()
        ], 422);
    }

    return DB::transaction(function () use ($request, $telegram) {

        $round = fn ($v) => round((float)$v, 2);
        $branch = Branch::findOrFail($request->branch_id);
        $taxRate = (float) ($branch->tax_rate ?? 0);
        $taxIsActive = (bool) ($branch->tax_is_active ?? true);

        $subtotal = 0;
        $itemDiscountTotal = 0;

        $order = Order::create([
            'branch_id' => $request->branch_id,
            'user_id' => Auth::id(),
            'created_by' => auth()->id(),
            'order_type' => $request->order_type,
            'delivery_partner_id' => $request->delivery_partner_id,
            'restaurant_table_id' => $request->table_id,
            'status' => 'confirmed',
            'subtotal' => 0,
            'item_discount_total' => 0,
            'order_level_discount' => 0,
            'delivery_partner_discount' => $round($request->delivery_partner_discount ?? 0),
            'order_discount_amount' => 0,
            'tax_rate' => $taxRate,
            'tax_amount' => 0,
        ]);

        foreach ($request->items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $branchProduct = BranchProduct::where('branch_id', $branch->id)
                ->where('product_id', $product->id)
                ->firstOrFail();

            if (!$branchProduct->is_available) {
                throw new \Exception("{$product->name} not available");
            }

            $basePrice = $branchProduct->branch_price ?? $product->base_price;
            $originalProductPrice = $basePrice;
            $discountPercentage = 0;
            $hasActiveDiscount = false;
            $appliedDiscountType = 'product';

            $branchProductSizeId = null;
            $sizeId = $item['selected_size']['id'] ?? null;
            $sizeName = null;

            // --- 1. Size Logic (To get size_name for Remark) ---
            if ($sizeId) {
                $branchProductSize = BranchProductSize::where('branch_product_id', $branchProduct->id)
                    ->where('size_id', $sizeId)
                    ->first();

                if ($branchProductSize) {
                    if (!$branchProductSize->is_available) {
                        throw new \Exception("Selected size unavailable");
                    }
                    if ($branchProductSize->branch_size_price !== null) {
                        $basePrice = $branchProductSize->branch_size_price;
                        $originalProductPrice = $basePrice;
                    }
                    if ($branchProductSize->is_discount_active && $branchProductSize->discount_percentage > 0) {
                        $discountPercentage = $branchProductSize->discount_percentage;
                        $hasActiveDiscount = true;
                        $appliedDiscountType = 'branch_product_size';
                    }
                    $branchProductSizeId = $branchProductSize->id;
                    
                    // Fetch name from Size model for remark string
                    $sizeModel = Size::find($sizeId);
                    $sizeName = $sizeModel ? $sizeModel->name : null;
                }
            }

            // --- 2. Modifier Logic (To get names for Remark) ---
            $modifierTotalPrice = 0;
            $selectedModifiersData = [];

            foreach ($item['selected_modifiers'] ?? [] as $modifierId) {
                $modifier = Modifier::find($modifierId);
                if ($modifier && $modifier->is_available) {
                    $modifierTotalPrice += $modifier->price;
                    $selectedModifiersData[] = [
                        'id' => $modifier->id,
                        'name' => $modifier->name,
                        'price' => $modifier->price
                    ];
                }
            }

            $modifierTotalPrice = $round($modifierTotalPrice);

            // --- 3. Calculation Logic ---
            $itemSubtotal = $round(($basePrice + $modifierTotalPrice) * $item['quantity']);
            $itemDiscount = 0;
            if ($hasActiveDiscount && $discountPercentage > 0) {
                $itemDiscount = $round(($basePrice * ($discountPercentage / 100)) * $item['quantity']);
            }
            $itemFinalPrice = $round($itemSubtotal - $itemDiscount);
            $finalUnitPrice = $round($itemFinalPrice / $item['quantity']);

            // --- 4. UPDATED REMARK LOGIC ---
            $customizationParts = [];
            
            if ($sizeName) {
                $customizationParts[] = "[Size: $sizeName]";
            }
            
            if (!empty($selectedModifiersData)) {
                $modifierNames = array_column($selectedModifiersData, 'name');
                $customizationParts[] = "+ " . implode(', ', $modifierNames);
            }
            
            $customizationString = implode(' ', $customizationParts);
            $finalRemark = trim($customizationString . ' ' . ($item['remark'] ?? ''));

            // --- 5. Save to Database ---
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'branch_product_size_id' => $branchProductSizeId,
                'size_id' => $sizeId,
                'size_name' => $sizeName,
                'base_price' => $round($basePrice),
                'original_product_price' => $round($originalProductPrice),
                'modifier_total_price' => $modifierTotalPrice,
                'item_discount_amount' => $itemDiscount,
                'applied_discount_percentage' => $discountPercentage,
                'applied_discount_type' => $appliedDiscountType,
                'final_unit_price' => $finalUnitPrice,
                'quantity' => $item['quantity'],
                'selected_modifiers' => $selectedModifiersData,
                'remark' => $finalRemark // Combined customization + note
            ]);

            $subtotal += $itemSubtotal;
            $itemDiscountTotal += $itemDiscount;
        }

        // Final Totals calculation
        $subtotal = $round($subtotal);
        $itemDiscountTotal = $round($itemDiscountTotal);
        $orderLevelDiscount = 0;
        if (($request->order_discount_amount ?? 0) > 0) {
            $orderLevelDiscount = $round($request->order_discount_amount);
        } elseif (($request->order_discount_percentage ?? 0) > 0) {
            $orderLevelDiscount = $round($subtotal * ($request->order_discount_percentage / 100));
        }

        $totalDiscount = $round($itemDiscountTotal + $orderLevelDiscount + ($request->delivery_partner_discount ?? 0));
        $taxableAmount = $round($subtotal - $totalDiscount);
        $taxAmount = 0;
        if ($taxIsActive && $taxRate > 0) {
            $taxAmount = $round($taxableAmount * ($taxRate / 100));
        }
        $total = $round($taxableAmount + $taxAmount);

        $order->update([
            'subtotal' => $subtotal,
            'item_discount_total' => $itemDiscountTotal,
            'order_level_discount' => $orderLevelDiscount,
            'order_discount_amount' => $totalDiscount,
            'tax_amount' => $taxAmount,
            'total' => $total
        ]);
        
        $telegram->sendOrderNotification(order: $order);
        broadcast(new NewOrderRegistered($order))->toOthers();

        return response()->json([
            'message' => 'Order placed successfully',
            'order_id' => $order->id,
            'total' => number_format($total, 2, '.', '')
        ]);
    });
}

}
