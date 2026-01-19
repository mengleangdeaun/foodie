<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
// database/migrations/xxxx_xx_xx_create_receipt_settings_table.php
public function up()
{
    Schema::create('receipt_settings', function (Blueprint $table) {
        $table->id();
        $table->foreignId('branch_id')->constrained()->onDelete('cascade');
        
        // Branding & Images
        $table->string('logo_path')->nullable();
        $table->string('qr_code_path')->nullable();
        
        // Visuals
        $table->string('primary_color')->default('#000000');
        $table->integer('font_size_base')->default(12);
        
        // Text Content
        $table->string('store_name')->nullable();
        $table->text('header_text')->nullable();
        $table->text('footer_text')->nullable();
        
        // Toggles
        $table->boolean('show_logo')->default(true);
        $table->boolean('show_order_id')->default(true);
        $table->boolean('show_customer_info')->default(true);
        
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipt_settings');
    }
};
