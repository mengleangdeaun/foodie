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
    // Adding 'in_service' and including 'paid' instead of 'completed'
    DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM(
        'pending', 
        'confirmed', 
        'cooking', 
        'ready', 
        'in_service', 
        'paid', 
        'cancelled'
    ) NOT NULL DEFAULT 'pending'");
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
