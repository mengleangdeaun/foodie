<?php

namespace App\Http\Controllers\Branch;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BranchDashboardController extends Controller {
    public function index(Request $request) {
        $branchId = Auth::user()->branch_id;
        
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
        ]);
        
        $startDate = Carbon::parse($request->start_date)->startOfDay();
        $endDate = Carbon::parse($request->end_date)->endOfDay();
        
        if ($request->has('start_time') && $request->has('end_time')) {
            $start = Carbon::parse($request->start_date . ' ' . $request->start_time);
            $end = Carbon::parse($request->end_date . ' ' . $request->end_time);
            
            if ($start->diffInDays($end) > 30) {
                return response()->json(['error' => 'Time range cannot exceed 30 days'], 400);
            }
        } else {
            $start = $startDate;
            $end = $endDate;
        }

        $duration = $start->diffInDays($end);
        $previousStart = $start->copy()->subDays($duration);
        $previousEnd = $end->copy()->subDays($duration);

        // Base queries
        $currentOrdersQuery = Order::where('branch_id', $branchId)
            ->whereBetween('created_at', [$start, $end])
            ->where('status', 'paid');

        $previousOrdersQuery = Order::where('branch_id', $branchId)
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->where('status', 'paid');

        // --- NEW: Most Ordered Table ID Logic ---
        $currentMostOrderedTable = Order::where('branch_id', $branchId)
            ->whereBetween('created_at', [$start, $end])
            ->where('status', 'paid')
            ->whereNotNull('restaurant_table_id')
            ->select('restaurant_table_id', DB::raw('COUNT(*) as order_count'))
            ->with('restaurantTable:id,table_number')
            ->groupBy('restaurant_table_id')
            ->orderBy('order_count', 'desc')
            ->first();

        $previousMostOrderedTable = Order::where('branch_id', $branchId)
            ->whereBetween('created_at', [$previousStart, $previousEnd])
            ->where('status', 'paid')
            ->whereNotNull('restaurant_table_id')
            ->select('restaurant_table_id', DB::raw('COUNT(*) as order_count'))
            ->with('restaurantTable:id,table_number')
            ->groupBy('restaurant_table_id')
            ->orderBy('order_count', 'desc')
            ->first();

        // Current period metrics
        $currentRevenue = $currentOrdersQuery->sum('total');
        $currentOrders = $currentOrdersQuery->count();
        $currentAOV = $currentOrders > 0 ? $currentRevenue / $currentOrders : 0;

        // Previous period metrics
        $previousRevenue = $previousOrdersQuery->sum('total');
        $previousOrders = $previousOrdersQuery->count();
        $previousAOV = $previousOrders > 0 ? $previousRevenue / $previousOrders : 0;

        // Calculate percentage changes
        $revenueChange = $this->calculatePercentageChange($currentRevenue, $previousRevenue);
        $ordersChange = $this->calculatePercentageChange($currentOrders, $previousOrders);
        $aovChange = $this->calculatePercentageChange($currentAOV, $previousAOV);

        // Top Selling Products
        $topSelling = OrderItem::whereIn('order_id', $currentOrdersQuery->pluck('id'))
            ->select(
                'product_id',
                DB::raw('SUM(quantity) as total_qty'),
                DB::raw('SUM(quantity * final_unit_price) as total_revenue')
            )
            ->with('product:id,name')
            ->groupBy('product_id')
            ->orderBy('total_qty', 'desc')
            ->take(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->product_id,
                    'name' => $item->product?->name ?? 'Unknown',
                    'total_qty' => (int) $item->total_qty,
                    'total_revenue' => (float) $item->total_revenue
                ];
            });

        // Category Revenue
        $categoryRevenue = OrderItem::whereIn('order_id', $currentOrdersQuery->pluck('id'))
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->select(
                'categories.id as category_id',
                'categories.name as category_name',
                DB::raw('SUM(order_items.final_unit_price * order_items.quantity) as revenue'),
                DB::raw('COUNT(DISTINCT order_items.order_id) as order_count')
            )
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('revenue', 'desc')
            ->get()
            ->map(function ($item) use ($currentRevenue) {
                $percentage = $currentRevenue > 0 ? ($item->revenue / $currentRevenue) * 100 : 0;
                return [
                    'id' => $item->category_id,
                    'name' => $item->category_name,
                    'value' => (float) $item->revenue,
                    'percentage' => round($percentage, 1),
                    'order_count' => (int) $item->order_count
                ];
            });

        // Hourly Heatmap Data
        $hourlyData = Order::where('branch_id', $branchId)
            ->whereBetween('created_at', [$start, $end])
            ->where('status', 'paid')
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('AVG(total) as avg_order_value')
            )
            ->groupBy(DB::raw('HOUR(created_at)'))
            ->orderBy('hour')
            ->get();

        $heatmapData = [];
        for ($hour = 0; $hour < 24; $hour++) {
            $hourData = $hourlyData->firstWhere('hour', $hour);
            $heatmapData[] = [
                'hour' => sprintf("%02d:00", $hour),
                'hour_number' => $hour,
                'order_count' => $hourData ? (int) $hourData->order_count : 0,
                'revenue' => $hourData ? (float) $hourData->revenue : 0,
                'avg_order_value' => $hourData ? (float) $hourData->avg_order_value : 0,
                'intensity' => $this->calculateIntensity($hourData ? $hourData->order_count : 0, $hourlyData->max('order_count'))
            ];
        }

        $peakHour = $hourlyData->sortByDesc('order_count')->first();
        $peakHourValue = $peakHour ? sprintf("%02d:00", $peakHour->hour) : 'N/A';

        $avgPrepTime = Order::where('branch_id', $branchId)
            ->whereBetween('created_at', [$start, $end])
            ->where('status', 'paid')
            ->whereNotNull('actual_prep_duration')
            ->avg('actual_prep_duration');

        $orderTypeDistribution = Order::where('branch_id', $branchId)
            ->whereBetween('created_at', [$start, $end])
            ->where('status', 'paid')
            ->select(
                'order_type',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total) as revenue')
            )
            ->groupBy('order_type')
            ->get()
            ->map(function ($item) use ($currentOrders, $currentRevenue) {
                return [
                    'type' => $item->order_type,
                    'count' => (int) $item->count,
                    'revenue' => (float) $item->revenue,
                    'count_percentage' => $currentOrders > 0 ? round(($item->count / $currentOrders) * 100, 1) : 0,
                    'revenue_percentage' => $currentRevenue > 0 ? round(($item->revenue / $currentRevenue) * 100, 1) : 0
                ];
            });

            $recentOrders = Order::where('branch_id', $branchId)
                ->whereBetween('created_at', [$start, $end])
                ->with(['items', 'restaurantTable', 'deliveryPartner', 'user'])
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($order) {
                    return [
                        'id' => $order->id,
                       
                        'order_number' => $order->order_code ?? 'ORD-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
                        'total' => (float) $order->total,
                        'item_count' => $order->items->count(),
                        'time' => $order->created_at->format('H:i'),
                        'date' => $order->created_at->format('M d, Y'),
                        'status' => $order->status,
                        'order_type' => $order->order_type,
                        
                
                        'restaurant_table' => $order->restaurantTable ? [
                            'id' => $order->restaurantTable->id,
                            'table_number' => $order->restaurantTable->table_number,
                        ] : null,

                        'delivery_partner' => $order->deliveryPartner ? [
                            'id' => $order->deliveryPartner->id,
                            'name' => $order->deliveryPartner->name,
                        ] : null,
                    ];
                });

        $topModifiers = OrderItem::whereIn('order_id', $currentOrdersQuery->pluck('id'))
                    ->whereNotNull('selected_modifiers')
                    ->select('selected_modifiers')
                    ->get()
                    ->flatMap(function ($item) {
                        $modifiers = $item->selected_modifiers;
                        if (is_string($modifiers)) {
                            $modifiers = json_decode($modifiers, true);
                        }
                        return is_array($modifiers) ? $modifiers : [];
                    })
                    ->groupBy('id')
                    ->map(function ($group, $modifierId) {
                        return [
                            'id' => $modifierId,
                            'name' => $group->first()['name'] ?? 'Unknown',
                            'count' => $group->count(),
                            'total_price' => $group->sum('price')
                        ];
                    })
                    ->sortByDesc('count')
                    ->take(5)
                    ->values();

        return response()->json([
            'metrics' => [
                'revenue' => [
                    'current' => round($currentRevenue, 2),
                    'previous' => round($previousRevenue, 2),
                    'change' => $revenueChange
                ],
                'orders' => [
                    'current' => $currentOrders,
                    'previous' => $previousOrders,
                    'change' => $ordersChange
                ],
                'aov' => [
                    'current' => round($currentAOV, 2),
                    'previous' => round($previousAOV, 2),
                    'change' => $aovChange
                ],
                // --- Updated: Most Ordered Table Stats ---
                'most_ordered_table' => [
                    'current' => [
                        'id' => $currentMostOrderedTable?->restaurant_table_id,
                        'table_number' => $currentMostOrderedTable?->restaurantTable?->table_number ?? 'N/A',
                        'order_count' => $currentMostOrderedTable?->order_count ?? 0
                    ],
                    'previous' => [
                        'id' => $previousMostOrderedTable?->restaurant_table_id,
                        'table_number' => $previousMostOrderedTable?->restaurantTable?->table_number ?? 'N/A',
                        'order_count' => $previousMostOrderedTable?->order_count ?? 0
                    ]
                ],
                'peak_hour' => $peakHourValue,
                'avg_prep_time' => $avgPrepTime ? round($avgPrepTime) : null,
                'total_items_sold' => OrderItem::whereIn('order_id', $currentOrdersQuery->pluck('id'))->sum('quantity'),
                'order_types' => $orderTypeDistribution
            ],
            'top_selling' => $topSelling,
            'category_revenue' => $categoryRevenue,
            'heatmap_data' => $heatmapData,
            'recent_orders' => $recentOrders,
            'top_modifiers' => $topModifiers,
            'date_range' => [
                'start' => $start->toDateTimeString(),
                'end' => $end->toDateTimeString(),
                'human_readable' => $this->getHumanReadableDateRange($start, $end, $request->has('start_time'))
            ]
        ]);
    }

    private function calculatePercentageChange($current, $previous) {
        if ($previous == 0) return $current > 0 ? 100 : 0;
        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function calculateIntensity($value, $max) {
        if ($max == 0) return 0;
        $intensity = ($value / $max) * 100;
        if ($intensity == 0) return 0;
        if ($intensity <= 25) return 1;
        if ($intensity <= 50) return 2;
        if ($intensity <= 75) return 3;
        return 4;
    }

    private function getHumanReadableDateRange($start, $end, $hasTime = false) {
        if ($hasTime) return $start->format('M d, Y H:i') . ' - ' . $end->format('M d, Y H:i');
        return $start->isSameDay($end) ? $start->format('M d, Y') : $start->format('M d, Y') . ' - ' . $end->format('M d, Y');
    }


    // Additional endpoint for real-time updates
    public function realtime(Request $request) {
        $branchId = Auth::user()->branch_id;
        
        $lastHour = Carbon::now()->subHour();
        
        $recentStats = [
            'orders_last_hour' => Order::where('branch_id', $branchId)
                ->where('created_at', '>=', $lastHour)
                ->where('status', 'paid')
                ->count(),
            'revenue_last_hour' => Order::where('branch_id', $branchId)
                ->where('created_at', '>=', $lastHour)
                ->where('status', 'paid')
                ->sum('total'),
            'pending_orders' => Order::where('branch_id', $branchId)
                ->whereIn('status', ['pending', 'confirmed', 'cooking'])
                ->count(),
            'active_tables' => Order::where('branch_id', $branchId)
                ->whereIn('status', ['pending', 'confirmed', 'cooking', 'ready', 'in_service'])
                ->where('order_type', 'walk_in')
                ->distinct('restaurant_table_id')
                ->count('restaurant_table_id')
        ];

        return response()->json($recentStats);
    }
}