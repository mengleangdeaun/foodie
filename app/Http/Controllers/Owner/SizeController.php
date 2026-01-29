<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Size;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SizeController extends Controller
{
    /**
     * Display a listing of the sizes for the authenticated owner.
     */
    public function index()
    {
        $user = Auth::user();
        $query = Size::query();

        // 1. Scoping: Owner vs Staff
        if ($user->role === 'owner') {
            $query->where(function ($q) use ($user) {
                $q->where('owner_id', $user->owner_id)
                    ->orWhere('owner_id', $user->id);
            });
        } else {
            // Use optional() for safety
            $ownerUserId = optional($user->owner)->user_id ?? 0;
            $query->where(function ($q) use ($user, $ownerUserId) {
                $q->where('owner_id', $user->owner_id)
                    ->orWhere('owner_id', $ownerUserId);
            });
        }

        return $query->latest()->get();
    }

    /**
     * Store a newly created size in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50', // e.g., "Medium", "700ml", "12oz"
        ]);

        $validated['owner_id'] = Auth::user()->owner_id;

        $size = Size::create($validated);

        return response()->json($size, 201);
    }

    /**
     * Update the specified size in storage.
     */
    public function update(Request $request, Size $size)
    {
        // Security: Ensure the size belongs to the owner
        if ($size->owner_id != Auth::user()->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:50',
        ]);

        $size->update($validated);

        return response()->json($size);
    }

    /**
     * Remove the specified size from storage.
     */
    public function destroy(Size $size)
    {
        // Security: Ensure the size belongs to the owner
        if ($size->owner_id != Auth::user()->owner_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Note: Laravel will automatically handle the pivot table 
        // cleanup if you have 'onDelete(cascade)' in your migration.
        $size->delete();

        return response()->json(['message' => 'Size deleted successfully']);
    }
}