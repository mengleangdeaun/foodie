<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str; 

class CategoryController extends Controller
{
    public function index()
    {
        // Use withCount to automatically add 'products_count' to each category object
        return response()->json(
            Category::where('owner_id', Auth::user()->owner_id)
                ->withCount('products') 
                ->get()
        );
    }
    public function showCategory()
    {
        // Use withCount to automatically add 'products_count' to each category object
        return response()->json(
            Category::where('owner_id', Auth::user()->owner_id)
                ->where('is_active', true)
                ->get()
        );
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:100']);

        $category = Category::create([
            'owner_id'  => Auth::user()->owner_id,
            'name'      => $request->name,
            // Slugs should be unique; adding owner_id helps prevent collisions across owners
            'slug'      => Str::slug($request->name . '-' . Auth::user()->owner_id), 
            'is_active' => true
        ]);

        // Return count as 0 for a new category
        $category->products_count = 0;

        return response()->json($category, 201);
    }

public function update(Request $request, $id)
{
    $category = Category::where('owner_id', Auth::user()->owner_id)->findOrFail($id);
    
    // We make fields optional using 'sometimes' so we can update name OR is_active independently
    $validated = $request->validate([
        'name'      => 'sometimes|required|string|max:100',
        'is_active' => 'sometimes|required|boolean'
    ]);
    
    if ($request->has('name')) {
        $validated['slug'] = Str::slug($request->name . '-' . Auth::user()->owner_id);
    }

    $category->update($validated);

    return response()->json($category->loadCount('products'));
}

    public function destroy($id)
    {
        $category = Category::where('owner_id', Auth::user()->owner_id)
            ->withCount('products')
            ->findOrFail($id);

        // Security check: Prevent deletion if products exist
        if ($category->products_count > 0) {
            return response()->json([
                'message' => "Cannot delete: This category contains {$category->products_count} products. Move them first."
            ], 422);
        }

        $category->delete();
        return response()->json(['message' => 'Category deleted']);
    }
}