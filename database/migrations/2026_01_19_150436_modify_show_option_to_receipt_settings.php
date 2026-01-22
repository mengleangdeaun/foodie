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
            // Add new columns
            $table->boolean('show_qr')->default(true)->after('qr_code_size');
            $table->boolean('show_header')->default(true)->after('show_logo');
            $table->boolean('show_footer')->default(true)->after('show_header');
            $table->boolean('show_border')->default(false)->after('show_footer');
            $table->integer('paper_width')->default(80)->after('show_border'); // in mm
            $table->integer('margin_size')->default(10)->after('paper_width'); // in pixels
        });
    }

    public function down()
    {
        Schema::table('receipt_settings', function (Blueprint $table) {
            $table->dropColumn(['show_qr', 'show_header', 'show_footer', 'show_border', 'paper_width', 'margin_size']);
        });
    }
};
