<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryPartner extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'owner_id',
        'name',
        'logo',
        'discount_percentage',
        'is_discount_active',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_discount_active' => 'boolean',
        'is_active'          => 'boolean',
        'discount_percentage' => 'decimal:2',
    ];
}
