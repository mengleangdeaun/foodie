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
        $table->string('logo_path')->nullable();
        $table->string('primary_color')->default('#e11d48'); // Default Lotus Rose
        $table->string('font_family')->default('font-sans'); // sans, serif, mono, rounded
        $table->string('banner_image')->nullable();
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
