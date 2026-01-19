<?php

namespace App\Http\Controllers\Owner;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Size;
use App\Models\BranchProduct;
use App\Models\BranchProductSize;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Http\Controllers\Controller;

class BranchProductSizeController extends Controller
{
    /**
     * Display a listing of branch product sizes
     */
    public function index(Request $request, $branchId)
    {
        $branch = Branch::with('owner')->findOrFail($branchId);
        
        // Get search parameters
        $search = $request->input('search', '');
        $categoryId = $request->input('category_id', '');
        
        // Get products with their sizes and branch-specific pricing
        $query = Product::with([
            'category',
            'sizes' => function ($query) use ($branchId) {
                $query->orderBy('sort_order', 'asc');
            },
            'branchProducts' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            },
            'branchProductSizes' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                    ->with('size');
            }
        ])
        ->where('owner_id', $branch->owner_id)
        ->where('is_active', 1);
        
        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('short_description', 'like', "%{$search}%");
            });
        }
        
        // Apply category filter
        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }
        
        // Only show products that have multiple sizes
        $query->where('has_multiple_sizes', 1);
        
        $products = $query->paginate(20);
        
        // Get categories for filter dropdown
        $categories = \App\Models\Category::where('owner_id', $branch->owner_id)
            ->where('is_active', 1)
            ->orderBy('sort_order')
            ->get();
        
        return view('branch-products.index', compact('branch', 'products', 'categories', 'search', 'categoryId'));
    }

    /**
     * Show form to edit branch product size prices
     */
    public function edit($branchId, $productId)
    {
        $branch = Branch::findOrFail($branchId);
        $product = Product::with([
            'sizes' => function ($query) {
                $query->orderBy('sort_order', 'asc');
            },
            'branchProductSizes' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            }
        ])->findOrFail($productId);
        
        // Get or create branch product record
        $branchProduct = BranchProduct::firstOrCreate(
            [
                'branch_id' => $branchId,
                'product_id' => $productId
            ],
            [
                'is_available' => 1,
                'branch_price' => $product->base_price
            ]
        );
        
        // Prepare size data with branch pricing
        $sizes = $product->sizes->map(function ($size) use ($branchId, $productId, $branchProduct) {
            $branchProductSize = BranchProductSize::where('branch_product_id', $branchProduct->id)
                ->where('size_id', $size->id)
                ->first();
            
            return [
                'id' => $size->id,
                'name' => $size->name,
                'base_price' => $size->pivot->base_price ?? 0,
                'branch_size_price' => $branchProductSize ? $branchProductSize->branch_size_price : null,
                'discount_percentage' => $branchProductSize ? $branchProductSize->discount_percentage : 0,
                'is_discount_active' => $branchProductSize ? $branchProductSize->is_discount_active : false,
                'is_available' => $branchProductSize ? $branchProductSize->is_available : true,
                'branch_product_size_id' => $branchProductSize ? $branchProductSize->id : null
            ];
        });
        
        return view('branch-products.edit', compact('branch', 'product', 'branchProduct', 'sizes'));
    }

    /**
     * Update branch product size prices
     */
    public function update(Request $request, $branchId, $productId)
    {
        $validator = Validator::make($request->all(), [
            'sizes' => 'required|array',
            'sizes.*.branch_size_price' => 'nullable|numeric|min:0',
            'sizes.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'sizes.*.is_discount_active' => 'boolean',
            'sizes.*.is_available' => 'boolean'
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }
        
        $branchProduct = BranchProduct::where('branch_id', $branchId)
            ->where('product_id', $productId)
            ->firstOrFail();
        
        DB::beginTransaction();
        
        try {
            foreach ($request->sizes as $sizeId => $sizeData) {
                $branchProductSize = BranchProductSize::updateOrCreate(
                    [
                        'branch_product_id' => $branchProduct->id,
                        'size_id' => $sizeId
                    ],
                    [
                        'branch_size_price' => $sizeData['branch_size_price'] ?? null,
                        'discount_percentage' => $sizeData['discount_percentage'] ?? 0,
                        'is_discount_active' => $sizeData['is_discount_active'] ?? false,
                        'is_available' => $sizeData['is_available'] ?? true
                    ]
                );
            }
            
            // Update branch product availability based on sizes
            $hasAvailableSizes = BranchProductSize::where('branch_product_id', $branchProduct->id)
                ->where('is_available', 1)
                ->exists();
            
            $branchProduct->is_available = $hasAvailableSizes;
            $branchProduct->save();
            
            DB::commit();
            
            return redirect()->route('branch-products.index', $branchId)
                ->with('success', 'Product size prices updated successfully!');
            
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                ->with('error', 'Failed to update prices: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Bulk update multiple products
     */
    public function bulkUpdate(Request $request, $branchId)
    {
        $validator = Validator::make($request->all(), [
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'action' => 'required|in:activate,deactivate,apply_discount,remove_discount',
            'discount_percentage' => 'nullable|numeric|min:0|max:100'
        ]);
        
        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }
        
        DB::beginTransaction();
        
        try {
            foreach ($request->product_ids as $productId) {
                $branchProduct = BranchProduct::where('branch_id', $branchId)
                    ->where('product_id', $productId)
                    ->first();
                
                if ($branchProduct) {
                    switch ($request->action) {
                        case 'activate':
                            BranchProductSize::where('branch_product_id', $branchProduct->id)
                                ->update(['is_available' => 1]);
                            $branchProduct->is_available = 1;
                            $branchProduct->save();
                            break;
                            
                        case 'deactivate':
                            BranchProductSize::where('branch_product_id', $branchProduct->id)
                                ->update(['is_available' => 0]);
                            $branchProduct->is_available = 0;
                            $branchProduct->save();
                            break;
                            
                        case 'apply_discount':
                            if ($request->has('discount_percentage')) {
                                BranchProductSize::where('branch_product_id', $branchProduct->id)
                                    ->update([
                                        'discount_percentage' => $request->discount_percentage,
                                        'is_discount_active' => 1
                                    ]);
                            }
                            break;
                            
                        case 'remove_discount':
                            BranchProductSize::where('branch_product_id', $branchProduct->id)
                                ->update(['is_discount_active' => 0]);
                            break;
                    }
                }
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Bulk update completed successfully!'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to perform bulk update: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get product size pricing for API
     */
    public function apiGetPricing($branchId, $productId)
    {
        $product = Product::with([
            'sizes' => function ($query) {
                $query->orderBy('sort_order', 'asc');
            },
            'branchProductSizes' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            }
        ])->findOrFail($productId);
        
        $sizes = $product->sizes->map(function ($size) use ($branchId, $productId) {
            $branchProduct = BranchProduct::where('branch_id', $branchId)
                ->where('product_id', $productId)
                ->first();
            
            if (!$branchProduct) {
                return null;
            }
            
            $branchProductSize = BranchProductSize::where('branch_product_id', $branchProduct->id)
                ->where('size_id', $size->id)
                ->first();
            
            $basePrice = $size->pivot->base_price ?? 0;
            $branchPrice = $branchProductSize ? $branchProductSize->branch_size_price : $basePrice;
            $hasDiscount = $branchProductSize ? $branchProductSize->is_discount_active : false;
            $discountPercent = $branchProductSize ? $branchProductSize->discount_percentage : 0;
            
            return [
                'id' => $size->id,
                'name' => $size->name,
                'base_price' => (float) $basePrice,
                'branch_price' => $branchPrice ? (float) $branchPrice : (float) $basePrice,
                'has_discount' => $hasDiscount,
                'discount_percentage' => (float) $discountPercent,
                'final_price' => $hasDiscount 
                    ? round($branchPrice * (1 - $discountPercent / 100), 2)
                    : (float) $branchPrice,
                'is_available' => $branchProductSize ? (bool) $branchProductSize->is_available : true
            ];
        })->filter();
        
        return response()->json([
            'product' => $product->only(['id', 'name', 'has_multiple_sizes']),
            'sizes' => $sizes
        ]);
    }

    /**
     * Export branch product prices to CSV
     */
    public function export($branchId)
    {
        $branch = Branch::findOrFail($branchId);
        
        $products = Product::with([
            'category',
            'sizes',
            'branchProductSizes' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId)
                    ->with('size');
            }
        ])
        ->where('owner_id', $branch->owner_id)
        ->where('has_multiple_sizes', 1)
        ->get();
        
        $filename = "branch-{$branchId}-product-prices-" . date('Y-m-d') . ".csv";
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename={$filename}",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];
        
        $callback = function () use ($products) {
            $file = fopen('php://output', 'w');
            
            // Add CSV headers
            fputcsv($file, [
                'Product ID',
                'Product Name',
                'Category',
                'Size ID',
                'Size Name',
                'Base Price',
                'Branch Price',
                'Discount %',
                'Discount Active',
                'Final Price',
                'Available'
            ]);
            
            // Add data rows
            foreach ($products as $product) {
                if ($product->sizes->count() > 0) {
                    foreach ($product->sizes as $size) {
                        $branchProductSize = $product->branchProductSizes->firstWhere('size_id', $size->id);
                        
                        $basePrice = $size->pivot->base_price ?? 0;
                        $branchPrice = $branchProductSize ? $branchProductSize->branch_size_price : $basePrice;
                        $finalPrice = $branchPrice;
                        
                        if ($branchProductSize && $branchProductSize->is_discount_active) {
                            $finalPrice = round($branchPrice * (1 - $branchProductSize->discount_percentage / 100), 2);
                        }
                        
                        fputcsv($file, [
                            $product->id,
                            $product->name,
                            $product->category->name ?? '',
                            $size->id,
                            $size->name,
                            $basePrice,
                            $branchPrice,
                            $branchProductSize ? $branchProductSize->discount_percentage : 0,
                            $branchProductSize ? ($branchProductSize->is_discount_active ? 'Yes' : 'No') : 'No',
                            $finalPrice,
                            $branchProductSize ? ($branchProductSize->is_available ? 'Yes' : 'No') : 'Yes'
                        ]);
                    }
                }
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }
}