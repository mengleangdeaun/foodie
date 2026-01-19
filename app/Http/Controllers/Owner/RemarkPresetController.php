<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\RemarkPreset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RemarkPresetController extends Controller
{
public function index()
{
    // Get all presets owned by this user with their relationships
    return RemarkPreset::where('owner_id', Auth::id())
        ->with(['categories:id,name', 'branches:id,branch_name'])
        ->withCount(['categories', 'branches'])
        ->latest()
        ->get();
}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'options' => 'required|array|min:1',
            'type' => 'required|in:single,multiple',
            'is_required' => 'boolean',
            'category_ids' => 'array',
            'branch_ids' => 'array',
        ]);

        $preset = RemarkPreset::create([
            'owner_id' => Auth::id(),
            'name' => $validated['name'],
            'options' => $validated['options'],
            'type' => $validated['type'],
            'is_required' => $validated['is_required'] ?? false,
        ]);

        // Sync relationships in pivot tables
        if (!empty($validated['category_ids'])) {
            $preset->categories()->sync($validated['category_ids']);
        }
        if (!empty($validated['branch_ids'])) {
            $preset->branches()->sync($validated['branch_ids']);
        }

        return response()->json($preset->load(['categories', 'branches']));
    }

    // NEW UPDATE FUNCTION
    public function update(Request $request, $id)
    {
        // Find the remark preset and ensure it belongs to the current user
        $remarkPreset = RemarkPreset::where('owner_id', Auth::id())
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'options' => 'required|array|min:1',
            'type' => 'required|in:single,multiple',
            'is_required' => 'boolean',
        ]);

        // Update the remark preset
        $remarkPreset->update([
            'name' => $validated['name'],
            'options' => $validated['options'],
            'type' => $validated['type'],
            'is_required' => $validated['is_required'] ?? false,
        ]);

        // Note: We don't update branch/category relationships here
        // Those are managed separately via the sync endpoint

        return response()->json($remarkPreset->load(['categories', 'branches']));
    }

    public function destroy($id)
    {
        // Find and ensure owner owns the preset before deleting
        $remarkPreset = RemarkPreset::where('owner_id', Auth::id())
            ->findOrFail($id);
        
        $remarkPreset->delete();
        
        return response()->json([
            'message' => 'Remark preset deleted successfully'
        ]);
    }

    public function sync(Request $request, $id)
    {
        $validated = $request->validate([
            'branch_ids' => 'array',
            'category_ids' => 'array',
        ]);

        $preset = RemarkPreset::where('owner_id', Auth::id())
            ->findOrFail($id);

        // Synchronize both pivots
        $preset->branches()->sync($validated['branch_ids'] ?? []);
        $preset->categories()->sync($validated['category_ids'] ?? []);

        return response()->json([
            'message' => 'Library synced successfully',
            'preset' => $preset->load(['branches', 'categories'])
        ]);
    }
}