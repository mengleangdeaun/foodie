<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->longText('about_description')->nullable()->after('is_about_visible');
            $table->longText('terms_of_service')->nullable()->after('about_description');
            $table->longText('privacy_policy')->nullable()->after('terms_of_service');
            $table->json('social_links')->nullable()->after('privacy_policy');
            $table->boolean('is_tos_visible')->default(false)->after('social_links');
            $table->boolean('is_privacy_visible')->default(false)->after('is_tos_visible');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            //
        });
    }
};
