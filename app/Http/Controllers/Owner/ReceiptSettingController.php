<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\ReceiptSetting;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ReceiptSettingController extends Controller
{
public function show()
{
    $branchId = auth()->user()->branch_id;
    $settings = ReceiptSetting::where('branch_id', $branchId)->first();
    $branch = Branch::find($branchId);

    return response()->json([
        'settings' => $settings,
        'branding_presets' => [
            'colors' => array_filter([$branch->primary_color, $branch->secondary_color, $branch->accent_color]),
            'fonts' => array_filter([$branch->font_family, $branch->font_family_headings]),
            'store_name' => $branch->branch_name
        ]
    ]);
}

 public function update(Request $request)
{
    $branchId = auth()->user()->branch_id;

    $validator = Validator::make($request->all(), [
        'store_name' => 'nullable|string|max:255',
        'primary_color' => 'nullable|string|max:7',
        'font_size_base' => 'nullable|integer|min:8|max:30',
        // POINT 1: Add font_family validation
        'font_family' => 'nullable|string|max:100', 
        'logo_size' => 'nullable|integer|min:40|max:200',
        'qr_code_size' => 'nullable|integer|min:40|max:200',
        'show_logo' => 'nullable|in:1,0,true,false', 
    ]);

    if ($validator->fails()) {
        return response()->json(['errors' => $validator->errors()], 422);
    }

    $settings = ReceiptSetting::firstOrNew(['branch_id' => $branchId]);
    
    // POINT 2: Add 'font_family' to the fillable array
    $data = $request->only([
        'store_name', 'primary_color', 'font_size_base', 'font_family',
        'header_text', 'footer_text', 'show_logo', 'logo_size', 'qr_code_size'
    ]);

    $settings->fill($data);

    // Handle Logo
    if ($request->hasFile('logo')) {
        if ($settings->logo_path) Storage::disk('public')->delete($settings->logo_path);
        $settings->logo_path = $request->file('logo')->store('receipts/logos', 'public');
    }

    // Handle QR
    if ($request->hasFile('qr_code')) {
        if ($settings->qr_code_path) Storage::disk('public')->delete($settings->qr_code_path);
        $settings->qr_code_path = $request->file('qr_code')->store('receipts/qrs', 'public');
    }

    $settings->save();

    return response()->json([
        'message' => 'Settings updated',
        'settings' => $settings->fresh()
    ]);
}
}