<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Size;
use App\Models\BranchProduct;
use App\Models\BranchProductSize;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BranchProductSizeApiController extends Controller
{
    /**
     * Get product sizes with branch-specific pricing
     */
    public function index($branchId, $productId)
    {
        try {
            // Get the authenticated user
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }
            
            // Find the branch - check by ID first, then try to find by owner_id
            $branch = null;
            
            // If user is super_admin, find any branch
            if ($user->role === 'super_admin') {
                $branch = Branch::find($branchId);
            } 
            // If user is owner, find branch by owner_id
            elseif ($user->role === 'owner') {
                $branch = Branch::where('id', $branchId)
                    ->where('owner_id', $user->owner_id ?? $user->id) // FIXED: Added null coalescing
                    ->first();
            }
            // If user is staff, check if they're assigned to this branch
            elseif (in_array($user->role, ['staff', 'manager', 'chef'])) {
                if ($user->branch_id && (int)$user->branch_id === (int)$branchId) {
                    $branch = Branch::find($branchId);
                }
            }
            
            if (!$branch) {
                return response()->json(['error' => 'Branch not found or access denied'], 404);
            }
            
            // Get owner_id from branch
            $ownerId = $branch->owner_id;
            
            // Find the product
            $product = Product::with([
                'sizes' => function($query) {
                    $query->orderBy('name');
                },
                'category'
            ])->where('owner_id', $ownerId)
              ->find($productId);
            
            if (!$product) {
                return response()->json(['error' => 'Product not found or does not belong to this owner'], 404);
            }
            
            // Get or create branch product record
            $branchProduct = BranchProduct::firstOrCreate(
                [
                    'branch_id' => $branchId,
                    'product_id' => $productId
                ],
                [
                    'is_available' => true,
                    'branch_price' => $product->base_price // FIXED: Use product base price, not branch price
                ]
            );
            
            // Prepare sizes data with branch pricing
            $sizes = $product->sizes->map(function($size) use ($branchProduct, $product) {
                $branchProductSize = BranchProductSize::where('branch_product_id', $branchProduct->id)
                    ->where('size_id', $size->id)
                    ->first();
                
                // Determine the price source
                $priceSource = 'product_base';
                $effectivePrice = $product->base_price;
                
                // Check branch product price (overrides product base price)
                if ($branchProduct && $branchProduct->branch_price !== null) {
                    $effectivePrice = $branchProduct->branch_price;
                    $priceSource = 'branch_product';
                }
                
                // Check size-specific branch price (overrides branch product price)
                if ($branchProductSize && $branchProductSize->branch_size_price !== null) {
                    $effectivePrice = $branchProductSize->branch_size_price;
                    $priceSource = 'branch_size';
                }
                
                // Determine discount
                $discountPercentage = 0;
                $isDiscountActive = false;
                $discountSource = 'none';
                
                // Check branch product discount
                if ($branchProduct && $branchProduct->has_active_discount) {
                    $discountPercentage = $branchProduct->discount_percentage ?? 0;
                    $isDiscountActive = true;
                    $discountSource = 'branch_product';
                }
                
                // Check size-specific discount (overrides)
                if ($branchProductSize && $branchProductSize->is_discount_active) {
                    $discountPercentage = $branchProductSize->discount_percentage ?? 0;
                    $isDiscountActive = true;
                    $discountSource = 'branch_size';
                }
                
                // Calculate final price
                $finalPrice = $effectivePrice;
                if ($isDiscountActive && $discountPercentage > 0) {
                    $finalPrice = $effectivePrice * (1 - $discountPercentage / 100);
                }
                
return [
    'size_id' => $size->id,
    'size_name' => $size->name,

    // Price information (keep as string/decimal)
    'product_base_price' => $product->base_price,
    'branch_product_price' => $branchProduct?->branch_price,
    'branch_size_price' => $branchProductSize?->branch_size_price,
    'effective_base_price' => $effectivePrice,
    'price_source' => $priceSource,

    // Discount information
    'discount_percentage' => $discountPercentage,
    'is_discount_active' => $isDiscountActive,
    'discount_source' => $discountSource,

    // Final price (round once)
    'final_price' => round($finalPrice, 2, PHP_ROUND_HALF_UP),

    // Availability
    'is_available' => $branchProductSize?->is_available ?? true,
];

            });
            
            return response()->json([
                'success' => true,
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'base_price' => (float) $product->base_price,
                    'category_name' => $product->category->name ?? null,
                    'has_sizes' => $product->sizes->count() > 0
                ],
                'branch_product_id' => $branchProduct->id,
                'sizes' => $sizes
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error fetching branch product sizes:', [
                'error' => $e->getMessage(),
                'branch_id' => $branchId,
                'product_id' => $productId,
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to load sizes: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update branch product size pricing
     */
    public function update(Request $request, $branchId, $productId)
    {
        try {
            $request->validate([
                'sizes' => 'required|array',
                'sizes.*.size_id' => 'required|exists:sizes,id',
                'sizes.*.branch_size_price' => 'nullable|numeric|min:0',
                'sizes.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
                'sizes.*.is_discount_active' => 'boolean',
                'sizes.*.is_available' => 'boolean',
            ]);
            
            $user = Auth::user();
            $branch = Branch::find($branchId);
            
            if (!$branch) {
                return response()->json(['error' => 'Branch not found'], 404);
            }
            
            // Check authorization
            if ($user->role === 'owner' && $branch->owner_id !== ($user->owner_id ?? $user->id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            // Check staff authorization
            if (in_array($user->role, ['staff', 'manager', 'chef']) && 
                (!$user->branch_id || (int)$user->branch_id !== (int)$branchId)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            $branchProduct = BranchProduct::where('branch_id', $branchId)
                ->where('product_id', $productId)
                ->first();
            
            if (!$branchProduct) {
                return response()->json(['error' => 'Product not available in this branch'], 404);
            }
            
            DB::beginTransaction();
            
            foreach ($request->sizes as $sizeData) {
                BranchProductSize::updateOrCreate(
                    [
                        'branch_product_id' => $branchProduct->id,
                        'size_id' => $sizeData['size_id']
                    ],
                    [
                        'branch_size_price' => isset($sizeData['branch_size_price']) && $sizeData['branch_size_price'] !== '' 
                            ? $sizeData['branch_size_price'] 
                            : null,
                        'discount_percentage' => $sizeData['discount_percentage'] ?? 0,
                        'is_discount_active' => $sizeData['is_discount_active'] ?? false,
                        'is_available' => $sizeData['is_available'] ?? true,
                    ]
                );
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Size prices updated successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating branch product sizes:', [
                'error' => $e->getMessage(),
                'branch_id' => $branchId,
                'product_id' => $productId
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update size prices',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Bulk update availability or discounts for multiple sizes
     */
    public function bulkUpdate(Request $request, $branchId, $productId)
    {
        try {
            $request->validate([
                'size_ids' => 'required|array',
                'size_ids.*' => 'exists:sizes,id',
                'is_available' => 'nullable|boolean',
                'is_discount_active' => 'nullable|boolean',
                'discount_percentage' => 'nullable|numeric|min:0|max:100',
                'branch_size_price' => 'nullable|numeric|min:0', // Added for bulk price updates
            ]);
            
            $user = Auth::user();
            $branch = Branch::find($branchId);
            
            if (!$branch) {
                return response()->json(['error' => 'Branch not found'], 404);
            }
            
            // Check authorization
            if ($user->role === 'owner' && $branch->owner_id !== ($user->owner_id ?? $user->id)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            // Check staff authorization
            if (in_array($user->role, ['staff', 'manager', 'chef']) && 
                (!$user->branch_id || (int)$user->branch_id !== (int)$branchId)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
            
            $branchProduct = BranchProduct::where('branch_id', $branchId)
                ->where('product_id', $productId)
                ->first();
            
            if (!$branchProduct) {
                return response()->json(['error' => 'Product not available in this branch'], 404);
            }
            
            $updateData = $request->only(['is_available', 'is_discount_active', 'discount_percentage', 'branch_size_price']);
            $updateData = array_filter($updateData, function($value) {
                return !is_null($value);
            });
            
            // Handle clearing of custom price
            if ($request->has('branch_size_price') && $request->branch_size_price === '') {
                $updateData['branch_size_price'] = null;
            }
            
            if (empty($updateData)) {
                return response()->json(['error' => 'No data to update'], 400);
            }
            
            DB::beginTransaction();
            
            // For each size, update or create the record
            foreach ($request->size_ids as $sizeId) {
                BranchProductSize::updateOrCreate(
                    [
                        'branch_product_id' => $branchProduct->id,
                        'size_id' => $sizeId
                    ],
                    $updateData
                );
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Bulk update successful'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error in bulk update:', [
                'error' => $e->getMessage(),
                'branch_id' => $branchId,
                'product_id' => $productId
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Bulk update failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}