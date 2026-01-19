<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Branch;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

class BranchInventoryController extends Controller
{
    /**
     * Get all products with pivot data, tags, and sizes for a specific branch.
     */
public function index(Request $request, $branch)
    {
        $ownerId = Auth::user()->owner_id;
        $branchModel = Branch::where('owner_id', $ownerId)->findOrFail($branch);

        $products = Product::where('owner_id', $ownerId)
            ->where('is_active', true)
            ->with(['category', 'tags', 'sizes', 'branches' => function($query) use ($branchModel) {
                $query->where('branch_id', $branchModel->id);
            }])
            ->whereHas('category', function($query) {
            $query->where('is_active', true); // 2. Only products in active categories
        })
            ->get()
            ->map(function($product) {
                $branchPivot = $product->branches->first();

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'category_id' => $product->category_id,
                    'category_name' => $product->category->name ?? null,
                    'base_price' => $product->base_price,
                    'image_path' => $product->image_path,
                    'tags' => $product->tags, 
                    'sizes' => $product->sizes,
                    'pivot' => [
                        'branch_price' => $branchPivot->pivot->branch_price ?? $product->base_price,
                        'sort_order' => (int)($branchPivot->pivot->sort_order ?? 0),
                        'is_available' => (bool) ($branchPivot->pivot->is_available ?? false),
                        // Correct naming here:
                        'discount_percentage' => $branchPivot->pivot->discount_percentage ?? $product->discount_percentage,
                        'has_active_discount' => (bool) ($branchPivot->pivot->has_active_discount ?? $product->has_active_discount),
                        // Marketing Flags
                        'is_popular' => (bool) ($branchPivot->pivot->is_popular ?? false),
                        'is_signature' => (bool) ($branchPivot->pivot->is_signature ?? false),
                        'is_chef_recommendation' => (bool) ($branchPivot->pivot->is_chef_recommendation ?? false),
                    ]
                ];
            });

        return response()->json($products);
    }

    public function update(Request $request, $branch, $product)
    {
        $branchModel = Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($branch);
        
        $validated = $request->validate([
            'branch_price' => 'nullable|numeric|min:0',
            'sort_order' => 'nullable|integer|min:0',
            'is_available' => 'nullable|boolean',
            'discount_percentage' => 'nullable|integer|min:0|max:100',
            'has_active_discount' => 'nullable|boolean', // Added validation
            'is_popular' => 'nullable|boolean',
            'is_signature' => 'nullable|boolean',
            'is_chef_recommendation' => 'nullable|boolean',
        ]);

        $branchModel->products()->syncWithoutDetaching([$product]);

        $updateData = collect($validated)->filter(fn($val) => !is_null($val))->toArray();

        if (!empty($updateData)) {
            $branchModel->products()->updateExistingPivot($product, $updateData);
        }

        return response()->json(['message' => 'Branch inventory updated successfully']);
    }

    /**
     * Bulk update availability or marketing flags for multiple products.
     */
    public function bulkUpdate(Request $request, $branch)
    {
        $branchModel = Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($branch);

        $validated = $request->validate([
            'product_ids' => 'required|array',
            'product_ids.*' => 'exists:products,id',
            'is_available' => 'nullable|boolean',
            'is_popular' => 'nullable|boolean',
            'is_signature' => 'nullable|boolean',
            'is_chef_recommendation' => 'nullable|boolean',
        ]);

        $updateData = collect($validated)
            ->only(['is_available', 'is_popular', 'is_signature', 'is_chef_recommendation'])
            ->filter(fn($val) => !is_null($val))
            ->toArray();

        if (!empty($updateData)) {
            $branchModel->products()->syncWithoutDetaching($validated['product_ids']);
            
            foreach ($validated['product_ids'] as $id) {
                $branchModel->products()->updateExistingPivot($id, $updateData);
            }
        }

        return response()->json(['message' => 'Bulk update successful']);
    }

    public function bulkReorder(Request $request, $branch)
{
    $request->validate([
        'orders' => 'required|array',
        'orders.*.product_id' => 'required|exists:products,id',
        'orders.*.sort_order' => 'required|integer',
    ]);

    $branchModel = Branch::findOrFail($branch);

    foreach ($request->orders as $order) {
        $branchModel->products()->updateExistingPivot($order['product_id'], [
            'sort_order' => $order['sort_order']
        ]);
    }

    return response()->json(['message' => 'Menu order updated successfully']);
}
}