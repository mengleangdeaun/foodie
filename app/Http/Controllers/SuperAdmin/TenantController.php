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
use Illuminate\Support\Facades\Mail;
use App\Mail\AccountApproved;
use App\Mail\AccountDeclined;

class TenantController extends Controller
{

    public function index()
    {
        // List all owners with their branch counts and admin user
        $restaurants = Owner::withCount('branches')
            ->with([
                'users' => function ($query) {
                    $query->where('role', 'owner');
                }
            ])
            ->get()
            ->map(function ($owner) {
                // Flatten the admin user details for easier frontend consumption
                $admin = $owner->users->first();
                $owner->admin_name = $admin ? $admin->name : '';
                $owner->email = $admin ? $admin->email : '';
                unset($owner->users);
                return $owner;
            });
        return response()->json($restaurants);
    }


    public function store(Request $request)
    {
        $request->validate([
            'restaurant_name' => 'required|string|max:255',
            'admin_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|min:8',
        ]);

        return DB::transaction(function () use ($request) {
            // 1. Create Owner (Inactive by default)
            $owner = Owner::create([
                'name' => $request->restaurant_name,
                'slug' => Str::slug($request->restaurant_name),
                'is_active' => false, // Pending verification
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
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'owner_id' => $owner->id,
                'branch_id' => $branch->id,
                'role' => 'owner',
                'is_active' => false, // Pending verification
            ]);

            return response()->json([
                'message' => 'Registration successful. Please wait for administrator approval.',
                'owner' => $owner,
                'user' => $user
            ], 201);
        });
    }
    public function approve($id)
    {
        $owner = Owner::findOrFail($id);
        $owner->update(['is_active' => true]);

        // Activate all users associated with this owner
        User::where('owner_id', $id)->update(['is_active' => true]);

        // Send Email
        $user = User::where('owner_id', $id)->where('role', 'owner')->first();
        if ($user) {
            Mail::to($user->email)->send(new AccountApproved($owner));
        }

        return response()->json(['message' => 'Tenant approved successfully']);
    }

    public function decline($id)
    {
        $owner = Owner::findOrFail($id);

        // Send Email
        $user = User::where('owner_id', $id)->where('role', 'owner')->first();
        if ($user) {
            Mail::to($user->email)->send(new AccountDeclined($owner));
        }

        // Delete related data 
        User::where('owner_id', $id)->delete();
        Branch::where('owner_id', $id)->delete();
        $owner->delete();

        return response()->json(['message' => 'Tenant declined and removed successfully']);
    }

    public function update(Request $request, $id)
    {
        $owner = Owner::findOrFail($id);
        $user = User::where('owner_id', $id)->where('role', 'owner')->firstOrFail();

        $request->validate([
            'restaurant_name' => 'required|string|max:255',
            'admin_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|min:8',
            'is_active' => 'boolean',
        ]);

        return DB::transaction(function () use ($request, $owner, $user) {
            $ownerData = [
                'name' => $request->restaurant_name,
                'slug' => Str::slug($request->restaurant_name),
            ];

            if ($request->has('is_active')) {
                $ownerData['is_active'] = $request->is_active;
                // Update specific users or all? Usually all users of that owner.
                User::where('owner_id', $owner->id)->update(['is_active' => $request->is_active]);
            }

            $owner->update($ownerData);

            $userData = [
                'name' => $request->admin_name,
                'email' => $request->email,
            ];

            if ($request->filled('password')) {
                $userData['password'] = Hash::make($request->password);
            }

            $user->update($userData);

            return response()->json(['message' => 'Tenant updated successfully', 'owner' => $owner]);
        });
    }

    public function suspend($id)
    {
        $owner = Owner::findOrFail($id);
        $owner->update(['is_active' => false]);
        User::where('owner_id', $id)->update(['is_active' => false]);

        return response()->json(['message' => 'Tenant suspended successfully']);
    }
}
