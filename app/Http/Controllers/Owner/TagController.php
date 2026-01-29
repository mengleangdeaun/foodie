<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Tag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TagController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $query = Tag::query();

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

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'icon_type' => 'nullable|string',
            'color_type' => 'required|in:primary,secondary,accent,danger'
        ]);

        $validated['owner_id'] = Auth::user()->owner_id;
        return Tag::create($validated);
    }

    public function update(Request $request, Tag $tag)
    {
        if ($tag->owner_id != Auth::user()->owner_id)
            return response()->json(['error' => 'Unauthorized'], 403);

        $tag->update($request->all());
        return $tag;
    }

    public function destroy(Tag $tag)
    {
        if ($tag->owner_id != Auth::user()->owner_id)
            return response()->json(['error' => 'Unauthorized'], 403);
        $tag->delete();
        return response()->json(['message' => 'Tag removed']);
    }
}