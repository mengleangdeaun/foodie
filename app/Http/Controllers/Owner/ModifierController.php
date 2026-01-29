<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Modifier;
use App\Models\ModifierGroup;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ModifierController extends Controller
{
    /**
     * Display all modifier groups for the owner.
     */
    public function index()
    {
        $user = Auth::user();
        $query = ModifierGroup::query();

        // 1. Scoping: Owner vs Staff
        if ($user->role === 'owner') {
            // For Owner: Show items linked to Owner Entity ID OR their User ID (legacy support for old data)
            $query->where(function ($q) use ($user) {
                $q->where('owner_id', $user->owner_id)
                    ->orWhere('owner_id', $user->id);
            });
        } else {
            // For Staff: Strictly use the Owner Entity ID
            $query->where(function ($q) use ($user) {
                $q->where('owner_id', $user->owner_id)
                    ->orWhere('owner_id', $user->owner->user_id ?? 0); // Try to match legacy owner user id if possible
            });
        }

        $groups = $query->with('modifiers')
            ->withCount('products')
            ->latest()
            ->get();

        return response()->json($groups);
    }

    /**
     * Store a new group and its nested modifiers.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'selection_type' => 'required|in:single,multiple',
            'min_selection' => 'required|integer|min:0',
            'max_selection' => 'nullable|integer|min:1',
            'modifiers' => 'required|array|min:1',
            'modifiers.*.name' => 'required|string',
            'modifiers.*.price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $group = ModifierGroup::create([
                'owner_id' => Auth::user()->owner_id,
                'name' => $validated['name'],
                'selection_type' => $validated['selection_type'],
                'min_selection' => $validated['min_selection'],
                'max_selection' => $validated['max_selection'],
            ]);

            foreach ($validated['modifiers'] as $mod) {
                $group->modifiers()->create([
                    'name' => $mod['name'],
                    'price' => $mod['price'],
                ]);
            }

            return response()->json($group->load('modifiers'), 201);
        });
    }

    /**
     * Update the group and sync its modifiers.
     */
    // app/Http/Controllers/Owner/ModifierController.php

    /**
     * Update the group and sync its modifiers.
     * THE FIX: Variable MUST be $modifier to match the Route Resource name
     */
    public function update(Request $request, ModifierGroup $modifier)
    {
        // FIX: Use == instead of !== to handle String vs Integer automatically
        // AND: Ensure $modifier is correctly bound by Laravel
        if ($modifier->owner_id != Auth::user()->owner_id) {
            return response()->json([
                'message' => 'Unauthorized',
                'debug_info' => [
                    'group_owner' => $modifier->owner_id,
                    'user_owner' => Auth::user()->owner_id,
                    'group_id' => $modifier->id
                ]
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string',
            'selection_type' => 'required|in:single,multiple',
            'min_selection' => 'required|integer',
            'max_selection' => 'nullable|integer',
            'is_active' => 'required|boolean', // ADD THIS
            'modifiers' => 'required|array',
            'modifiers.*.id' => 'nullable|integer',
            'modifiers.*.name' => 'required|string',
            'modifiers.*.price' => 'required|numeric',
            'modifiers.*.is_available' => 'required|boolean',
        ]);

        return DB::transaction(function () use ($validated, $modifier) {
            $modifier->update($validated);

            $existingIds = collect($validated['modifiers'])->pluck('id')->filter()->toArray();
            $modifier->modifiers()->whereNotIn('id', $existingIds)->delete();

            foreach ($validated['modifiers'] as $modData) {
                if (isset($modData['id'])) {
                    Modifier::where('id', $modData['id'])->update([
                        'name' => $modData['name'],
                        'price' => $modData['price'],
                        'is_available' => $modData['is_available'],
                    ]);
                } else {
                    $modifier->modifiers()->create($modData);
                }
            }

            return response()->json($modifier->load('modifiers'));
        });
    }

    /**
     * Remove the group.
     * THE FIX: Variable MUST be $modifier
     */
    public function destroy(ModifierGroup $modifier)
    {
        if ($modifier->owner_id != Auth::user()->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $modifier->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * Attach/Detach groups to a specific product.
     */
    public function syncProductGroups(Request $request, $productId)
    {
        $request->validate([
            'group_ids' => 'array',
            'group_ids.*' => 'exists:modifier_groups,id'
        ]);

        $product = \App\Models\Product::findOrFail($productId);

        // Use sync to replace existing links with new ones
        $product->modifierGroups()->sync($request->group_ids);

        return response()->json(['message' => 'Modifiers linked to product successfully']);
    }




    public function bulkSync(Request $request)
    {
        $validated = $request->validate([
            'product_ids' => 'required|array|min:1',
            'product_ids.*' => 'exists:products,id',
            'modifier_group_ids' => 'required|array',
            'modifier_group_ids.*' => 'exists:modifier_groups,id',
            'action' => 'required|in:attach,sync,detach' // Added 'detach'
        ]);

        return DB::transaction(function () use ($validated) {
            $products = \App\Models\Product::whereIn('id', $validated['product_ids'])->get();

            foreach ($products as $product) {
                if ($validated['action'] === 'sync') {
                    $product->modifierGroups()->sync($validated['modifier_group_ids']);
                } elseif ($validated['action'] === 'detach') {
                    // REMOVE ONLY the selected groups from these products
                    $product->modifierGroups()->detach($validated['modifier_group_ids']);
                } else {
                    // ATTACH (Sync without detaching others)
                    $product->modifierGroups()->syncWithoutDetaching($validated['modifier_group_ids']);
                }
            }

            return response()->json(['message' => 'Bulk operation successful']);
        });
    }


}