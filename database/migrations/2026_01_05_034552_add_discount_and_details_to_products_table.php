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
    Schema::table('products', function (Blueprint $table) {
        $table->text('short_description')->nullable()->after('name');
        $table->decimal('discount_percentage', 5, 2)->default(0)->after('base_price');
        $table->boolean('is_discount_active')->default(false)->after('discount_percentage');
        
        // Options/Variations
        $table->string('size')->nullable()->after('description'); // e.g. Small, Large, 500ml
        $table->string('flavor')->nullable()->after('size'); // e.g. Spicy, Vanilla, Chocolate
    });
}

public function down(): void
{
    Schema::table('products', function (Blueprint $table) {
        $table->dropColumn([
            'short_description', 
            'discount_percentage', 
            'is_discount_active', 
            'size', 
            'flavor'
        ]);
    });
}
};
