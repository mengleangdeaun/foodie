<?php

// database/migrations/2026_01_09_190000_add_extended_settings_to_branches.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('branches', function (Blueprint $table) {
            // Telegram Extension
            $table->string('telegram_bot_name')->nullable()->after('telegram_bot_token');
            
            // General Settings Extension
            $table->string('opening_days')->nullable(); // e.g., Mon - Sun
            $table->time('opening_time')->nullable();
            $table->time('closing_time')->nullable();
            
            // Contact Information
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            
            // Payment QR
            $table->string('qr_payment_path')->nullable();
        });
    }

    public function down(): void {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn([
                'telegram_bot_name', 'opening_days', 'opening_time', 
                'closing_time', 'contact_phone', 'contact_email', 'qr_payment_path'
            ]);
        });
    }
};
