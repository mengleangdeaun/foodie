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
        return User::where('owner_id', Auth::user()->owner_id)
            ->where('role', '!=', 'owner')
            ->with('branch')
            ->get();
    }

    /**
     * Store a newly created staff member.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email',
            'password'    => 'required|min:8',
            'branch_id'   => 'required|exists:branches,id',
            'role'        => 'required|in:manager,cashier,waiter,chef',
            'permissions' => 'nullable|string',
            'is_active'   => 'nullable|boolean',
            'avatar'      => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        // Security: Ensure the branch belongs to the owner
        Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($validated['branch_id']);

        // Handle avatar upload
        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        // Decode permissions if it's a JSON string
        $permissions = [];
        if (!empty($validated['permissions'])) {
            if (is_string($validated['permissions'])) {
                $permissions = json_decode($validated['permissions'], true);
            } else {
                $permissions = $validated['permissions'];
            }
        }

        $user = User::create([
            'name'        => $validated['name'],
            'email'       => $validated['email'],
            'password'    => Hash::make($validated['password']),
            'branch_id'   => $validated['branch_id'],
            'role'        => $validated['role'],
            'owner_id'    => Auth::user()->owner_id,
            'permissions' => $permissions,
            'is_active'   => $validated['is_active'] ?? true,
            'avatar'      => $avatarPath,
        ]);

        return response()->json(['message' => 'Staff member created successfully', 'user' => $user->load('branch')], 201);
    }

    /**
     * Update the specified staff member.
     */
    public function update(Request $request, $id)
    {
        $user = User::where('owner_id', Auth::user()->owner_id)
            ->where('role', '!=', 'owner')
            ->findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'email'       => 'required|email|unique:users,email,' . $id,
            'password'    => 'nullable|min:8',
            'branch_id'   => 'required|exists:branches,id',
            'role'        => 'required|in:manager,cashier,waiter,chef',
            'permissions' => 'nullable|string',
            'is_active'   => 'nullable|boolean',
            'avatar'      => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        // Security: Ensure the new branch belongs to the owner
        Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($validated['branch_id']);

        // Decode permissions if it's a JSON string
        $permissions = $user->permissions;
        if (!empty($validated['permissions'])) {
            if (is_string($validated['permissions'])) {
                $permissions = json_decode($validated['permissions'], true);
            } else {
                $permissions = $validated['permissions'];
            }
        }

        $user->fill([
            'name'        => $validated['name'],
            'email'       => $validated['email'],
            'branch_id'   => $validated['branch_id'],
            'role'        => $validated['role'],
            'permissions' => $permissions,
            'is_active'   => $validated['is_active'] ?? $user->is_active,
        ]);

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $avatarPath;
        }

        $user->save();

        return response()->json(['message' => 'Staff updated successfully', 'user' => $user->load('branch')]);
    }

    /**
     * Update staff status (active/inactive)
     */
    public function updateStatus(Request $request, $id)
    {
        $user = User::where('owner_id', Auth::user()->owner_id)
            ->where('role', '!=', 'owner')
            ->findOrFail($id);

        $validated = $request->validate([
            'is_active' => 'required|boolean',
        ]);

        $user->is_active = $validated['is_active'];
        $user->save();

        return response()->json([
            'message' => 'Staff status updated successfully',
            'user' => $user->load('branch')
        ]);
    }

    /**
     * Remove the specified staff member.
     */
    public function destroy($id)
    {
        $user = User::where('owner_id', Auth::user()->owner_id)
            ->where('role', '!=', 'owner')
            ->findOrFail($id);

        // Delete avatar if exists
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $user->delete();

        return response()->json(['message' => 'Staff member deleted successfully']);
    }
}