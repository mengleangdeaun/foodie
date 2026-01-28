<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        // Basic Information
        'owner_id',
        'branch_name',
        'branch_slug',
        'location',
        'is_active',

        // Business Settings
        'requires_cancel_note',
        'opening_days',
        'opening_time',
        'closing_time',

        // Contact Information
        'contact_phone',
        'contact_email',
        'website',
        'is_about_visible',

        // Content & Legal
        'about_description',
        'terms_of_service',
        'privacy_policy',
        'social_links',
        'is_tos_visible',
        'is_privacy_visible',

        // Telegram Integration
        'telegram_bot_token',
        'telegram_chat_id',
        'telegram_topic_id',
        'telegram_bot_name',

        // Design & Branding
        'primary_color',
        'secondary_color',
        'accent_color',
        'font_family',
        'font_family_headings',

        // Media Files
        'logo_path',
        'favicon_path',
        'qr_payment_path',
        'banner_image',

        'tax_rate',
        'tax_is_active',
        'tax_name',

    ];

    protected $casts = [
        'social_links' => 'array',
        'is_active' => 'boolean',
        'is_about_visible' => 'boolean',
        'is_tos_visible' => 'boolean',
        'is_privacy_visible' => 'boolean',
    ];

    public function owner()
    {
        return $this->belongsTo(Owner::class);
    }

    // This is the link to branch-specific products (Out of Stock logic)

    public function products() // Inside Branch.php
    {
        return $this->belongsToMany(Product::class)
            ->withPivot('is_available', 'branch_price', 'discount_percentage', 'has_active_discount')
            ->withTimestamps();
    }

    public function tables()
    {
        return $this->hasMany(RestaurantTable::class);
    }
}
