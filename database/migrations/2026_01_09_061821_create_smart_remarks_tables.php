<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. The main table to store preset names and options
        Schema::create('remark_presets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->string('name'); // e.g., "Sugar Level"
            $table->json('options'); // e.g., ["0%", "25%", "50%", "100%"]
            $table->string('type')->default('single'); // 'single' or 'multiple' selection
            $table->boolean('is_required')->default(false);
            $table->timestamps();
        });

        // 2. Pivot table: Link Remarks to Categories
        // This ensures "Sugar" only shows for Drinks, not Pizzas.
        Schema::create('category_remark_preset', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->onDelete('cascade');
            $table->foreignId('remark_preset_id')->constrained()->onDelete('cascade');
        });

        // 3. Pivot table: Link Remarks to Branches
        // This allows Branch A to have different available customizations than Branch B.
        Schema::create('branch_remark_preset', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('remark_preset_id')->constrained()->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_remark_preset');
        Schema::dropIfExists('category_remark_preset');
        Schema::dropIfExists('remark_presets');
    }
};
