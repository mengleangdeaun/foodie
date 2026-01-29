<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\DeliveryPartner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;
// Intervention Image v3


class DeliveryPartnerController extends Controller
{

    public function index()
    {
        $user = Auth::user();
        $query = DeliveryPartner::query();

        if ($user->role === 'owner') {
            $query->where(function ($q) use ($user) {
                $q->where('owner_id', $user->owner_id)
                    ->orWhere('owner_id', $user->id);
            });
        } else {
            $ownerUserId = optional($user->owner)->user_id ?? 0;
            $query->where(function ($q) use ($user, $ownerUserId) {
                $q->where('owner_id', $user->owner_id)
                    ->orWhere('owner_id', $ownerUserId);
            });
        }

        return $query->get();
    }

    public function data_for_pos()
    {
        $user = Auth::user();
        $query = DeliveryPartner::where('is_active', 1);

        if ($user->role === 'owner') {
            $query->where(function ($q) use ($user) {
                $q->where('owner_id', $user->owner_id)
                    ->orWhere('owner_id', $user->id);
            });
        } else {
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
        $request->validate([
            'name' => 'required|string',
            'discount_percentage' => 'required|numeric',
            // 'image' check ensures it's a valid jpeg, png, bmp, gif, svg, or webp
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
        ]);

        $data = $request->all();

        // Check if the file was actually uploaded and recognized
        if ($request->hasFile('logo')) {
            $data['logo'] = $this->uploadAndOptimize($request->file('logo'));
        }

        $partner = DeliveryPartner::create($data);
        return response()->json($partner, 201);
    }

    public function update(Request $request, $id)
    {
        // Ensure the partner belongs to the authenticated owner
        $partner = DeliveryPartner::where('owner_id', Auth::user()->owner_id)->findOrFail($id);

        // Update validation to include boolean toggles
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'discount_percentage' => 'sometimes|numeric|min:0',
            'logo' => 'nullable|image|max:2048',
            'is_active' => 'sometimes|boolean',
            'is_discount_active' => 'sometimes|boolean',
            'remove_image' => 'nullable|string',
            // Restored toggle validation
        ]);

        // Use validated data to prevent unauthorized field injection
        $data = $request->except(['logo', 'remove_image']);

        if ($request->has('remove_image') && $request->input('remove_image') === 'true') {
            // Delete old logo from storage if it exists to save space
            if ($partner->logo) {
                // str_replace ensures we get the relative path for the Storage disk
                $oldPath = str_replace('/storage/', '', $partner->logo);
                Storage::disk('public')->delete($oldPath);
            }
            // Optimize and convert new logo to WebP
            $data['logo'] = null;
        } elseif ($request->hasFile('logo')) {
            // Upload new image and delete old one
            if ($partner->logo) {
                $oldPath = str_replace('/storage/', '', $partner->logo);
                Storage::disk('public')->delete($oldPath);
            }
            $data['logo'] = $this->uploadAndOptimize($request->file('logo'));
        }

        $partner->update($data);

        return response()->json($partner);
    }

    /**
     * Helper to compress and convert to WebP
     */
    private function uploadAndOptimize($file)
    {
        // 1. Generate unique filename with .webp extension
        $fileName = 'partners/' . uniqid() . '.webp';

        // 2. Read, resize, and encode to WebP with 80% quality
        $encoded = Image::read($file)
            ->cover(200, 200)
            ->toWebp(80);

        // 3. FIX: Cast the encoded object to (string) to get binary data
        Storage::disk('public')->put($fileName, (string) $encoded);

        // 4. Return the public URL
        return Storage::url($fileName);
    }

}


