<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\ReceiptSetting;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
                'colors' => array_filter([
                    $branch->primary_color, 
                    $branch->secondary_color, 
                    $branch->accent_color
                ]),
                'fonts' => array_filter([
                    $branch->font_family, 
                    $branch->font_family_headings
                ]),
                'store_name' => $branch->branch_name,
                'contact_phone' => $branch->contact_phone,
                'location' => $branch->location, // Branch address
                'tax_name' => $branch->tax_name, // Tax name (e.g., "VAT", "Sales Tax")
                'tax_is_active' => $branch->tax_is_active, // Boolean
                'tax_rate' => $branch->tax_rate, // Percentage (e.g., 10.00)
            ]
        ]);
    }

    public function update(Request $request)
    {
        $branch_id = auth()->user()->branch_id;
        $receiptSetting = ReceiptSetting::where('branch_id', $branch_id)->first();

        // If no settings exist, create them
        if (!$receiptSetting) {
            $receiptSetting = new ReceiptSetting();
            $receiptSetting->branch_id = $branch_id;
            $receiptSetting->save();
        }

        $validated = $request->validate([
            'store_name' => 'nullable|string|max:255',
            'header_text' => 'nullable|string',
            'footer_text' => 'nullable|string',
            'primary_color' => [
                'nullable',
                'string',
                'regex:#^\#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$#'
            ],
            'font_size_base' => 'nullable|integer|min:10|max:20',
            'font_family' => 'nullable|string',
            'logo_size' => 'nullable|integer|min:40|max:180',
            'qr_code_size' => 'nullable|integer|min:40|max:180',
            'show_logo' => 'nullable|boolean',
            'show_qr' => 'nullable|boolean',
            'show_header' => 'nullable|boolean',
            'show_footer' => 'nullable|boolean',
            'show_border' => 'nullable|boolean',
            'show_order_id' => 'nullable|boolean',
            'show_customer_info' => 'nullable|boolean',
            'paper_width' => 'nullable|integer|min:58|max:110',
            'margin_size' => 'nullable|integer|min:5|max:30',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:5120',
            'qr_code' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:5120',
        ]);

        // Handle logo upload
        if ($request->hasFile('logo')) {
            if ($receiptSetting->logo_path) {
                Storage::disk('public')->delete($receiptSetting->logo_path);
            }
            $path = $request->file('logo')->store('receipts/logos', 'public');
            $validated['logo_path'] = $path;
        }

        // Handle QR code upload
        if ($request->hasFile('qr_code')) {
            if ($receiptSetting->qr_code_path) {
                Storage::disk('public')->delete($receiptSetting->qr_code_path);
            }
            $path = $request->file('qr_code')->store('receipts/qrs', 'public');
            $validated['qr_code_path'] = $path;
        }

        // Remove the logo and qr_code from the validated array
        unset($validated['logo']);
        unset($validated['qr_code']);

        // Update the receipt setting
        $receiptSetting->update($validated);

        return response()->json([
            'message' => 'Receipt settings updated successfully',
            'settings' => $receiptSetting->fresh(),
            'logo_url' => $receiptSetting->logo_path ? asset('storage/' . $receiptSetting->logo_path) : null,
            'qr_code_url' => $receiptSetting->qr_code_path ? asset('storage/' . $receiptSetting->qr_code_path) : null,
        ]);
    }
}