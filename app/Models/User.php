<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Eager load these relationships by default.
     */
    protected $with = ['owner', 'branch'];

    protected $fillable = [
        'name',
        'email',
        'password',
        'owner_id',
        'branch_id',
        'role',
        'permissions',
        'is_active',
        'avatar',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'permissions' => 'array',
    ];

    /**
     * Helper to check permissions based on module and action.
     */
    public function canDo(string $module, string $action): bool
    {
        if ($this->role === 'owner' || $this->role === 'super_admin') {
            return true;
        }

        $perms = $this->permissions;
        return isset($perms[$module][$action]) && $perms[$module][$action] === true;
    }

    /**
     * Relationship: The corporate entity this user belongs to.
     */
    public function owner()
    {
        return $this->belongsTo(Owner::class);
    }

    /**
     * Relationship: The specific branch this user is currently working at.
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'user_id');
    }
}