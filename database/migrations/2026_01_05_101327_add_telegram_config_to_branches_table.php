<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            // The Bot API Key (e.g., 123456:ABC-DEF...)
            $table->string('telegram_bot_token')->nullable()->after('is_active');
            
            // The ID of the Super Group (e.g., -100123456789)
            $table->string('telegram_chat_id')->nullable()->after('telegram_bot_token');
            
            // The Thread ID if using Telegram Topics (optional)
            $table->string('telegram_topic_id')->nullable()->after('telegram_chat_id');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['telegram_bot_token', 'telegram_chat_id', 'telegram_topic_id']);
        });
    }
};