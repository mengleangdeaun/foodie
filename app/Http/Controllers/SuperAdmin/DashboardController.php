<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Owner;
use App\Models\Branch;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Total Restaurants (Active vs Pending)
        $totalRestaurants = Owner::count();
        $activeRestaurants = Owner::where('is_active', true)->count();
        $pendingRestaurants = Owner::where('is_active', false)->count();

        // 2. Total Branches
        $totalBranches = Branch::count();

        // 3. Recent Registrations (Last 5)
        $recentRestaurants = Owner::with('users') // Get associated users to show admin name if needed
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($owner) {
                // Find the admin user for this owner
                $admin = $owner->users->where('role', 'owner')->first();
                return [
                    'id' => $owner->id,
                    'name' => $owner->name,
                    'created_at' => $owner->created_at,
                    'is_active' => $owner->is_active,
                    'admin_name' => $admin ? $admin->name : 'N/A',
                    'email' => $admin ? $admin->email : 'N/A',
                ];
            });

        // 4. Total Users (Optional, good for scale tracking)
        $totalUsers = User::count();

        return response()->json([
            'stats' => [
                'total_restaurants' => $totalRestaurants,
                'active_restaurants' => $activeRestaurants,
                'pending_restaurants' => $pendingRestaurants,
                'total_branches' => $totalBranches,
                'total_users' => $totalUsers,
            ],
            'recent_activity' => $recentRestaurants
        ]);
    }
}
