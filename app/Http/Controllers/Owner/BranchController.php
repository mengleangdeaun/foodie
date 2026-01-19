<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;


class BranchController extends Controller
{
    /**
     * Display a listing of branches for the logged-in owner.
     */
    public function index()
    {
        // Only show branches belonging to the authenticated owner
        $branches = Branch::where('owner_id', Auth::user()->owner_id)->get();
        return response()->json($branches);
    }


    /**
     * Store a newly created branch.
     */
public function store(Request $request)
{
    $request->validate([
        'branch_name'         => 'required|string|max:255',
        'location'            => 'nullable|string|max:500',
        'telegram_bot_token'  => 'nullable|string|max:255',
        'telegram_chat_id'    => 'nullable|string|max:255',
        'telegram_topic_id'   => 'nullable|string|max:255',
        'qr_payment_file'     => 'nullable|image|mimes:jpeg,png,jpg,gif,svg,webp|max:5120', // 5MB max
        'primary_color'       => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
        'logo'               => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:5120',
        'tax_rate' => 'nullable|numeric|min:0|max:100',
    ]);

    // Generate unique slug with timestamp to avoid collisions
    $slug = Str::slug(Auth::user()->owner->name . '-' . $request->branch_name . '-' . time());

    // Start branch creation data
    $branchData = [
        'owner_id'           => Auth::user()->owner_id,
        'branch_name'        => $request->branch_name,
        'branch_slug'        => $slug,
        'location'           => $request->location,
        'telegram_bot_token' => $request->telegram_bot_token,
        'telegram_chat_id'   => $request->telegram_chat_id,
        'telegram_topic_id'  => $request->telegram_topic_id,
        'is_active'          => true,
        'tax_name'           => $request->tax_name,
        'tax-rate'           => $request->taxt_rate,
        'tax_is_active'      => false,
        'primary_color'      => $request->primary_color ?? '#3b82f6',
        'secondary_color'    => '#8b5cf6',
        'accent_color'       => '#10b981',
        'font_family'        => 'font-sans',
        'font_family_headings' => 'font-sans',
    ];

    // Handle logo upload if provided
    if ($request->hasFile('logo')) {
        $logoPath = $request->file('logo')->store('branch_logos', 'public');
        $branchData['logo_path'] = $logoPath;
    }

    // Handle QR payment file upload
    if ($request->hasFile('qr_payment_file')) {
        $paymentQrPath = $request->file('qr_payment_file')->store('branch_qr_payments', 'public');
        $branchData['qr_payment_path'] = $paymentQrPath;
    }

    $branch = Branch::create($branchData);

    // Generate QR code for the branch menu
    $this->generateBranchQrCode($branch);

    return response()->json([
        'message' => 'New branch created successfully',
        'branch'  => $branch,
        'urls' => [
            'qr_url' => $branch->qr_path ? asset('storage/' . $branch->qr_path) : null,
            'qr_payment_url' => $branch->qr_payment_path ? asset('storage/' . $branch->qr_payment_path) : null,
            'logo_url' => $branch->logo_path ? asset('storage/' . $branch->logo_path) : null,
            'menu_url' => route('customer.menu', ['branch_slug' => $branch->branch_slug]),
        ]
    ], 201);
}

