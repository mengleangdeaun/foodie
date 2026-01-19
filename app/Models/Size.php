<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Size extends Model
{
    protected $fillable = ['owner_id', 'name'];

    protected $casts = [
        'owner_id' => 'integer',
    ];

    /**
     * Relationship to Products
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_size');
    }
    public function branchProductSizes()
{
    return $this->hasMany(BranchProductSize::class, 'size_id');
}
}