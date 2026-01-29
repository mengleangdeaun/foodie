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
        // Fix: Use owner_id instead of Auth::id() so staff can see data
        $query = RemarkPreset::where('owner_id', Auth::user()->owner_id)
            ->with(['categories:id,name', 'branches:id,branch_name'])
            ->withCount(['categories', 'branches']);

        // Filter by branch if user is staff (and thus belongs to a branch)
        // The user requested "shows base on branch"
        $user = Auth::user();
        if ($user->role !== 'owner' && $user->branch_id) {
            // Show global presets (no branch assigned) OR presets assigned to this branch
            $query->where(function ($q) use ($user) {
                $q->doesntHave('branches') // Available to all branches
                    ->orWhereHas('branches', function ($b) use ($user) {
                        $b->where('branches.id', $user->branch_id);
                    });
            });
        }

        return $query->latest()->get();
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
            'owner_id' => Auth::user()->owner_id,
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
        $remarkPreset = RemarkPreset::where('owner_id', Auth::user()->owner_id)
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
        $remarkPreset = RemarkPreset::where('owner_id', Auth::user()->owner_id)
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

        $preset = RemarkPreset::where('owner_id', Auth::user()->owner_id)
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