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
    
    // Safety: Ensure the branch belongs to the authenticated owner
    $branch = Branch::where('owner_id', auth()->user()->owner_id)
                   ->findOrFail($request->branch_id);
                   

    return response()->json($branch->tables);
}

public function destroy($id)
{
    // Find the table through the owner's branches to ensure security
    $table = RestaurantTable::whereHas('branch', function($q) {
        $q->where('owner_id', auth()->user()->owner_id);
    })->findOrFail($id);

    $table->delete();
    return response()->json(['message' => 'Table deleted']);
}

    public function store(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'table_number' => 'required|string',
        ]);

        $table = RestaurantTable::create([
            'branch_id' => $request->branch_id,
            'table_number' => $request->table_number,
            'qr_code_token' => Str::random(32), // Generate the secure unique token
            'is_active' => true
        ]);

        return response()->json($table);
    }



public function update(Request $request, $id)
{
    $table = RestaurantTable::whereHas('branch', function($q) {
        $q->where('owner_id', auth()->user()->owner_id);
    })->findOrFail($id);

    $validated = $request->validate([
        'table_number' => 'required|string|max:50',
    ]);

    $table->update($validated);
    return response()->json(['message' => 'Table updated', 'table' => $table]);
}

public function regenerate($id)
{
    $table = RestaurantTable::whereHas('branch', function($q) {
        $q->where('owner_id', auth()->user()->owner_id);
    })->findOrFail($id);

    // Generate a fresh unique token
    $table->update([
        'qr_code_token' => Str::random(32)
    ]);

    return response()->json(['message' => 'Token regenerated', 'table' => $table]);
}

}
