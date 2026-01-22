<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
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

/*
|--------------------------------------------------------------------------
| 1. Public Routes
|--------------------------------------------------------------------------
*/
Route::post('/login', [AuthController::class, 'login']);
Route::post('/telegram/webhook', [TelegramWebhookController::class, 'handle']);

// Customer Menu & Ordering
Route::prefix('public')->group(function () {
    Route::get('/menu/scan/{token}', [PublicMenuController::class, 'show']);
    Route::post('/menu/order/{token}', [OrderController::class, 'store']);
    Route::get('/order-status/{id}', function($id) {
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


    /*
    |----------------------------------------------------------------------
    | Zone: Super Admin
    |----------------------------------------------------------------------
    */
    Route::prefix('super-admin')->middleware('role:super_admin')->group(function () {
        Route::get('/restaurants', [TenantController::class, 'index']);
        Route::post('/onboard-restaurant', [TenantController::class, 'store']);
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
        Route::get('/settings/receipt', [ReceiptSettingController::class, 'show']);
        Route::post('/settings/receipt', [ReceiptSettingController::class, 'update']);

        // Add these routes in your api.php file under the admin prefix

// Branch Product Size Management
        Route::get('/price-size/{branch}/products/{product}/sizes', [BranchProductSizeApiController::class, 'index']);
        Route::put('/price-size/{branch}/products/{product}/sizes', [BranchProductSizeApiController::class, 'update']);
        Route::post('/price-size/{branch}/products/{product}/sizes/bulk', [BranchProductSizeApiController::class, 'bulkUpdate']);

        
        Route::get('/remark-presets', [RemarkPresetController::class, 'index']);
        Route::post('/remark-presets', [RemarkPresetController::class, 'store']);
         Route::put('/remark-presets/{id}', [RemarkPresetController::class, 'update']);
        Route::post('/remark-presets/{id}/sync', [RemarkPresetController::class, 'sync']); // The sync logic
        Route::delete('/remark-presets/{remarkPreset}', [RemarkPresetController::class, 'destroy']);

        /**
         * A. OWNER ONLY: High-level management
         */
        Route::middleware('role:owner')->group(function () {

            Route::get('/branches/schedules', [BranchController::class, 'getSchedules']);
            Route::apiResource('branches', BranchController::class);
            Route::post('branches/{id}/clone', [BranchController::class, 'clone']);
            Route::apiResource('staff', StaffController::class); // This handles the POST to /api/admin/staff
            
            Route::post('/branches/{id}/appearance', [BranchController::class, 'updateAppearance']);
            Route::post('/branches/{id}/appearance/reset', [BranchController::class, 'resetAppearance']);
            Route::post('/branches/{id}/sync-products', [BranchController::class, 'syncAllProducts']);

            Route::apiResource('modifiers', ModifierController::class);
            Route::post('products/{product}/sync-modifiers', [ModifierController::class, 'syncProductGroups']);
            Route::post('modifiers/bulk-sync', [ModifierController::class, 'bulkSync']);

            Route::apiResource('tags', TagController::class);
            Route::apiResource('sizes', SizeController::class);

            Route::post('/branches/{id}/test-telegram', [BranchController::class, 'testTelegram']);
            Route::get('/delivery-partners', [DeliveryPartnerController::class,'index']);
            Route::apiResource('delivery-partners', DeliveryPartnerController::class)->except(['index']);
            
        });

        /**
         * B. PERMISSION BASED: Staff & Owner Actions
         */
        
        // Menu Management
        Route::middleware('permission:menu,read')->group(function () { // Fixed: menu,read
                Route::get('/categories', [CategoryController::class, 'index']);
                 Route::get('/show_categories', [CategoryController::class, 'showCategory']);
                Route::get('/products', [ProductController::class, 'index']);
                Route::get('/pos-products', [PosController::class, 'show']);
                
                Route::middleware('permission:menu,update')->group(function () { // Fixed: menu,update
                    Route::apiResource('categories', CategoryController::class)->except(['index']);
                    Route::apiResource('products', ProductController::class)->except(['index']);
                    
                    Route::post('/products/toggle-availability', [ProductController::class, 'toggleAvailability']);
                });
            });

        // Branch Inventory
        Route::middleware('permission:menu,read')->group(function () { // Fixed: menu,read
                Route::get('/branches/{branch}/inventory', [BranchInventoryController::class, 'index']);
                
                Route::middleware('permission:menu,update')->group(function () { // Fixed: menu,update
                    Route::put('/branches/{branch}/products/{product}', [BranchInventoryController::class, 'update']);
                    Route::post('/branches/{branch}/inventory/bulk', [BranchInventoryController::class, 'bulkUpdate']);
                    Route::post('/branches/{branch}/inventory/reorder', [BranchInventoryController::class, 'bulkReorder']);
                });
            });

        // Table & QR Management
        Route::middleware('permission:tables,read')->group(function () { // Fixed: tables,read
                Route::apiResource('tables', TableController::class);
                
                Route::middleware('permission:tables,update')->group(function () { // Fixed: tables,update
                    Route::post('/tables/{id}/regenerate', [TableController::class, 'regenerate']);
                    Route::get('/tables/{id}/qr', [TableController::class, 'generateQr']);
                });
            });

        // Order Management (The Kitchen/Cashier View)
        Route::middleware('permission:orders,read')->group(function () { // Fixed: orders,read
                Route::get('/kitchen/reports/shift', [KitchenReportController::class, 'getShiftStats']);
                Route::get('/orders/kitchen', [App\Http\Controllers\Owner\OrderController::class, 'kitchenIndex']);
                Route::get('/order/stats/history', [App\Http\Controllers\Owner\OrderController::class, 'getKitchenStats']);
                Route::get('/orders/live', [App\Http\Controllers\Owner\OrderController::class, 'liveMonitorIndex']);
                Route::get('/orders/history', [App\Http\Controllers\Owner\OrderController::class, 'index']);
                Route::post('/pos/order', [POSController::class, 'store']);
                Route::get('/orders/{order}/print-receipt', [ReceiptPrintController::class, 'printReceipt']);
                Route::get('/orders/{order}/thermal-print', [ReceiptPrintController::class, 'printThermalReceipt']);
                Route::get('/receipt-settings/print', [ReceiptPrintController::class, 'getReceiptSettings']);
                Route::post('/orders/batch-print', [ReceiptPrintController::class, 'batchPrint']);
                Route::get('/pos_delivery-partners', [DeliveryPartnerController::class,'data_for_pos']);
                Route::middleware('permission:orders,update')->group(function () { // Fixed: orders,update
                Route::patch('/orders/{id}/status', [App\Http\Controllers\Owner\OrderController::class, 'updateStatus']);
                });
            });
    });
});