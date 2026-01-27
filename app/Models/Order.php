<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_code',
        'branch_id',
        'user_id',
        'restaurant_table_id',
        'order_type',
        'delivery_partner_id',
        'status',
        'paid_at',
        'subtotal',
        'item_discount_total',
        'order_level_discount',
        'delivery_partner_discount',
        'order_discount_amount', 
        'tax_rate',              
        'tax_amount',
        'cooking_started_at',
        'ready_at',
        'actual_prep_duration',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'paid_at' => 'datetime',
        'cooking_started_at' => 'datetime',
        'ready_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'order_discount_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
    ];

    protected $appends = ['daily_sequence'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the branch where this order was placed.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()
    {
        // The foreign key is user_id in the orders table
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the specific table that placed the order.
     */
    public function table(): BelongsTo
    {
        // Matches 'restaurant_table_id' in your SQL file
        return $this->belongsTo(RestaurantTable::class, 'restaurant_table_id');
    }

    public function restaurantTable()
    {
        // The foreign key is restaurant_table_id in the orders table
        return $this->belongsTo(RestaurantTable::class, 'restaurant_table_id');
    }

    /**
     * Get all items within this order.
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
    public function histories(): HasMany
    {
        return $this->hasMany(OrderHistory::class);
    }

    public function deliveryPartner()
    {
        // Ensure 'delivery_partner_id' matches your column name
        return $this->belongsTo(DeliveryPartner::class, 'delivery_partner_id');
    }

    // In Order.php Model
    public function getDailySequenceAttribute()
    {
        return Order::where('branch_id', $this->branch_id)
            ->whereDate('created_at', $this->created_at->toDateString())
            ->where('id', '<=', $this->id)
            ->count();
    }

}