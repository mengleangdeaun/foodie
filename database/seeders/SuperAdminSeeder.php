<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run() {
        User::create([
            'name' => 'Super Admin',
            'email' => 'mengleangdeaun@gmail.com',
            'password' => Hash::make('111213'),
            'role' => 'super_admin',
            'is_active' => true,
        ]);
    }
}
