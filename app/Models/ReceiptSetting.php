<?php 

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ReceiptSetting extends Model
{
    protected $fillable = [
        'branch_id', 
        'logo_path', 
        'qr_code_path', 
        'primary_color', 
        'font_size_base', 
        // FIX: Changed 'font-family' to 'font_family'
        'font_family', 
        'store_name', 
        'header_text', 
        'footer_text', 
        'show_logo', 
        'show_order_id', 
        'show_customer_info',
        'logo_size', 
        'qr_code_size',
    ];

    protected $appends = ['logo_url', 'qr_code_url'];

    public function getLogoUrlAttribute()
    {
        return $this->logo_path ? Storage::url($this->logo_path) : null;
    }

    public function getQrCodeUrlAttribute()
    {
        return $this->qr_code_path ? Storage::url($this->qr_code_path) : null;
    }
}