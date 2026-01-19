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
    Schema::table('receipt_settings', function (Blueprint $table) {
        $table->integer('logo_size')->default(80)->after('logo_path');
        $table->integer('qr_code_size')->default(90)->after('qr_code_path');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receipt_settings', function (Blueprint $table) {
            //
        });
    }
};
