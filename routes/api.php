<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\SuperAdmin\TenantController;
use App\Http\Controllers\Owner\ProductController;
use App\Http\Controllers\Owner\BranchController;
use App\Http\Controllers\Owner\BranchInventoryController;
use App\Http\Controllers\Owner\TableController;
use App\Http\Controllers\Owner\CategoryController;
use App\Http\Controllers\Owner\StaffController;
use App\Http\Controllers\Public\PublicMenuController;
use App\Http\Controllers\Public\OrderController;
use App\Http\Controllers\Owner\DeliveryPartnerController;
use App\Http\Controllers\Public\TelegramWebhookController;
use App\Http\Controllers\Owner\POSController;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Owner\RemarkPresetController;
use App\Http\Controllers\Owner\KitchenReportController;
use App\Http\Controllers\Branch\BranchDashboardController;
use App\Http\Controllers\Owner\ModifierController;
use App\Http\Controllers\Owner\TagController;
use App\Http\Controllers\Owner\SizeController;
use App\Http\Controllers\Owner\BranchProductSizeApiController;
use App\Http\Controllers\Owner\ReceiptSettingController;
use App\Http\Controllers\Owner\ReceiptPrintController;
use App\Http\Controllers\ProfileController;

/*
|--------------------------------------------------------------------------
| 1. Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [ForgotPasswordController::class, 'sendResetLink']);
Route::post('/register-tenant', [TenantController::class, 'store'])->middleware('throttle:5,1');
Route::post('/reset-password', [ForgotPasswordController::class, 'reset']);
Route::post('/telegram/webhook', [TelegramWebhookController::class, 'handle']);
Route::get('/landing-page', [App\Http\Controllers\Api\LandingPageController::class, 'index']);

// Customer Menu & Ordering
Route::post('/public/contact', [App\Http\Controllers\Public\ContactController::class, 'submit'])->middleware('throttle:3,1');
Route::prefix('public')->group(function () {
    Route::get('/menu/scan/{token}', [PublicMenuController::class, 'show']);
    Route::post('/menu/order/{token}', [OrderController::class, 'store']);
    Route::get('/order-status/{id}', function ($id) {
        $order = \App\Models\Order::findOrFail($id);
        return response()->json(['status' => $order->status]);
    });
});

/*
|--------------------------------------------------------------------------
| 2. Protected Routes (Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::middleware('auth:sanctum')->post('/user/switch-branch', function (Request $request) {
        $request->validate(['branch_id' => 'required|exists:branches,id']);

        $user = Auth::user();
        // Logic check: Ensure the owner owns this branch or staff is allowed
        $user->update(['branch_id' => $request->branch_id]);

        return response()->json(['message' => 'Branch switched successfully', 'user' => $user]);
    });

    // Profile Routes
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar']);
    Route::put('/profile/info', [ProfileController::class, 'updateInfo']);
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);


    /*
    |----------------------------------------------------------------------
    | Zone: Super Admin
    |----------------------------------------------------------------------
    */
    Route::prefix('super-admin')->middleware('role:super_admin')->group(function () {
        Route::get('/dashboard/stats', [App\Http\Controllers\SuperAdmin\DashboardController::class, 'index']);
        Route::get('/restaurants', [TenantController::class, 'index']);
        Route::post('/onboard-restaurant', [TenantController::class, 'store']);
        Route::post('/tenants/{id}/approve', [TenantController::class, 'approve']);
        Route::post('/tenants/{id}/decline', [TenantController::class, 'decline']);
        Route::put('/tenants/{id}', [TenantController::class, 'update']);
        Route::post('/tenants/{id}/suspend', [TenantController::class, 'suspend']);
        Route::put('/landing-page', [App\Http\Controllers\Api\LandingPageController::class, 'update']);
        Route::get('/contact-submissions', [App\Http\Controllers\Public\ContactController::class, 'index']);
    });

    /*
    |----------------------------------------------------------------------
    | Zone: Owner & Staff (Admin Prefix)
    |----------------------------------------------------------------------
    */
    Route::prefix('admin')->group(function () {

        Route::post('/branches/{id}/switch', [BranchController::class, 'switch']);
        Route::get('/branch/dashboard', [BranchDashboardController::class, 'index']);
        Route::get('/branch/dashboard/realtime', [BranchDashboardController::class, 'realtime']);

        // Add these routes in your api.php file under the admin prefix

        // Branch Product Size Management
        Route::get('/price-size/{branch}/products/{product}/sizes', [BranchProductSizeApiController::class, 'index']);
        Route::put('/price-size/{branch}/products/{product}/sizes', [BranchProductSizeApiController::class, 'update']);
        Route::post('/price-size/{branch}/products/{product}/sizes/bulk', [BranchProductSizeApiController::class, 'bulkUpdate']);

        // Universal Branch List (Owned/Allowed branches)
        Route::get('/branches', [BranchController::class, 'index']);

        // Universal Delivery Partner List (for viewing, POS uses data_for_pos)
        // If staff needs to MANAGE it, we'd need more logic, but for now we unblock 'index'
        Route::get('/delivery-partners', [DeliveryPartnerController::class, 'index']);
        Route::apiResource('delivery-partners', DeliveryPartnerController::class)->except(['index']);

        Route::get('/remark-presets', [RemarkPresetController::class, 'index']);
        Route::post('/remark-presets', [RemarkPresetController::class, 'store']);
        Route::put('/remark-presets/{id}', [RemarkPresetController::class, 'update']);
        Route::post('/remark-presets/{id}/sync', [RemarkPresetController::class, 'sync']); // The sync logic
        Route::delete('/remark-presets/{remarkPreset}', [RemarkPresetController::class, 'destroy']);

        /**
         * A. OWNER ONLY: High-level management
         */
        Route::middleware('role:owner')->group(function () {

            Route::get('/owner/dashboard', [App\Http\Controllers\Owner\OwnerDashboardController::class, 'index']);
            Route::get('/branches/schedules', [BranchController::class, 'getSchedules']);

            // Critical Branch Operations (Owner Only)
            Route::post('/branches', [BranchController::class, 'store']);
            Route::delete('/branches/{id}', [BranchController::class, 'destroy']);
            Route::post('branches/{id}/clone', [BranchController::class, 'clone']);

            Route::post('/branches/{id}/sync-products', [BranchController::class, 'syncAllProducts']);

            // Delivery Partners (CRUD mostly for owners)
            Route::apiResource('delivery-partners', DeliveryPartnerController::class)->except(['index']);

        });

        /**
         * B. PERMISSION BASED: Staff & Owner Actions
         */

        // Menu Management
        // 1. General View Access (for POS and lists)
        // We need a 'view_menu' or similar. 
        // For now, let's use 'manage_products' as the baseline for Management Routes, 
        // and 'pos_access' or 'view_menu' for POS.
        // But since we didn't add 'view_menu' yet, let's use the most common one: 'manage_products' for the admin list.


        // --- Categories & Products (Admin) ---
        Route::middleware('permission:menu,manage_products')->group(function () {
            Route::get('/categories', [CategoryController::class, 'index']);
            Route::get('/show_categories', [CategoryController::class, 'showCategory']);
            Route::get('/products', [ProductController::class, 'index']);

            Route::apiResource('categories', CategoryController::class)->except(['index']);
            Route::apiResource('products', ProductController::class)->except(['index']);
            Route::post('/products/toggle-availability', [ProductController::class, 'toggleAvailability']);

            // Remark Presets
            Route::get('/remark-presets', [RemarkPresetController::class, 'index']);
            Route::post('/remark-presets', [RemarkPresetController::class, 'store']);
            Route::put('/remark-presets/{id}', [RemarkPresetController::class, 'update']);
            Route::post('/remark-presets/{id}/sync', [RemarkPresetController::class, 'sync']);
            Route::delete('/remark-presets/{remarkPreset}', [RemarkPresetController::class, 'destroy']);

            // Modifiers (Product Addons)
            Route::apiResource('modifiers', ModifierController::class);
            Route::post('products/{product}/sync-modifiers', [ModifierController::class, 'syncProductGroups']);
            Route::post('modifiers/bulk-sync', [ModifierController::class, 'bulkSync']);

            // Delivery Partners
            Route::apiResource('delivery-partners', DeliveryPartnerController::class);

            // Tags & Sizes
            Route::apiResource('tags', TagController::class);
            Route::apiResource('sizes', SizeController::class);

            // Inventory
            Route::get('/branches/{branch}/inventory', [BranchInventoryController::class, 'index']);
            Route::put('/branches/{branch}/products/{product}', [BranchInventoryController::class, 'update']);
            Route::post('/branches/{branch}/inventory/bulk', [BranchInventoryController::class, 'bulkUpdate']);
            Route::post('/branches/{branch}/inventory/reorder', [BranchInventoryController::class, 'bulkReorder']);
        });

        // --- POS Product Access ---
        // POS needs to read menu, but might not have 'manage_products'. 
        // It definitely has 'orders.pos_access'.
        Route::middleware('permission:orders,pos_access')->group(function () {
            Route::get('/pos-products', [PosController::class, 'show']);
        });

        // Table & QR Management
        Route::middleware('permission:tables,manage_tables')->group(function () {
            Route::apiResource('tables', TableController::class);
            Route::post('/tables/{id}/regenerate', [TableController::class, 'regenerate']);
            Route::get('/tables/{id}/qr', [TableController::class, 'generateQr']);
        });

        // Order Management
        Route::group([], function () {
            // Kitchen Display
            Route::middleware('permission:kitchen,access_kds')->group(function () {
                Route::get('/kitchen/reports/shift', [KitchenReportController::class, 'getShiftStats']);
                Route::get('/orders/kitchen', [App\Http\Controllers\Owner\OrderController::class, 'kitchenIndex']);
                Route::get('/order/stats/history', [App\Http\Controllers\Owner\OrderController::class, 'getKitchenStats']);
            });

            // Live Orders & History
            Route::middleware('permission:orders,view_live')->group(function () {
                Route::get('/orders/live', [App\Http\Controllers\Owner\OrderController::class, 'liveMonitorIndex']);
            });

            Route::middleware('permission:orders,view_history')->group(function () {
                Route::get('/orders/history', [App\Http\Controllers\Owner\OrderController::class, 'index']);
            });

            // POS Operations (Create Order)
            Route::middleware('permission:orders,pos_access')->group(function () {
                Route::post('/pos/order', [POSController::class, 'store']);
                Route::get('/pos_delivery-partners', [DeliveryPartnerController::class, 'data_for_pos']);
            });

            // Business Management (Staff, etc)
            Route::middleware('permission:management,manage_staff')->group(function () {
                Route::apiResource('staff', StaffController::class);
                Route::put('/staff/{id}/status', [StaffController::class, 'updateStatus']);
            });

            // Branch Management (Content, Settings, Appearance)
            Route::middleware('permission:management,manage_branches')->group(function () {
                Route::get('/branches/{id}', [BranchController::class, 'show']);
                Route::put('/branches/{id}', [BranchController::class, 'update']);
                Route::patch('/branches/{id}', [BranchController::class, 'update']);

                Route::post('/branches/{id}/appearance', [BranchController::class, 'updateAppearance']);
                Route::post('/branches/{id}/appearance/reset', [BranchController::class, 'resetAppearance']);
                Route::post('/branches/{id}/test-telegram', [BranchController::class, 'testTelegram']);
            });

            // Receipt Settings Configuration
            // GET is needed for printing (POS, Live Orders), so it should be accessible to staff with order permissions
            Route::get('/settings/receipt', [ReceiptSettingController::class, 'show']);

            Route::middleware('permission:management,manage_receipt_settings')->group(function () {
                // Only UPDATE is restricted
                Route::post('/settings/receipt', [ReceiptSettingController::class, 'update']);
            });

            // Common Order Actions (Print, etc) - relaxed check or specific?
            // Printing usually requires read access to the order.
            // Let's allow if user has ANY of the main order permissions.
            // For simplicity, let's assume 'view_live' or 'view_history' or 'pos_access' allows printing.
            // But middleware is singular.
            // Let's use a shared route group without specific middleware if safe, or duplicate.
            // SAFEST: Protect detailed actions with 'orders,view_live' (since that's where printing often happens)
            // or 'orders,pos_access' for POS printing.
            // We can leave these open to 'admin' prefix but rely on controller policy? 
            // No, better to pick a reasonable default like 'orders,view_live' which most staff have.
            // Cashiers have 'view_live'. Waiters have 'view_live'. Managers have 'view_live'.

            Route::middleware('permission:orders,view_live')->group(function () {
                Route::get('/orders/{order}/print-receipt', [ReceiptPrintController::class, 'printReceipt']);
                Route::get('/orders/{order}/thermal-print', [ReceiptPrintController::class, 'printThermalReceipt']);
                Route::get('/receipt-settings/print', [ReceiptPrintController::class, 'getReceiptSettings']);
                Route::post('/orders/batch-print', [ReceiptPrintController::class, 'batchPrint']);
                Route::patch('/orders/{id}/status', [App\Http\Controllers\Owner\OrderController::class, 'updateStatus']); // Update Status
            });
        });
    });
});