<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Events\OrderStatusUpdated;
use App\Models\User;

class OrderController extends Controller
{
// app/Http/Controllers/Owner/OrderController.php

public function index(Request $request)
{
    $branchId = auth()->user()->branch_id;
    
    $request->validate([
        'start_date' => 'required|date',
        'end_date' => 'required|date|after_or_equal:start_date',
        'start_time' => 'nullable',
        'end_time' => 'nullable',
    ]);

    // Use the relationship name you specified: restaurantTable
    $query = Order::where('branch_id', $branchId)
        ->with(['restaurantTable', 'deliveryPartner', 'creator', 'updater', 'histories.user', 'items.product']);

    // Date & Time Logic
    $startDate = \Carbon\Carbon::parse($request->start_date)->startOfDay();
    $endDate = \Carbon\Carbon::parse($request->end_date)->endOfDay();
    
    if ($request->filled(['start_time', 'end_time'])) {
        $start = \Carbon\Carbon::parse($request->start_date . ' ' . $request->start_time);
        $end = \Carbon\Carbon::parse($request->end_date . ' ' . $request->end_time);
    } else {
        $start = $startDate;
        $end = $endDate;
    }

    $query->whereBetween('created_at', [$start, $end]);

    if ($request->status && $request->status !== 'all') {
        $query->where('status', $request->status);
    }

if ($request->staff_id && $request->staff_id !== 'all') {
        $sid = $request->staff_id;
        $query->where(function($q) use ($sid) {
            $q->where('created_by', $sid)   // Show if they created it
              ->orWhere('updated_by', $sid) // Show if they last updated it
              ->orWhereHas('histories', function($sub) use ($sid) {
                  $sub->where('user_id', $sid); // Show if they touched it at any point
              });
        });
    }

    // Use pagination as requested
$perPage = $request->get('per_page', 12);
    return response()->json([
        'orders' => $query->latest()->paginate($perPage),
        'staff_list' => User::where('branch_id', $branchId)->get(['id', 'name'])
    ]);
}

public function getKitchenStats(Request $request)
{
    $branchId = Auth::user()->branch_id;
    $query = Order::where('branch_id', $branchId)->where('status', 'ready');

    // Filter by date range
    if ($request->filled(['start_date', 'end_date'])) {
        $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
    }

    $stats = $query->selectRaw('
            count(*) as total_orders,
            avg(actual_prep_duration) as avg_prep_time,
            min(NULLIF(actual_prep_duration, 0)) as fastest_order, -- Ignores 0 in calculation
            max(actual_prep_duration) as slowest_order,
            count(case when actual_prep_duration <= 15 then 1 end) as efficient_orders
        ')
        ->first();

    return response()->json([
        'totalOrders' => $stats->total_orders ?? 0,
        'avgPrepTime' => round($stats->avg_prep_time ?? 0),
        'fastestOrder' => $stats->fastest_order ?? 0, // Now shows the actual lowest non-zero time
        'slowestOrder' => $stats->slowest_order ?? 0,
        'efficientOrders' => $stats->efficient_orders ?? 0,
    ]);
}



public function kitchenIndex(Request $request)
{
    $branchId = auth()->user()->branch_id;
    $date = $request->get('date', now()->toDateString());

    // 1. Get the offset for the daily sequence
    $processedCount = Order::where('branch_id', $branchId)
        ->whereDate('created_at', $date)
        ->whereNotIn('status', ['pending', 'confirmed', 'cooking', 'ready'])
        ->count();

    // 2. Fetch the kitchen orders
    $orders = Order::where('branch_id', $branchId)
        ->whereDate('created_at', $date)
        ->whereIn('status', ['pending', 'confirmed', 'cooking', 'ready'])
        ->with(['items.product', 'restaurantTable', 'user', 'deliveryPartner'])
        ->oldest()
        ->get();

    // 3. Map the sequence numbers
    $mappedOrders = $orders->map(function ($order, $index) use ($processedCount) {
        $order->daily_sequence = $processedCount + $index + 1;
        return $order;
    });

    // --- THE CRITICAL FIX ---
    // Wrap the result in an object so the frontend find the 'orders' key
    return response()->json([
        'orders' => $mappedOrders,
        'total_count' => Order::where('branch_id', $branchId)->whereDate('created_at', $date)->count()
    ]);
}


/**
 * Fetch all active orders for the admin live monitor.
 */
public function liveMonitorIndex(Request $request)
{
    $branchId = auth()->user()->branch_id;
    $date = $request->get('date', now()->toDateString());

    // 1. Get the TOTAL count of all orders created BEFORE today's active ones
    // This ensures that if 10 orders were already 'Paid' or 'Cancelled', 
    // the first 'Pending' order starts at #11.
    $processedCount = Order::where('branch_id', $branchId)
        ->whereDate('created_at', $date)
        ->whereNotIn('status', ['pending', 'confirmed', 'cooking', 'ready', 'in_service','paid','cancelled'])
        ->count();

    // 2. Get ONLY the active orders for the UI
    $displayOrders = Order::where('branch_id', $branchId)
        ->whereDate('created_at', $date)
        ->whereIn('status', ['pending', 'confirmed', 'cooking', 'ready', 'in_service','paid','cancelled'])
        ->with(['items.product', 'restaurantTable', 'deliveryPartner'])
        ->oldest()
        ->get();

    // 3. Map the sequence numbers correctly using the processedCount as a base
    $mappedOrders = $displayOrders->map(function ($order, $index) use ($processedCount) {
        $order->daily_sequence = $processedCount + $index + 1;
        return $order;
    });

    // 4. Get total daily count for the header summary
    $totalCountForDay = Order::where('branch_id', $branchId)
        ->whereDate('created_at', $date)
        ->count();

    return response()->json([
        'orders' => $mappedOrders,
        'total_count' => $totalCountForDay
    ]);
}




public function updateStatus(Request $request, $id)
{
    $order = Order::where('branch_id', auth()->user()->branch_id)
        ->with('branch')
        ->findOrFail($id);
    
    $validated = $request->validate([
        'status' => 'required|in:pending,confirmed,cooking,ready,in_service,paid,cancelled',
        'note' => 'nullable|string'
    ]);

    // --- STRICT VALIDATION ---
    if ($validated['status'] === 'cancelled') {
        if ($order->branch->requires_cancel_note && empty(trim($validated['note']))) {
            return response()->json([
                'message' => 'This branch requires a cancellation note.',
                'errors' => ['note' => ['Please provide a reason for cancellation.']]
            ], 422);
        }
    }

    $oldStatus = $order->status;
    $newStatus = $validated['status'];

    // Track timestamps for prep duration
    if ($newStatus === 'cooking' && $oldStatus !== 'cooking') $order->cooking_started_at = now();
    if ($newStatus === 'ready' && $oldStatus !== 'ready') {
        $order->ready_at = now();
        if ($order->cooking_started_at) {
            $order->actual_prep_duration = (int) $order->cooking_started_at->diffInMinutes($order->ready_at);
        }
    }
    
    // --- AUDIT LOGGING ---
    $order->status = $newStatus;
    $order->updated_by = auth()->id(); // Record who changed the status
    $order->save();

    broadcast(new OrderStatusUpdated($order))->toOthers();

    // Log to historical audit table
    OrderHistory::create([
        'order_id' => $order->id,
        'user_id' => auth()->id(),
        'from_status' => $oldStatus,
        'to_status' => $newStatus,
        'note' => $validated['note'] ?? "Status changed to {$newStatus}" 
    ]);

    return response()->json([
        'message' => "Order updated to {$newStatus}",
        'order' => $order->load('restaurantTable', 'items.product', 'updater')
    ]);
}


}