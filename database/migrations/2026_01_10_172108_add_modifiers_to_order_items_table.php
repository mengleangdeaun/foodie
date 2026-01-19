<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    Schema::table('order_items', function (Blueprint $table) {
        // We store an array of selected modifier names and prices
        // Example: [{"name": "Extra Cheese", "price": 1.00}, {"name": "Large", "price": 2.00}]
        $table->json('selected_modifiers')->nullable()->after('quantity');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            //
        });
    }
};
