<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchProduct extends Model
{
    protected $table = 'branch_product';

    protected $fillable = [
        'branch_id',
        'product_id',
        'is_available',
        'sort_order',
        'branch_price',
        'discount_percentage',
        'has_active_discount',
        'is_popular',
        'is_signature',
        'is_chef_recommendation',
    ];

    // Add casts for boolean fields
    protected $casts = [
        'is_available' => 'boolean',
        'has_active_discount' => 'boolean',
        'is_popular' => 'boolean',
        'is_signature' => 'boolean',
        'is_chef_recommendation' => 'boolean',
        'discount_percentage' => 'decimal:2',
        'branch_price' => 'decimal:2',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Add relationship to BranchProductSize
    public function branchProductSizes()
    {
        return $this->hasMany(BranchProductSize::class, 'branch_product_id');
    }

    // Get available sizes for this branch product
    public function availableSizes()
    {
        return $this->hasMany(BranchProductSize::class, 'branch_product_id')
            ->where('is_available', true);
    }
}