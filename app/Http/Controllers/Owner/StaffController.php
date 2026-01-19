<?php 

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

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
            'permissions' => 'nullable|array',
        ]);

        // Security: Ensure the branch belongs to the owner
        Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($validated['branch_id']);

        $user = User::create([
            'name'        => $validated['name'],
            'email'       => $validated['email'],
            'password'    => Hash::make($validated['password']),
            'branch_id'   => $validated['branch_id'],
            'role'        => $validated['role'],
            'owner_id'    => Auth::user()->owner_id,
            'permissions' => $validated['permissions'] ?? [],
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
            'permissions' => 'nullable|array',
        ]);

        // Security: Ensure the new branch belongs to the owner
        Branch::where('owner_id', Auth::user()->owner_id)->findOrFail($validated['branch_id']);

        $user->fill([
            'name'        => $validated['name'],
            'email'       => $validated['email'],
            'branch_id'   => $validated['branch_id'],
            'role'        => $validated['role'],
            'permissions' => $validated['permissions'] ?? [],
        ]);

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return response()->json(['message' => 'Staff updated successfully', 'user' => $user->load('branch')]);
    }

    /**
     * Remove the specified staff member.
     */
    public function destroy($id)
    {
        $user = User::where('owner_id', Auth::user()->owner_id)
            ->where('role', '!=', 'owner')
            ->findOrFail($id);

        $user->delete();

        return response()->json(['message' => 'Staff member deleted successfully']);
    }
}