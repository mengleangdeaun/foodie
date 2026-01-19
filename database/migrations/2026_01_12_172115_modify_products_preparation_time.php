<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
 public function up()
{
    // Tracking when the money was actually received
    Schema::table('orders', function (Blueprint $table) {
        $table->timestamp('paid_at')->nullable()->after('status');
        $table->timestamp('cooking_started_at')->nullable()->after('paid_at');
        $table->timestamp('ready_at')->nullable()->after('cooking_started_at');
        $table->integer('actual_prep_duration')->nullable()->after('ready_at')->comment('in minutes');
    });

    // Setting an estimated cook time for each item (in minutes)
    Schema::table('products', function (Blueprint $table) {
        $table->integer('preparation_time')->default(15)->after('description');
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
