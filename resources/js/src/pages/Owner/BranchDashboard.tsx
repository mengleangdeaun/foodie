import { useState, useEffect, useCallback } from 'react';
import api from '@/util/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DollarSign,
    ShoppingBag,
    TrendingUp,
    Clock,
    Loader2,
    Users,
    TrendingDown,
    TrendingUp as TrendingUpIcon,
    PieChart,
    BarChart3,
    Download,
    RefreshCw,
    Filter,
    Calendar,
    Eye,
    Table,
    Activity,
    Package,
    ChefHat,
    ShoppingCart,
    UtensilsCrossed,
    Thermometer,
    Zap,
    AlertCircle,
    ListOrdered
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart as RechartPieChart,
    Pie,
    Legend,
    CartesianGrid,
    AreaChart,
    Area,
    ComposedChart,
    Line
} from 'recharts';
import { format, startOfDay, endOfDay, subDays, isSameDay, parseISO, differenceInDays } from 'date-fns';
import DateTimeRangePicker, { DateTimeRange } from "@/components/ui/date-time-range-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast, toast } from "@/hooks/use-toast";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/shift-away.css';
import OrderTypeBadge from "./components/OrderTypeBadge";
import { ORDER_STATUS, STATUS_CONFIG } from '@/constants/orderStatus';
import { cn } from "@/lib/utils";

// Types
interface DashboardData {
    metrics: {
        revenue: { current: number; previous: number; change: number };
        orders: { current: number; previous: number; change: number };
        aov: { current: number; previous: number; change: number };
        customers: { current: number; previous: number; change: number };
        peak_hour: string;
        avg_prep_time: number | null;
        total_items_sold: number;
        order_types: Array<{
            type: string;
            count: number;
            revenue: number;
            count_percentage: number;
            revenue_percentage: number;
        }>;
    };
    top_selling: Array<{
        id: number;
        name: string;
        total_qty: number;
        total_revenue: number;
    }>;
    category_revenue: Array<{
        id: number;
        name: string;
        value: number;
        percentage: number;
        order_count: number;
    }>;
    heatmap_data: Array<{
        hour: string;
        hour_number: number;
        order_count: number;
        revenue: number;
        avg_order_value: number;
        intensity: number;
    }>;
    recent_orders: Array<any>;
    top_modifiers: Array<any>;
    date_range: {
        human_readable: string;
    };
}

