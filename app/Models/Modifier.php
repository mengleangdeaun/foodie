<?php

// app/Models/Modifier.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Modifier extends Model
{
    protected $fillable = [
        'modifier_group_id', 
        'name', 
        'price', 
        'is_available'
    ];

    /**
     * The parent group this modifier belongs to.
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(ModifierGroup::class, 'modifier_group_id');
    }
}