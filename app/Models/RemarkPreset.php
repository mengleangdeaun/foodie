<?php 

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RemarkPreset extends Model
{
    protected $fillable = ['owner_id', 'name', 'options', 'type', 'is_required'];

    protected $casts = [
        'options' => 'array', // Automatically handle JSON to Array
    ];

    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_remark_preset');
    }

    public function categories()
    {
        return $this->belongsToMany(Category::class, 'category_remark_preset');
    }
}