    /**
     * Update the specified branch.
     */
// app/Http/Controllers/Admin/BranchController.php
public function update(Request $request, Branch $branch) {
    // 1. Manually cast boolean strings from FormData to actual integers/booleans
    $request->merge([
        'is_active' => filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
        'requires_cancel_note' => filter_var($request->requires_cancel_note, FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
        'tax_is_active' => filter_var($request->tax_is_active, FILTER_VALIDATE_BOOLEAN) ? 1 : 0,
    ]);

    $data = $request->validate([
        'branch_name' => 'required|string',
        'location' => 'nullable|string',
        'is_active' => 'required|in:0,1',
        'requires_cancel_note' => 'required|in:0,1',
        'opening_days' => 'nullable|string',
        'opening_time' => 'nullable',
        'closing_time' => 'nullable',
        'contact_phone' => 'nullable|string',
        'contact_email' => 'nullable|email',
        'telegram_bot_token' => 'nullable|string',
        'telegram_chat_id' => 'nullable|string',
        'telegram_topic_id' => 'nullable|string',
        'qr_payment_file' => 'nullable|image|max:2048',
        'tax_is_active'=> 'required|in:0,1' ,
        'tax_name' => 'nullable|string',
        'tax_rate' => 'nullable|numeric|min:0|max:100',
    ]);

    // 2. Fetch Bot Name if Token is new/provided
    if ($request->filled('telegram_bot_token')) {
        try {
            $botRes = Http::get("https://api.telegram.org/bot{$request->telegram_bot_token}/getMe");
            if ($botRes->successful()) {
                $data['telegram_bot_name'] = $botRes->json('result.username');
            }
        } catch (\Exception $e) {}
    }

    // 3. Handle QR Payment Image
    if ($request->hasFile('qr_payment_file')) {
        if ($branch->qr_payment_path) Storage::disk('public')->delete($branch->qr_payment_path);
        $data['qr_payment_path'] = $request->file('qr_payment_file')->store('branch_qrs', 'public');
    }

    $branch->update($data);
    return response()->json(['message' => 'Settings updated successfully', 'branch' => $branch->fresh()]);
}

public function syncAllProducts($id)
{
    $branch = Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($id);
    
    // Get all master products for this owner
    $masterProducts = \App\Models\Product::where('owner_id', Auth::user()->owner_id)->get();
    
    $syncData = [];
    foreach ($masterProducts as $product) {
        // We use syncWithoutDetaching to avoid overwriting existing custom branch prices
        $syncData[$product->id] = [
            'branch_price' => $product->base_price,
            'is_available' => true,
            'discount_percentage' => $product->discount_percentage,
            'has_active_discount' => $product->has_active_discount,
        ];
    }

    $branch->products()->syncWithoutDetaching($syncData);

    return response()->json([
        'message' => 'All master products have been synced to this branch inventory.',
    ]);
}

    /**
     * Display the specified branch.
     */
    public function show($id)
    {
        $branch = Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($id);
        return response()->json($branch);
    }

public function updateAppearance(Request $request, $id)
{
    $branch = Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($id);

$validated = $request->validate([
    'primary_color' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
    'secondary_color' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
    'accent_color' => ['nullable', 'string', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
    'font_family' => 'nullable|string|in:font-sans,font-inter,font-roboto,font-opensans,font-montserrat,font-poppins,font-serif,font-times,font-georgia,font-playfair,font-mono,font-robotomono,font-kantumruy,font-moul,font-dangrek',
    'font_family_headings' => 'nullable|string|in:font-sans,font-inter,font-roboto,font-opensans,font-montserrat,font-poppins,font-serif,font-times,font-georgia,font-playfair,font-mono,font-robotomono,font-kantumruy,font-moul,font-dangrek',
    'logo' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:5120',
    'favicon' => 'nullable|image|mimes:jpeg,png,jpg,svg,webp|max:5120',
    'remove_logo' => 'nullable|boolean',
]);

    // Handle logo removal
    if ($request->boolean('remove_logo') && $branch->logo_path) {
        \Storage::disk('public')->delete($branch->logo_path);
        $branch->logo_path = null;
    }

    // Handle new logo upload
    if ($request->hasFile('logo')) {
        if ($branch->logo_path) {
            \Storage::disk('public')->delete($branch->logo_path);
        }
        $path = $request->file('logo')->store('branch_logos', 'public');
        $branch->logo_path = $path;
    }

    // CORRECT - Save favicon to favicon_path
    if ($request->hasFile('favicon')) {
        if ($branch->favicon_path) {
            \Storage::disk('public')->delete($branch->favicon_path);
        }
        $path = $request->file('favicon')->store('branch_favicon', 'public');
        $branch->favicon_path = $path; // Store in correct column
    }

    // Update colors if provided (allow resetting to null)
    $branch->primary_color = $request->has('primary_color') ? $request->primary_color : $branch->primary_color;
    $branch->secondary_color = $request->has('secondary_color') ? $request->secondary_color : $branch->secondary_color;
    $branch->accent_color = $request->has('accent_color') ? $request->accent_color : $branch->accent_color;
    
    // Update fonts if provided
    $branch->font_family = $request->has('font_family') ? $request->font_family : $branch->font_family;
    $branch->font_family_headings = $request->has('font_family_headings') ? $request->font_family_headings : $branch->font_family_headings;
    
    $branch->save();

    return response()->json([
        'message' => 'Branding updated successfully',
        'branch'  => $branch,
        'logo_url' => $branch->logo_path ? asset('storage/' . $branch->logo_path) : null,
        'favicon_url' => $branch->favicon_path ? asset('storage/' . $branch->favicon_path) : null,
        'colors' => [
            'primary' => $branch->primary_color,
            'secondary' => $branch->secondary_color,
            'accent' => $branch->accent_color,
        ]
    ]);
}

public function resetAppearance(Request $request, $id)
{
    $branch = Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($id);
    
    // Define default values
    $defaults = [
        'primary_color' => '#3b82f6',     // Blue
        'secondary_color' => '#f59e0b',   // Amber
        'accent_color' => '#10b981',      // Emerald
        'font_family' => 'font-sans',
        'font_family_headings' => 'font-sans',
    ];
    
    // Remove logo file if exists
    if ($branch->logo_path) {
        \Storage::disk('public')->delete($branch->logo_path);
        $branch->logo_path = null;
    }
    
    // Remove favicon file if exists
    if ($branch->favicon_path) {
        \Storage::disk('public')->delete($branch->favicon_path);
        $branch->favicon_path = null;
    }
    
    // Update branch with defaults
    $branch->update($defaults);
    
    return response()->json([
        'message' => 'Appearance settings reset to defaults successfully',
        'branch' => $branch->fresh(),
        'logo_url' => null,
        'favicon_url' => null,
        'colors' => [
            'primary' => $defaults['primary_color'],
            'secondary' => $defaults['secondary_color'],
            'accent' => $defaults['accent_color'],
        ]
    ]);
}



/**
 * Test the Telegram Bot connection for a specific branch.
 */
public function testTelegram(Request $request, $id)
{
    $branch = Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($id);

    // Ensure credentials exist before testing
    if (!$branch->telegram_bot_token || !$branch->telegram_chat_id) {
        return response()->json(['message' => 'Missing Telegram credentials'], 422);
    }

    try {
        $message = "🔔 *Lotus System Test*\nYour kitchen notification bot is now successfully linked to this branch!";
        
        $payload = [
            'chat_id' => $branch->telegram_chat_id,
            'text' => $message,
            'parse_mode' => 'Markdown',
        ];

        // Include Topic ID if configured
        if ($branch->telegram_topic_id) {
            $payload['message_thread_id'] = $branch->telegram_topic_id;
        }

        $response = Http::post("https://api.telegram.org/bot{$branch->telegram_bot_token}/sendMessage", $payload);

        if ($response->successful()) {
            return response()->json(['message' => 'Test message sent successfully! Check your Telegram group.']);
        }

        return response()->json([
            'message' => 'Telegram Error: ' . ($response->json()['description'] ?? 'Unknown error')
        ], 400);

    } catch (\Exception $e) {
        return response()->json(['message' => 'Connection failed: ' . $e->getMessage()], 500);
    }
}



public function switch(Request $request, $id)
{
    $user = Auth::user(); // This is User #2
    $branch = Branch::find($id); // This is Branch #2, which has owner_id = 1

    if (!$branch) {
        return response()->json(['message' => 'Branch not found'], 404);
    }

    // THE FIX: Compare Branch Owner ID (1) to User's associated Owner ID (1)
    if ($user->role === 'owner') {
        // We compare $branch->owner_id to $user->owner_id
        if ((int)$branch->owner_id !== (int)$user->owner_id) {
            return response()->json([
                'message' => 'Unauthorized: You do not own this branch.',
                'debug' => [
                    'user_owner_id' => $user->owner_id,
                    'branch_owner_id' => $branch->owner_id
                ]
            ], 403);
        }
    } else {
        return response()->json(['message' => 'Only owners can switch contexts.'], 403);
    }

    // Update the user's active branch
    $user->update(['branch_id' => $branch->id]);

    // Load the branch relationship to return full branding data to React
    return response()->json([
        'message' => 'Successfully switched',
        'user' => $user->load('branch'), 
        'branch' => $branch
    ]);
}


public function getSchedules()
{
    // Retrieve only necessary columns for branches belonging to this owner
    $schedules = Branch::where('owner_id', Auth::user()->owner_id)
        ->select('id', 'branch_name', 'opening_time', 'closing_time', 'opening_days')
        ->get();

    return response()->json([
        'success' => true,
        'data' => $schedules
    ]);
}

// Add to BranchController.php

public function clone($id)
{
    // Ensure the branch belongs to the owner
    $originalBranch = Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($id);

    // Create a copy of the model
    $newBranch = $originalBranch->replicate();

    // Append ' (Copy)' to name and generate a unique slug
    $newBranch->branch_name = $originalBranch->branch_name . ' (Copy)';
    $newBranch->branch_slug = Str::slug(
        Auth::user()->owner->name . '-' . $newBranch->branch_name . '-' . time()
    );

    // Default to inactive for safety
    $newBranch->is_active = false;
    $newBranch->save();

    // Trigger QR generation for the new slug
    if (method_exists($this, 'generateBranchQrCode')) {
        $this->generateBranchQrCode($newBranch);
    }

    return response()->json([
        'message' => 'Branch cloned successfully. Review settings before activating.',
        'branch' => $newBranch
    ], 201);
}

public function destroy($id)
{
    $branch = Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($id);

    // Optional: Prevent deleting the last branch
    $count = Branch::where('owner_id', Auth::user()->owner_id)->count();
    if ($count <= 1) {
        return response()->json([
            'message' => 'You must have at least one branch. Delete is not allowed.'
        ], 422);
    }

    // Delete associated files if they exist
    if ($branch->logo_path) \Storage::disk('public')->delete($branch->logo_path);
    if ($branch->qr_payment_path) \Storage::disk('public')->delete($branch->qr_payment_path);
    if ($branch->qr_path) \Storage::disk('public')->delete($branch->qr_path);

    $branch->delete();

    return response()->json(['message' => 'Branch deleted successfully']);
}


}