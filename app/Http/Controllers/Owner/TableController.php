<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Str;


class TableController extends Controller
{
    // app/Http/Controllers/Owner/TableController.php

    public function index(Request $request)
    {
        $request->validate(['branch_id' => 'required']);
        $user = auth()->user();

        // Security: Verify Branch Ownership & Access
        $branch = $this->getSecureBranch($request->branch_id, $user);

        return response()->json($branch->tables);
    }

    public function store(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'table_number' => 'required|string',
        ]);

        $user = auth()->user();
        $branch = $this->getSecureBranch($request->branch_id, $user);

        $table = RestaurantTable::create([
            'branch_id' => $branch->id,
            'table_number' => $request->table_number,
            'qr_code_token' => Str::random(32),
            'is_active' => true
        ]);

        return response()->json($table);
    }

    public function update(Request $request, $id)
    {
        // For update/destroy, we find the table ensuring it belongs to a branch owned by user
        $table = $this->getSecureTable($id, auth()->user());

        $validated = $request->validate([
            'table_number' => 'required|string|max:50',
        ]);

        $table->update($validated);
        return response()->json(['message' => 'Table updated', 'table' => $table]);
    }

    public function destroy($id)
    {
        $table = $this->getSecureTable($id, auth()->user());
        $table->delete();
        return response()->json(['message' => 'Table deleted']);
    }

    public function regenerate($id)
    {
        $table = $this->getSecureTable($id, auth()->user());

        $table->update([
            'qr_code_token' => Str::random(32)
        ]);

        return response()->json(['message' => 'Token regenerated', 'table' => $table]);
    }

    // --- Helper Methods to centralize security logic ---

    private function getSecureBranch($branchId, $user)
    {
        // 1. Staff Restriction: Can only access their own branch if assigned
        if ($user->role !== 'owner' && $user->branch_id && $user->branch_id != $branchId) {
            abort(403, 'Unauthorized: You can only manage your own branch.');
        }

        // 2. Ownership Check (Handles Legacy Data)
        return Branch::where('id', $branchId)
            ->where(function ($q) use ($user) {
                // Check Entity ID (Standard)
                $q->where('owner_id', $user->owner_id);

                // OR Check Legacy User ID (if owner)
                if ($user->role === 'owner') {
                    $q->orWhere('owner_id', $user->id);
                } else {
                    // For staff, check if owner uses legacy ID
                    $legacyId = optional($user->owner)->user_id ?? 0;
                    $q->orWhere('owner_id', $legacyId);
                }
            })->firstOrFail();
    }

    private function getSecureTable($tableId, $user)
    {
        return RestaurantTable::where('id', $tableId)
            ->whereHas('branch', function ($q) use ($user) {
                $q->where('owner_id', $user->owner_id);

                if ($user->role === 'owner') {
                    $q->orWhere('owner_id', $user->id);
                } else {
                    $legacyId = optional($user->owner)->user_id ?? 0;
                    $q->orWhere('owner_id', $legacyId);
                }
            })->firstOrFail();
    }
}
