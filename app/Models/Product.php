<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    use HasFactory;

protected $fillable = [
    'owner_id', 
    'category_id', 
    'name', 
    'short_description', 
    'description', 
    'base_price', 
    'discount_percentage',
    'has_active_discount',
    'image_path', 
    'is_active',
    'is_popular', 
    'is_signature', 
    'is_chef_recommendation'
];

    public function category() {
        return $this->belongsTo(Category::class);
    }


    public function tags(): BelongsToMany
{
    return $this->belongsToMany(Tag::class, 'product_tag');
}

// 2. Add Sizes relationship
public function sizes(): BelongsToMany
{
    return $this->belongsToMany(Size::class, 'product_size');
}

public function branchProducts()
    {
        return $this->hasMany(BranchProduct::class);
    }
public function branches(): BelongsToMany
{
    return $this->belongsToMany(Branch::class, 'branch_product')
                ->withPivot([
                    'branch_price', 
                    'discount_percentage', 
                    'has_active_discount', 
                    'is_available',
                    'sort_order',
                    'is_popular', 
                    'is_signature', 
                    'is_chef_recommendation'
                ])
                ->withTimestamps();
}

public function branchProduct($branchId)
    {
        return $this->hasOne(BranchProduct::class)->where('branch_id', $branchId);
    }
public function modifierGroups(): BelongsToMany
    {
        return $this->belongsToMany(ModifierGroup::class, 'modifier_group_product')
                    ->withPivot('sort_order')
                    ->withTimestamps();
    }


        public function branchProductSizes()
    {
        return $this->hasManyThrough(
            BranchProductSize::class,
            BranchProduct::class,
            'product_id', // Foreign key on BranchProduct table
            'branch_product_id', // Foreign key on BranchProductSize table
            'id', // Local key on products table
            'id' // Local key on BranchProduct table
        );
    }

    /**
     * Get branch-specific pricing for a specific branch
     */
    public function branchPricing($branchId)
    {
        return $this->branchProductSizes()
            ->whereHas('branchProduct', function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            })
            ->with('size')
            ->get();
    }

}
