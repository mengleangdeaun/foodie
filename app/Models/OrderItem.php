<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

// OrderItem.php
protected $fillable = [
     'order_id',
     'product_id',
     'branch_product_size_id', // new
     'size_id', // new
     'size_name', // new
     'base_price',
     'original_product_price',
     'modifier_total_price',
     'item_discount_amount',
     'applied_discount_percentage', // new
     'applied_discount_type', // new
     'final_unit_price',
     'quantity',
     'selected_modifiers',
     'remark'
];

protected $casts = [
     'selected_modifiers' => 'array',
     'base_price' => 'decimal:2',
     'original_product_price' => 'decimal:2',
     'modifier_total_price' => 'decimal:2',
     'item_discount_amount' => 'decimal:2',
     'applied_discount_percentage' => 'decimal:2', // new
     'final_unit_price' => 'decimal:2',
];

    /**
     * Get the parent order.
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Get the product details for this item.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
        public function branchProductSize()
    {
        return $this->belongsTo(BranchProductSize::class);
    }

    public function size()
    {
        return $this->belongsTo(Size::class);
    }
}