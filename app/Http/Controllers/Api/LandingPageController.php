<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LandingPageSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LandingPageController extends Controller
{
    /**
     * Get all landing page settings (Formatted as key-value pairs)
     */
    public function index()
    {
        $settings = LandingPageSetting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    /**
     * Update landing page settings
     */
    public function update(Request $request)
    {
        // Validation: Allow both scalar values and files
        $request->validate([
            'settings' => 'required', // Can be array (if JSON) or json_encoded string (if FormData)
            'logo' => 'nullable|image|max:2048' // Max 2MB
        ]);

        // 1. Handle Settings
        // If coming from FormData, 'settings' might be a JSON string.
        $settingsInput = $request->input('settings');
        if (is_string($settingsInput)) {
            $settingsData = json_decode($settingsInput, true);
        } else {
            $settingsData = $settingsInput;
        }

        if (is_array($settingsData)) {
            foreach ($settingsData as $key => $value) {
                // Skip if value is null
                if ($value === null)
                    continue;

                LandingPageSetting::updateOrCreate(
                    ['key' => $key],
                    ['value' => is_array($value) ? json_encode($value) : $value]
                );
            }
        }

        // 2. Handle Logo Upload
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('landing-page', 'public');
            // Assuming default storage link is set up (php artisan storage:link)
            // Save relative path or full URL. Let's save the path and let frontend handle /storage prefix
            LandingPageSetting::updateOrCreate(
                ['key' => 'logo'],
                ['value' => $path]
            );
        }

        // 3. Handle About Image Upload
        if ($request->hasFile('about_image')) {
            $path = $request->file('about_image')->store('landing-page', 'public');
            LandingPageSetting::updateOrCreate(
                ['key' => 'about_image'],
                ['value' => $path]
            );
        }

        return response()->json(['message' => 'Settings updated successfully']);
    }
}
