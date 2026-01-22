<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Product;
use App\Models\BranchProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image; 

class ProductController extends Controller
{
    /**
     * Get all products with eager loaded Master Data.
     */
    public function index()
    {
        return Product::with(['category', 'modifierGroups.modifiers', 'tags', 'sizes'])
            ->where('owner_id', Auth::user()->owner_id)
            ->whereHas('category', function($query) {
                $query->where('is_active', true); // 2. Only products in active categories
            })
            ->latest()
            ->get();
    }

    /**
     * Store a new Master Product with Tags and Sizes.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'base_price' => 'required|numeric|min:0',
            'short_description' => 'nullable|string|max:150',
            'description' => 'nullable|string',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5048',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'size_ids' => 'nullable|array',
            'size_ids.*' => 'exists:sizes,id',
            'modifier_group_ids' => 'nullable|array',
            'modifier_group_ids.*' => 'exists:modifier_groups,id',
            'is_popular' => 'nullable|boolean',
            'is_signature' => 'nullable|boolean',
            'is_chef_recommendation' => 'nullable|boolean',
        ]);

        $data = [
            'owner_id' => Auth::user()->owner_id,
            'category_id' => $validated['category_id'],
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name'] . '-' . Auth::user()->owner_id . '-' . Str::random(5)),
            'base_price' => $validated['base_price'],
            'short_description' => $validated['short_description'],
            'description' => $validated['description'],
            'discount_percentage' => $validated['discount_percentage'] ?? 0,
            'is_discount_active' => ($validated['discount_percentage'] ?? 0) > 0,
            'is_active' => true,
            'is_popular' => $request->boolean('is_popular'),
            'is_signature' => $request->boolean('is_signature'),
            'is_chef_recommendation' => $request->boolean('is_chef_recommendation'),
        ];

        if ($request->hasFile('image')) {
            $data['image_path'] = $this->uploadAndOptimize($request->file('image'));
        }

        $product = Product::create($data);

        // Sync Relationships
        if ($request->has('tag_ids')) $product->tags()->sync($request->tag_ids);
        if ($request->has('size_ids')) $product->sizes()->sync($request->size_ids);
        if ($request->has('modifier_group_ids')) $product->modifierGroups()->sync($request->modifier_group_ids);

        return response()->json($product->load(['tags', 'sizes', 'modifierGroups.modifiers']), 201);
    }

    /**
     * Update product and its Master Data relationships.
     */
    public function update(Request $request, $id)
    {
        $product = Product::where('owner_id', Auth::user()->owner_id)->findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'base_price' => 'sometimes|numeric|min:0',
            'short_description' => 'nullable|string|max:150',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5048',
            'tag_ids' => 'nullable|array',
            'size_ids' => 'nullable|array',
            'modifier_group_ids' => 'nullable|array',
            'is_popular' => 'nullable|boolean',
            'is_signature' => 'nullable|boolean',
            'is_chef_recommendation' => 'nullable|boolean',
            'remove_image' => 'nullable|string',
        ]);

        $data = $request->except(['image', 'tag_ids', 'size_ids', 'modifier_group_ids', 'remove_image']);

        // Handle image removal
        if ($request->has('remove_image') && $request->input('remove_image') === 'true') {
            if ($product->image_path) {
                $oldPath = str_replace('/storage/', '', $product->image_path);
                Storage::disk('public')->delete($oldPath);
            }
            $data['image_path'] = null;
        } elseif ($request->hasFile('image')) {
            if ($product->image_path) {
                $oldPath = str_replace('/storage/', '', $product->image_path);
                Storage::disk('public')->delete($oldPath);
            }
            $data['image_path'] = $this->uploadAndOptimize($request->file('image'));
        }

        $product->update($data);

        // Sync relationships
        if ($request->has('tag_ids')) $product->tags()->sync($request->tag_ids);
        if ($request->has('size_ids')) $product->sizes()->sync($request->size_ids);
        if ($request->has('modifier_group_ids')) $product->modifierGroups()->sync($request->modifier_group_ids);

        return response()->json($product->load(['tags', 'sizes', 'modifierGroups.modifiers']));
    }

    /**
     * Helper: Image Upload & WebP Optimization.
     */
    private function uploadAndOptimize($file)
    {
        $fileName = 'products/' . uniqid() . '.webp';
        $encoded = Image::read($file)->cover(500, 500)->toWebp(80);
        Storage::disk('public')->put($fileName, (string) $encoded);
        return Storage::url($fileName);
    }

 



    /**
     * Get product with all details including branch-specific pricing
     */
    public function getProductWithBranchDetails(Request $request, $id)
    {
        $request->validate(['branch_id' => 'required|exists:branches,id']);
        
        $product = BranchProduct::with([
            'category', 
            'tags', 
            'sizes',
            'modifierGroups' => function($query) {
                $query->where('is_active', true)
                      ->with(['modifiers' => function($query) {
                          $query->where('is_available', true);
                      }]);
            }
        ])->findOrFail($id);

        // Get branch-specific pricing and flags
        $branchProduct = Product::where('product_id', $id)
            ->where('branch_id', $request->branch_id)
            ->first();

        if ($branchProduct) {
            $basePrice = $branchProduct->branch_price ?? $product->base_price;
            $finalPrice = $basePrice;
            
            if ($branchProduct->has_active_discount && $branchProduct->discount_percentage > 0) {
                $discountAmount = $basePrice * ($branchProduct->discount_percentage / 100);
                $finalPrice = $basePrice - $discountAmount;
            }
            
            $product->price = round($finalPrice, 2);
            $product->original_price = $basePrice;
            $product->has_discount = $branchProduct->has_discount_active && $branchProduct->discount_percentage > 0;
            $product->discount_percentage = $branchProduct->discount_percentage;
            $product->is_popular = $branchProduct->is_popular;
            $product->is_signature = $branchProduct->is_signature;
            $product->is_chef_recommendation = $branchProduct->is_chef_recommendation;
        } else {
            $product->price = $product->base_price;
            $product->original_price = $product->base_price;
            $product->has_discount = $product->has_active_discount && $product->discount_percentage > 0;
            $product->discount_percentage = $product->discount_percentage;
        }

        return response()->json($product);
    }
}