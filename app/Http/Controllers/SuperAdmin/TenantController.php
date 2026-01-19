<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Owner;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{

    public function index()
    {
        // List all owners with their branch counts
        $restaurants = Owner::withCount('branches')->get();
        return response()->json($restaurants);
    }

    
    public function store(Request $request)
    {
        $request->validate([
            'restaurant_name' => 'required|string|max:255',
            'admin_name'      => 'required|string|max:255',
            'email'           => 'required|email|unique:users,email',
            'password'        => 'required|min:8',
        ]);

        return DB::transaction(function () use ($request) {
            // 1. Create Owner
            $owner = Owner::create([
                'name' => $request->restaurant_name,
                'slug' => Str::slug($request->restaurant_name),
                'is_active' => true,
            ]);

            // 2. Create First Branch
            $branch = Branch::create([
                'owner_id' => $owner->id,
                'branch_name' => 'Main Branch',
                'branch_slug' => Str::slug($request->restaurant_name . '-main'),
                'is_active' => true,
            ]);

            // 3. Create Owner User
            $user = User::create([
                'name' => $request->admin_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'owner_id' => $owner->id,
                'branch_id' => $branch->id,
                'role' => 'owner',
            ]);

            return response()->json([
                'message' => 'SaaS Tenant Created Successfully',
                'owner' => $owner,
                'user' => $user
            ], 201);
        });
    }
}
