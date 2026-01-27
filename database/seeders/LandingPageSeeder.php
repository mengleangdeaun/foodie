<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\LandingPageSetting;

class LandingPageSeeder extends Seeder
{
    public function run()
    {
        $settings = [
            'hero_title' => 'Streamline Your Restaurant Operations & Growth',
            'hero_subtitle' => 'From generic QR ordering to staff management and advanced analytics. Lotus v4 gives you everything you need to run a successful restaurant.',
            'cta_text' => 'Start Free Trial',
            'cta_link' => '/auth/cover-register',
            'features' => json_encode([
                [
                    'title' => 'QR Ordering System',
                    'description' => 'Contactless ordering for your customers using dynamic QR codes.',
                    'icon' => 'QrCode'
                ],
                [
                    'title' => 'Staff Management',
                    'description' => 'Manage roles, permissions, and shifts for your entire team easily.',
                    'icon' => 'Users'
                ],
                [
                    'title' => 'Real-time Analytics',
                    'description' => 'Track sales, popular items, and peak hours with detailed dashboards.',
                    'icon' => 'BarChart3'
                ]
            ]),
            'footer_text' => '© ' . date('Y') . ' Lotus v4. All rights reserved.',

            // New Overhaul Fields
            'show_brand_name' => '1',
            'contact_email' => 'support@lotusv4.com',
            'contact_address' => '123 Restaurant St, Food City, FC 12345',
            'social_links' => json_encode([
                'facebook' => 'https://facebook.com',
                'twitter' => 'https://twitter.com',
                'instagram' => 'https://instagram.com'
            ]),
            'section_visibility' => json_encode([
                'hero' => true,
                'features' => true,
                'about' => true,
                'pricing' => true,
                'cta' => true,
                'contact' => true,
                'footer_social' => true
            ])
        ];

        foreach ($settings as $key => $value) {
            LandingPageSetting::updateOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
