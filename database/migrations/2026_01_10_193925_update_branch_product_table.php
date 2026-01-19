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
        Schema::table('branch_product', function (Blueprint $table) {
        $table->boolean('is_popular')->default(false);
        $table->boolean('is_signature')->default(false);
        $table->boolean('is_chef_recommendation')->default(false);
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
