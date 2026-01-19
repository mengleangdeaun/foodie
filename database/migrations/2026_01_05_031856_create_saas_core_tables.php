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
        Schema::create('owners', function (Blueprint $table) {
                    $table->id();
                    $table->string('name'); 
                    $table->string('slug')->unique(); 
                    $table->boolean('is_active')->default(true); // Account-wide status
                    $table->timestamps();
                });

                // 2. The Physical Locations (The Branches)
                Schema::create('branches', function (Blueprint $table) {
                    $table->id();
                    $table->foreignId('owner_id')->constrained()->onDelete('cascade');
                    $table->string('branch_name');
                    $table->string('branch_slug')->unique(); // For URL like myapp.com/branch-a/table-1
                    $table->string('location')->nullable();
                    $table->boolean('is_active')->default(true); // Branch-specific status
                    $table->timestamps();
                });
    }

    /**
     * Reverse the migrations.
     */
public function down()
    {
        Schema::dropIfExists('branches');
        Schema::dropIfExists('owners');
    }
};
