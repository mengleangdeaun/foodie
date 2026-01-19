<?php

// app/Models/ModifierGroup.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ModifierGroup extends Model
{
    protected $fillable = [
        'owner_id', 
        'name', 
        'selection_type', 
        'min_selection', 
        'max_selection', 
        'is_active'
    ];

    protected $casts = [
    'owner_id' => 'integer',
    'is_active' => 'boolean',
];

    /**
     * The specific options belonging to this group.
     */
public function modifiers(): HasMany
{
    // REMOVE the ->where('is_available', true) here.
    // The Admin needs to see all options to manage them.
    return $this->hasMany(Modifier::class);
}

    /**
     * Products that use this modifier group.
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'modifier_group_product');
    }
}