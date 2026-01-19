<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BranchProductSize extends Model
{
    use HasFactory;

    // Specify the table name since it doesn't follow Laravel's plural convention
    protected $table = 'branch_product_size';

    protected $fillable = [
        'branch_product_id',
        'size_id',
        'branch_size_price',
        'discount_percentage',
        'is_discount_active',
        'is_available'
    ];

    protected $casts = [
        'branch_size_price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'is_discount_active' => 'boolean',
        'is_available' => 'boolean'
    ];

    /**
     * Get the branch product
     */
    public function branchProduct()
    {
        return $this->belongsTo(BranchProduct::class);
    }

    /**
     * Get the size
     */
    public function size()
    {
        return $this->belongsTo(Size::class);
    }

    /**
     * Get calculated final price
     */
    public function getFinalPriceAttribute()
    {
        $price = $this->branch_size_price ?? $this->branchProduct->branch_price ?? 0;
        
        if ($this->is_discount_active && $this->discount_percentage > 0) {
            return round($price * (1 - $this->discount_percentage / 100), 2);
        }
        
        return round($price, 2);
    }

    /**
     * Scope for available sizes
     */
    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    /**
     * Scope for discounted sizes
     */
    public function scopeDiscounted($query)
    {
        return $query->where('is_discount_active', true)
            ->where('discount_percentage', '>', 0);
    }
}