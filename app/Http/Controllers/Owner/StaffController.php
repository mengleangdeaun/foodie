<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class StaffController extends Controller
{
    /**
     * Display a listing of the staff members.
     */
    public function index()
    {
        $user = Auth::user();
        $query = User::whereNotIn('role', ['owner', 'super_admin'])->with('branch');

        if ($user->role === 'owner') {
            $query->where(function ($q) use ($user) {
                $q->where('owner_id', $user->owner_id)
                    ->orWhere('owner_id', $user->id);
            });
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'branch_id' => 'required|exists:branches,id',
            'role' => 'required|in:manager,cashier,waiter,chef',
            'permissions' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        $user = Auth::user();

        // Security: Ensure the branch belongs to the owner
        Branch::where(function ($q) use ($user) {
            $q->where('owner_id', $user->owner_id)
                ->orWhere('owner_id', $user->id);
        })->findOrFail($validated['branch_id']);

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        $permissions = [];
        if (!empty($validated['permissions'])) {
            $permissions = is_string($validated['permissions'])
                ? json_decode($validated['permissions'], true)
                : $validated['permissions'];
        }

        // New staff always linked to proper Owner Entity ID
        $newUser = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'branch_id' => $validated['branch_id'],
            'role' => $validated['role'],
            'owner_id' => $user->owner_id,
            'permissions' => $permissions,
            'is_active' => $validated['is_active'] ?? true,
            'avatar' => $avatarPath,
        ]);

        return response()->json(['message' => 'Staff member created successfully', 'user' => $newUser->load('branch')], 201);
    }

    public function update(Request $request, $id)
    {
        $authUser = Auth::user();
        $user = User::whereNotIn('role', ['owner', 'super_admin'])
            ->where(function ($q) use ($authUser) {
                $q->where('owner_id', $authUser->owner_id)
                    ->orWhere('owner_id', $authUser->id);
            })->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $id,
            'password' => 'nullable|min:8',
            'branch_id' => 'required|exists:branches,id',
            'role' => 'required|in:manager,cashier,waiter,chef',
            'permissions' => 'nullable|string',
            'is_active' => 'nullable|boolean',
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        // Security: Ensure the new branch belongs to the owner
        Branch::where(function ($q) use ($authUser) {
            $q->where('owner_id', $authUser->owner_id)
                ->orWhere('owner_id', $authUser->id);
        })->findOrFail($validated['branch_id']);

        $permissions = $user->permissions;
        if (!empty($validated['permissions'])) {
            $permissions = is_string($validated['permissions'])
                ? json_decode($validated['permissions'], true)
                : $validated['permissions'];
        }

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'branch_id' => $validated['branch_id'],
            'role' => $validated['role'],
            'permissions' => $permissions,
            'is_active' => $validated['is_active'] ?? $user->is_active,
        ]);

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $user->avatar = $request->file('avatar')->store('avatars', 'public');
        }

        $user->save();

        return response()->json(['message' => 'Staff updated successfully', 'user' => $user->load('branch')]);
    }

    public function updateStatus(Request $request, $id)
    {
        $authUser = Auth::user();
        $user = User::whereNotIn('role', ['owner', 'super_admin'])
            ->where(function ($q) use ($authUser) {
                $q->where('owner_id', $authUser->owner_id)
                    ->orWhere('owner_id', $authUser->id);
            })->findOrFail($id);

        $validated = $request->validate(['is_active' => 'required|boolean']);

        $user->is_active = $validated['is_active'];
        $user->save();

        return response()->json(['message' => 'Staff status updated successfully', 'user' => $user->load('branch')]);
    }

    public function destroy($id)
    {
        $authUser = Auth::user();
        $user = User::whereNotIn('role', ['owner', 'super_admin'])
            ->where(function ($q) use ($authUser) {
                $q->where('owner_id', $authUser->owner_id)
                    ->orWhere('owner_id', $authUser->id);
            })->findOrFail($id);

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->delete();

        return response()->json(['message' => 'Staff member deleted successfully']);
    }
}