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
        return Tag::where('owner_id', Auth::user()->owner_id)->get();
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
        if ($tag->owner_id != Auth::user()->owner_id) return response()->json(['error' => 'Unauthorized'], 403);
        
        $tag->update($request->all());
        return $tag;
    }

    public function destroy(Tag $tag)
    {
        if ($tag->owner_id != Auth::user()->owner_id) return response()->json(['error' => 'Unauthorized'], 403);
        $tag->delete();
        return response()->json(['message' => 'Tag removed']);
    }
}