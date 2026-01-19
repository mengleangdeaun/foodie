<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class KitchenReportController extends Controller
{
    public function getShiftStats(Request $request)
    {
        $branchId = Auth::user()->branch_id;
        $today = Carbon::today();

        // 1. Basic Counts
        $totalOrders = Order::where('branch_id', $branchId)
            ->whereDate('created_at', $today)
            ->count();

        // 2. Average Prep Time (Created to Ready)
        $avgPrepTime = Order::where('branch_id', $branchId)
            ->where('status', 'ready')
            ->whereDate('created_at', $today)
            ->select(DB::raw('AVG(TIMESTAMPDIFF(MINUTE, created_at, updated_at)) as avg_time'))
            ->first()->avg_time ?? 0;

        // 3. Busiest Hour
        $busiestHour = Order::where('branch_id', $branchId)
            ->whereDate('created_at', $today)
            ->select(DB::raw('HOUR(created_at) as hour'), DB::raw('count(*) as total'))
            ->groupBy('hour')
            ->orderBy('total', 'desc')
            ->first();

        // 4. Hourly Distribution for Chart
        $hourlyData = Order::where('branch_id', $branchId)
            ->whereDate('created_at', $today)
            ->select(DB::raw('HOUR(created_at) as hour'), DB::raw('count(*) as count'))
            ->groupBy('hour')
            ->get();

        return response()->json([
            'total_orders' => $totalOrders,
            'avg_prep_time' => round($avgPrepTime, 1),
            'busiest_hour' => $busiestHour ? $busiestHour->hour . ":00" : "N/A",
            'hourly_data' => $hourlyData
        ]);
    }
}