<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up(): void
{
    Schema::table('orders', function (Blueprint $table) {
        // Track which staff member processed the order
        $table->foreignId('user_id')->nullable()->after('branch_id')->constrained()->onDelete('set null');
        
        // Differentiate between walk-in and delivery
        $table->string('order_type')->default('walk_in')->after('user_id');
        
        // Track delivery partners
        $table->foreignId('delivery_partner_id')->nullable()->after('order_type')->constrained()->onDelete('set null');
        
        // Make table ID nullable for delivery orders
        $table->unsignedBigInteger('restaurant_table_id')->nullable()->change();
        
        // Rename or add missing price columns to match your POSController
        $table->decimal('subtotal', 10, 2)->after('status');
        $table->decimal('discount_amount', 10, 2)->default(0)->after('subtotal');
        $table->renameColumn('total_price', 'total'); 
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            //
        });
    }
};
