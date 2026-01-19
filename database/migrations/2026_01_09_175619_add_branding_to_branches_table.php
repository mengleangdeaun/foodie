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
        Schema::table('branches', function (Blueprint $table) {
            $table->string('secondary_color')->nullable()->default('#8b5cf6')->after('primary_color');
            $table->string('accent_color')->nullable()->default('#10b981')->after('secondary_color');
            $table->string('font_family_headings')->nullable()->default('font-sans')->after('font_family');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['secondary_color', 'accent_color', 'font_family_headings']);
        });
    }
};