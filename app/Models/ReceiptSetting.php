<?php 

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class ReceiptSetting extends Model
{
    protected $fillable = [
        'branch_id',
        'logo_path',
        'logo_size',
        'qr_code_path',
        'qr_code_size',
        'primary_color',
        'font_size_base',
        'font_family',
        'store_name',
        'header_text',
        'footer_text',
        'show_logo',
        'show_qr', 
        'show_header', 
        'show_footer', 
        'show_border',
        'paper_width', 
        'margin_size', 
        'show_order_id',
        'show_customer_info',
    ];

    protected $casts = [
        'show_logo' => 'boolean',
        'show_qr' => 'boolean',
        'show_header' => 'boolean',
        'show_footer' => 'boolean',
        'show_border' => 'boolean',
        'show_order_id' => 'boolean',
        'show_customer_info' => 'boolean',
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