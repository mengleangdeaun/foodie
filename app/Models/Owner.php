<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Owner extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'is_active'];

    public function branches() {
        return $this->hasMany(Branch::class);
    }

    public function products() {
        return $this->hasMany(Product::class);
    }
    public function modifierGroups()
    {
        return $this->hasMany(ModifierGroup::class);
    }
}
