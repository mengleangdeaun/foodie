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
    Schema::create('modifiers', function (Blueprint $table) {
        $table->id();
        $table->foreignId('modifier_group_id')->constrained()->onDelete('cascade');
        $table->string('name'); // e.g., "Extra Cheese", "Well Done", "Large"
        $table->decimal('price', 10, 2)->default(0.00); 
        $table->boolean('is_available')->default(true);
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modifiers');
    }
};
