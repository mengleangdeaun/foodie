<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'owner_id',
        'name',
        'slug',
        'is_active',
    ];

    // Ensures the JSON response treats is_active as true/false
    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function owner()
    {
        return $this->belongsTo(Owner::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function remarkPresets()
    {
        return $this->belongsToMany(RemarkPreset::class);
    }
}