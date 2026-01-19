<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Check if branch_id already exists before adding
            if (!Schema::hasColumn('users', 'branch_id')) {
                $table->foreignId('branch_id')->nullable()->constrained()->onDelete('set null');
            }
            
            // Check for role
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('staff');
            }

            // Check for permissions
            if (!Schema::hasColumn('users', 'permissions')) {
                $table->json('permissions')->nullable();
            }

            // Check for owner_id (to link staff to the business owner)
            if (!Schema::hasColumn('users', 'owner_id')) {
                $table->unsignedBigInteger('owner_id')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['branch_id', 'role', 'permissions', 'owner_id']);
        });
    }
};