const BranchDashboard = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange | undefined>({
        startDate: startOfDay(subDays(new Date(), 7)),
        endDate: endOfDay(new Date()),
        useTimeRange: false,
    });
    const [activeTab, setActiveTab] = useState('overview');
    const [realtimeStats, setRealtimeStats] = useState({
        orders_last_hour: 0,
        revenue_last_hour: 0,
        pending_orders: 0,
        active_tables: 0
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};

            if (dateTimeRange) {
                params.start_date = format(dateTimeRange.startDate, 'yyyy-MM-dd');
                params.end_date = format(dateTimeRange.endDate, 'yyyy-MM-dd');

                if (dateTimeRange.useTimeRange && dateTimeRange.startTime && dateTimeRange.endTime) {
                    params.start_time = dateTimeRange.startTime;
                    params.end_time = dateTimeRange.endTime;
                }
            }

            const res = await api.get('/admin/branch/dashboard', { params });
            setData(res.data);
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error);
            toast(error.response?.data?.error || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    }, [dateTimeRange]);

    const fetchRealtimeData = async () => {
        try {
            const res = await api.get('/admin/branch/dashboard/realtime');
            setRealtimeStats(res.data);
        } catch (error) {
            console.error('Error fetching realtime data:', error);
        }
    };

    useEffect(() => {
        fetchData();

        // Fetch realtime data every 30 seconds
        fetchRealtimeData();
        const interval = setInterval(fetchRealtimeData, 30000);

        return () => clearInterval(interval);
    }, [fetchData]);

    const handleApplyFilters = () => {
        // Validate date range doesn't exceed 30 days
        if (dateTimeRange?.startDate && dateTimeRange?.endDate) {
            const daysDiff = differenceInDays(dateTimeRange.endDate, dateTimeRange.startDate);
            if (daysDiff > 30) {
                // toast.error('Date range cannot exceed 30 days');
                toast({
                    variant: "destructive",
                    title: "Update failed",
                    description: "Date range cannot exceed 30 days"
                });
                console.log('Date range cannot exceed 30');
                return;
            }
        }
        fetchData();
    };

    const handleResetFilters = () => {
        setDateTimeRange({
            startDate: startOfDay(subDays(new Date(), 6)),
            endDate: endOfDay(new Date()),
            useTimeRange: false,
        });
        setTimeout(() => fetchData(), 100);
    };

    const handleExport = () => {
        if (!data) return;

        const csvContent = convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `branch-dashboard-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const convertToCSV = (data: DashboardData) => {
        const headers = ['Metric', 'Current', 'Previous', 'Change (%)'];
        const rows = [
            ['Revenue', data.metrics.revenue.current, data.metrics.revenue.previous, data.metrics.revenue.change],
            ['Orders', data.metrics.orders.current, data.metrics.orders.previous, data.metrics.orders.change],
            ['Average Order Value', data.metrics.aov.current, data.metrics.aov.previous, data.metrics.aov.change],
            ['Customers', data.metrics.customers.current, data.metrics.customers.previous, data.metrics.customers.change],
        ];

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    };

    const getStatusClasses = (status: string): string => {
        const config = STATUS_CONFIG[status];
        if (!config) return '';

        return `${config.bg} ${config.border} ${config.text} ${config.darkBg} ${config.darkBorder} ${config.darkText} border-2`;
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Heatmap cell colors based on intensity
    const getHeatmapColor = (intensity: number) => {
        switch (intensity) {
            case 0: return 'bg-gray-100 dark:bg-gray-800';
            case 1: return 'bg-blue-100 dark:bg-blue-900/30';
            case 2: return 'bg-blue-300 dark:bg-blue-700/50';
            case 3: return 'bg-blue-500 dark:bg-blue-600';
            case 4: return 'bg-blue-700 dark:bg-blue-500';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Branch Performance</h2>
                    <p className="text-muted-foreground">
                        {data?.date_range?.human_readable || 'Loading...'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        disabled={loading}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExport}
                        disabled={loading || !data}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Realtime Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Last Hour Orders</p>
                            <p className="text-2xl font-bold mt-1">{realtimeStats.orders_last_hour}</p>
                        </div>
                        <Clock className="h-5 w-5 text-blue-500" />
                    </div>
                </div>

                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Last Hour Revenue</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(realtimeStats.revenue_last_hour)}</p>
                        </div>
                        <Zap className="h-5 w-5 text-green-500" />
                    </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Pending Orders</p>
                            <p className="text-2xl font-bold mt-1">{realtimeStats.pending_orders}</p>
                        </div>
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                    </div>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Active Tables</p>
                            <p className="text-2xl font-bold mt-1">{realtimeStats.active_tables}</p>
                        </div>
                        <Table className="h-5 w-5 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <Card className="border shadow-sm">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <DateTimeRangePicker
                            value={dateTimeRange}
                            onChange={setDateTimeRange}
                            label="Select Date & Time Range"
                            required
                            className="w-full "

                        />

                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                                {dateTimeRange?.useTimeRange ? (
                                    <span className="flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        Time filter is active
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Using full day ranges (00:00 - 23:59)
                                    </span>
                                )}
                            </div>

                            <Button
                                onClick={handleApplyFilters}
                                className="bg-primary hover:bg-primary/90"
                                disabled={loading || !dateTimeRange}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <Filter className="h-4 w-4 mr-2" />
                                        Apply Filters
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full max-w-2xl">
                    <TabsTrigger value="overview">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="products">
                        <Package className="h-4 w-4 mr-2" />
                        Products
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                        <PieChart className="h-4 w-4 mr-2" />
                        Analytics
                    </TabsTrigger>
                    <TabsTrigger value="heatmap">
                        <Thermometer className="h-4 w-4 mr-2" />
                        Heatmap
                    </TabsTrigger>
                    <TabsTrigger value="recentOrder">
                        <ListOrdered className="h-4 w-4 mr-2" />
                        Recent Order
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard
                            title="Total Revenue"
                            value={formatCurrency(data?.metrics?.revenue?.current ?? 0)}
                            icon={<DollarSign className="h-5 w-5" />}
                            change={data?.metrics?.revenue?.change ?? 0}
                            loading={loading}
                            color="bg-gradient-to-br from-green-500/10 to-green-500/5"
                            iconColor="text-green-500"
                            subtitle="vs previous period"
                        />

                        <MetricCard
                            title="Total Orders"
                            value={(data?.metrics?.orders?.current ?? 0).toLocaleString()}
                            icon={<ShoppingBag className="h-5 w-5" />}
                            change={data?.metrics?.orders?.change ?? 0}
                            loading={loading}
                            color="bg-gradient-to-br from-blue-500/10 to-blue-500/5"
                            iconColor="text-blue-500"
                            subtitle="transactions"
                        />

                        <MetricCard
                            title="Avg. Order Value"
                            value={formatCurrency(data?.metrics?.aov?.current ?? 0)}
                            icon={<TrendingUp className="h-5 w-5" />}
                            change={data?.metrics?.aov?.change ?? 0}
                            loading={loading}
                            color="bg-gradient-to-br from-purple-500/10 to-purple-500/5"
                            iconColor="text-purple-500"
                            subtitle="per transaction"
                        />

                        <MetricCard
                            title="Most Popular Table"
                            value={data?.metrics?.most_ordered_table?.current?.table_number ?? 'N/A'}
                            icon={<Table className="h-5 w-5" />} // Changed icon from Users to Table
                            subtitle={`${data?.metrics?.most_ordered_table?.current?.order_count ?? 0} orders served`}
                            loading={loading}
                            color="bg-gradient-to-br from-orange-500/10 to-orange-500/5"
                            iconColor="text-orange-500"
                        />
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Products Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        <span>Top Selling Products</span>
                                    </div>
                                    <Badge variant="secondary">
                                        Quantity Sold
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    Best performing products by quantity sold
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (data?.top_selling?.length ?? 0) > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={data.top_selling}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                className="stroke-border"
                                            />
                                            <XAxis
                                                dataKey="name"
                                                angle={-45}
                                                textAnchor="end"
                                                height={60}
                                                fontSize={12}
                                                className="fill-muted-foreground"
                                                stroke="hsl(var(--muted-foreground))"
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                fontSize={12}
                                                className="fill-muted-foreground"
                                                stroke="hsl(var(--muted-foreground))"
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                fontSize={12}
                                                className="fill-muted-foreground"
                                                stroke="hsl(var(--muted-foreground))"
                                            />
                                            <Tooltip
                                                formatter={(value, name) => {
                                                    if (name === 'total_qty') return [`${value} units`, 'Quantity'];
                                                    if (name === 'total_revenue') return [formatCurrency(value as number), 'Revenue'];
                                                    return [value, name];
                                                }}
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--popover))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '0.5rem',
                                                    color: 'hsl(var(--popover-foreground))'
                                                }}
                                                labelStyle={{
                                                    color: 'hsl(var(--popover-foreground))'
                                                }}
                                            />
                                            <Bar
                                                yAxisId="left"
                                                dataKey="total_qty"
                                                fill="hsl(var(--primary))"
                                                name="Quantity"
                                                radius={[4, 4, 0, 0]}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="total_revenue"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={2}
                                                name="Revenue"
                                                dot={{ fill: 'hsl(var(--primary))' }}
                                            />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        No product data available for the selected period
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Category Distribution Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <PieChart className="h-5 w-5 text-primary" />
                                        <span>Revenue by Category</span>
                                    </div>
                                    <Badge variant="secondary">Revenue Share</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Distribution of revenue across product categories
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                {loading ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (data?.category_revenue?.length ?? 0) > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartPieChart>
                                            <Pie
                                                data={data.category_revenue}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={{
                                                    stroke: 'hsl(var(--muted-foreground))',
                                                    strokeWidth: 1
                                                }}
                                                label={(props) => {
                                                    const { x, y, name, percentage, cx } = props;
                                                    return (
                                                        <text
                                                            x={x}
                                                            y={y}
                                                            fill="hsl(var(--foreground))"
                                                            textAnchor={x > cx ? 'start' : 'end'}
                                                            dominantBaseline="central"
                                                            className="text-xs font-medium"
                                                        >
                                                            {`${name}: ${percentage}%`}
                                                        </text>
                                                    );
                                                }}
                                                outerRadius={80}
                                                dataKey="value"
                                                stroke="hsl(var(--background))"
                                                strokeWidth={2}
                                            >
                                                {data.category_revenue.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={[
                                                            'hsl(var(--primary))',
                                                            'hsl(var(--chart-1))',
                                                            'hsl(var(--chart-2))',
                                                            'hsl(var(--chart-3))',
                                                            'hsl(var(--chart-4))',
                                                            'hsl(var(--chart-5))',
                                                            'hsl(var(--secondary))',
                                                            'hsl(var(--accent))',
                                                            'hsl(var(--muted))'
                                                        ][index % 9]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value, name, props) => [
                                                    formatCurrency(value as number),
                                                    `${props.payload.name} (${props.payload.percentage}%)`
                                                ]}
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--popover))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '0.5rem',
                                                    color: 'hsl(var(--popover-foreground))'
                                                }}
                                                itemStyle={{
                                                    color: 'hsl(var(--popover-foreground))'
                                                }}
                                                labelStyle={{
                                                    color: 'hsl(var(--popover-foreground))'
                                                }}
                                            />
                                            <Legend
                                                wrapperStyle={{
                                                    color: 'hsl(var(--foreground))'
                                                }}
                                                iconType="circle"
                                            />
                                        </RechartPieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        No category data available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Heatmap Tab */}
                <TabsContent value="heatmap" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Thermometer className="h-5 w-5 text-primary" />
                                    <span>Hourly Order Heatmap</span>
                                </div>
                                <Badge variant="secondary">
                                    Busy Hours Analysis
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardDescription className="px-6 pb-2">
                            Order intensity by hour of day (darker = busier)
                        </CardDescription>
                        <CardContent>
                            {loading ? (
                                <div className="h-[400px] flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (data?.heatmap_data?.length ?? 0) > 0 ? (
                                <div>
                                    <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-24 gap-1 mb-6">
                                        {data.heatmap_data.map((hourData, index) => (
                                            <div key={index} className="flex flex-col items-center">
                                                <Tippy
                                                    content={`${hourData.hour}: ${hourData.order_count} orders, ${formatCurrency(hourData.revenue)}`}
                                                    placement="top"
                                                    arrow={true}
                                                    animation="fade"
                                                >
                                                    <div
                                                        className={`w-full h-8 rounded ${getHeatmapColor(hourData.intensity)} transition-all duration-300 hover:scale-105 cursor-help`}
                                                    />
                                                </Tippy>

                                                <span className="text-xs mt-1 text-muted-foreground">
                                                    {hourData.hour.split(':')[0]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-gray-100" />
                                                <span>Low</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-blue-300" />
                                                <span>Medium</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded bg-blue-700" />
                                                <span>High</span>
                                            </div>
                                        </div>
                                        <div>
                                            Peak Hour: <span className="font-semibold">{data.metrics.peak_hour}</span>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <h4 className="font-semibold mb-4">Hourly Breakdown</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left p-2">Hour</th>
                                                        <th className="text-left p-2">Orders</th>
                                                        <th className="text-left p-2">Revenue</th>
                                                        <th className="text-left p-2">Avg. Order Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.heatmap_data.filter(h => h.order_count > 0).map((hourData, index) => (
                                                        <tr key={index} className="border-b hover:bg-muted/50">
                                                            <td className="p-2 font-medium">{hourData.hour}</td>
                                                            <td className="p-2">{hourData.order_count}</td>
                                                            <td className="p-2">{formatCurrency(hourData.revenue)}</td>
                                                            <td className="p-2">{formatCurrency(hourData.avg_order_value)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                    No heatmap data available for the selected period
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Performance</CardTitle>
                            <CardDescription>
                                Detailed breakdown of product sales and revenue
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-[200px] flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (data?.top_selling?.length ?? 0) > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-3">Product</th>
                                                <th className="text-left p-3">Quantity Sold</th>
                                                <th className="text-left p-3">Revenue</th>
                                                <th className="text-left p-3">Avg. Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.top_selling.map((product, index) => (
                                                <tr key={index} className="border-b hover:bg-muted/50">
                                                    <td className="p-3 font-medium">{product.name}</td>
                                                    <td className="p-3">{product.total_qty}</td>
                                                    <td className="p-3">{formatCurrency(product.total_revenue)}</td>
                                                    <td className="p-3">
                                                        {formatCurrency(product.total_qty > 0 ? product.total_revenue / product.total_qty : 0)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                    No product data available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Type Analysis</CardTitle>
                            <CardDescription>
                                Distribution of orders by type
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-[300px] flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (data?.metrics?.order_types?.length ?? 0) > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold mb-4">By Order Count</h4>
                                        <div className="space-y-3">
                                            {data.metrics.order_types.map((type, index) => (
                                                <div key={index} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="capitalize">{type.type.replace('_', ' ')}</span>
                                                        <span className="font-medium">{type.count} ({type.count_percentage}%)</span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${type.count_percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-4">By Revenue</h4>
                                        <div className="space-y-3">
                                            {data.metrics.order_types.map((type, index) => (
                                                <div key={index} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="capitalize">{type.type.replace('_', ' ')}</span>
                                                        <span className="font-medium">
                                                            {formatCurrency(type.revenue)} ({type.revenue_percentage}%)
                                                        </span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-green-500"
                                                            style={{ width: `${type.revenue_percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                    No order type data available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="recentOrder" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>
                                Your recent orders history
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-[200px] flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (data?.recent_orders?.length ?? 0) > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-3">Order Number</th>
                                                <th className="text-left p-3">Total</th>
                                                <th className="text-left p-3">Time</th>
                                                <th className="text-left p-3">Order Type</th>
                                                <th className="text-left p-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.recent_orders.map((order, index) => (
                                                <tr key={index} className="border-b hover:bg-muted/50">
                                                    <td className="p-3 font-medium">{order.order_number}</td>
                                                    <td className="p-3">${order.total}</td>
                                                    <td className="p-3">{order.time}</td>
                                                    <td className="p-3"><OrderTypeBadge order={order} /></td>
                                                    <td className='p-3' >
                                                        <Badge
                                                            variant="outline"
                                                            className={`${getStatusClasses(order.status)}  font-medium`}>
                                                            {STATUS_CONFIG[order.status]?.label}
                                                        </Badge>
                                                    </td>
                                                </tr>

                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                    No product data available
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Peak Hour
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">
                                    {data?.metrics?.peak_hour || 'N/A'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Highest order volume hour
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-primary/10">
                                <Clock className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg. Preparation Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">
                                    {data?.metrics?.avg_prep_time ? `${data.metrics.avg_prep_time} min` : 'N/A'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Order to completion
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-blue-500/10">
                                <ChefHat className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Items Sold
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold">
                                    {data?.metrics?.total_items_sold?.toLocaleString() || '0'}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Items across all orders
                                </p>
                            </div>
                            <div className="p-3 rounded-full bg-green-500/10">
                                <ShoppingCart className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    change: number;
    loading: boolean;
    color: string;
    iconColor: string;
    subtitle?: string;
}

const MetricCard = ({ title, value, icon, change, loading, color, iconColor, subtitle }: MetricCardProps) => (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    <div className={iconColor}>{icon}</div>
                </div>
                {!loading && change !== undefined && !isNaN(change) && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${change >= 0
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-red-500/10 text-red-600'
                        }`}>
                        {change >= 0 ? (
                            <TrendingUpIcon className="h-3 w-3" />
                        ) : (
                            <TrendingDown className="h-3 w-3" />
                        )}
                        {Math.abs(change).toFixed(1)}%
                    </div>
                )}
            </div>

            <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                {loading ? (
                    <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                ) : (
                    <div>
                        <h3 className="text-2xl font-bold">{value}</h3>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
);

export default BranchDashboard;