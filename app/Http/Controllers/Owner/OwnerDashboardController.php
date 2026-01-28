<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Order;
use App\Models\Branch;
use Carbon\Carbon;

class OwnerDashboardController extends Controller
{
    public function index()
    {
        $owner = Auth::user();
        if ($owner->role !== 'owner') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $ownerId = $owner->owner_id; // Assuming user has owner_id

        // Get all branch IDs for this owner
        $branchIds = Branch::where('owner_id', $ownerId)->pluck('id');

        // 1. Total Branches (Active Only)
        $totalBranches = Branch::where('owner_id', $ownerId)->where('is_active', true)->count();

        // 2. Today's Metrics (All Branches)
        $todayStart = Carbon::today();
        $todayEnd = Carbon::tomorrow();

        $todayOrdersQuery = Order::whereIn('branch_id', $branchIds)
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->where('status', 'paid');

        $todayOrdersCount = $todayOrdersQuery->count();
        $todaySales = $todayOrdersQuery->sum('total');

        // 4. Most Active Branch (Today)
        $mostActiveBranch = Order::whereIn('branch_id', $branchIds)
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->where('status', 'paid')
            ->select('branch_id', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
            ->groupBy('branch_id')
            ->orderByDesc('total')
            ->with('branch')
            ->first();

        $mostActiveBranchData = $mostActiveBranch ? [
            'name' => $mostActiveBranch->branch->branch_name,
            'count' => $mostActiveBranch->total
        ] : null;

        // 3. Recent Orders (Global)
        $recentOrders = Order::whereIn('branch_id', $branchIds)
            ->with(['branch', 'user']) // Load branch name and user
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_code ?? 'ORD-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
                    'branch_name' => $order->branch->branch_name,
                    'user_name' => $order->user ? $order->user->name : 'Guest',
                    'total' => (float) $order->total,
                    'status' => $order->status,
                    'created_at' => $order->created_at->format('H:i'),
                    'order_type' => $order->order_type
                ];
            });

        return response()->json([
            'metrics' => [
                'total_branches' => $totalBranches,
                'today_orders' => $todayOrdersCount,
                'today_sales' => $todaySales,
                'most_active_branch' => $mostActiveBranchData,
            ],
            'recent_orders' => $recentOrders
        ]);
    }
}
