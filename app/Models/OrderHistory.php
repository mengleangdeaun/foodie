<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderHistory extends Model
{
    protected $fillable = [
    'order_id',
    'user_id',
    'from_status',
    'to_status',
    'note',
];

public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
