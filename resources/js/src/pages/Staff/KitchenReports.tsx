import { useEffect, useState, useMemo } from 'react';
import api from '@/util/api';
import { 
    Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter 
} from "@/components/ui/card";
import { 
    BarChart3, Zap, Clock, TrendingUp, Award, Calendar,
    ChevronRight, Loader2, ArrowUpRight, Download, Users,
    ChefHat, Target, TrendingDown, PieChart, LineChart,
    DollarSign, Star, Shield, TrendingUp as TrendingUpIcon,
    RefreshCw, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const KitchenReports = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('today');
    const [activeView, setActiveView] = useState('overview');
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchReportData();
    }, [timeRange, refreshKey]);

    const fetchReportData = async () => {
        try {
            const res = await api.get(`/admin/kitchen/reports/${timeRange}`);
            setStats(res.data);
        } finally {
            setLoading(false);
        }
    };

    const refreshData = () => {
        setRefreshKey(prev => prev + 1);
    };

    const exportReport = (format: string) => {
        // Export functionality
        console.log(`Exporting report as ${format}...`);
        // In real implementation, this would trigger a download
    };

    const timeRangeOptions = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' },
        { value: 'year', label: 'This Year' },
    ];

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
            <div className="relative">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
                <BarChart3 className="absolute inset-0 m-auto text-white animate-pulse h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-400">Loading performance data...</p>
        </div>
    );

    const performanceMetrics = [
        {
            label: 'Order Accuracy',
            value: stats?.order_accuracy || '98.7%',
            target: '99%',
            trend: 'up',
            icon: Target,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        {
            label: 'Avg Prep Time',
            value: `${stats?.avg_prep_time || 0}m`,
            target: '15m',
            trend: stats?.avg_prep_time > 15 ? 'down' : 'up',
            icon: Clock,
            color: 'text-primary',
            bg: 'bg-primary/10'
        },
        {
            label: 'Ticket Volume',
            value: stats?.total_orders || 0,
            target: 'Daily Goal',
            trend: 'up',
            icon: TrendingUp,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            label: 'Peak Efficiency',
            value: stats?.busiest_hour || '12:00',
            target: 'Peak Hour',
            trend: 'neutral',
            icon: Zap,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10'
        }
    ];

    const topItems = stats?.top_items || [
        { name: 'Classic Burger', count: 124, revenue: 1488 },
        { name: 'Margarita Pizza', count: 89, revenue: 1602 },
        { name: 'Caesar Salad', count: 67, revenue: 1005 },
        { name: 'Chocolate Cake', count: 45, revenue: 900 }
    ];

    const staffPerformance = stats?.staff_performance || [
        { name: 'Chef Alex', orders: 45, avgTime: '12m', accuracy: '99%' },
        { name: 'Chef Maria', orders: 38, avgTime: '14m', accuracy: '98%' },
        { name: 'Chef James', orders: 42, avgTime: '11m', accuracy: '100%' },
        { name: 'Chef Sarah', orders: 36, avgTime: '16m', accuracy: '97%' }
    ];

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-950">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">Performance Analytics</h1>
                                <p className="text-sm text-slate-400 font-medium">
                                    Real-time kitchen efficiency and productivity insights
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-32 md:w-40 bg-slate-800/50 border-slate-700 text-white">
                                <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                                {timeRangeOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button 
                            variant="outline"
                            size="icon"
                            onClick={refreshData}
                            className="bg-white/5 hover:bg-white/10 border-slate-700"
                        >
                            <RefreshCw size={16} />
                        </Button>

                        <Button 
                            onClick={() => exportReport('pdf')}
                            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                        >
                            <Download size={16} className="mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Time Range Tabs */}
                <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
                    <TabsList className="bg-slate-800/50 border border-slate-700 p-1">
                        <TabsTrigger value="overview" className="flex-1 data-[state=active]:bg-primary">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="efficiency" className="flex-1 data-[state=active]:bg-primary">
                            Efficiency
                        </TabsTrigger>
                        <TabsTrigger value="revenue" className="flex-1 data-[state=active]:bg-primary">
                            Revenue
                        </TabsTrigger>
                        <TabsTrigger value="staff" className="flex-1 data-[state=active]:bg-primary">
                            Staff
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Main Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeView}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeView === 'overview' && (
                        <div className="space-y-6">
                            {/* Performance Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {performanceMetrics.map((metric, index) => (
                                    <motion.div
                                        key={metric.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-primary/30 transition-all duration-300">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={`h-12 w-12 rounded-xl ${metric.bg} ${metric.color} flex items-center justify-center`}>
                                                        <metric.icon size={20} />
                                                    </div>
                                                    <Badge 
                                                        variant={metric.trend === 'up' ? 'default' : 'destructive'}
                                                        className="text-xs"
                                                    >
                                                        {metric.trend === 'up' ? '+5.2%' : '-2.1%'}
                                                    </Badge>
                                                </div>
                                                <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
                                                <p className="text-sm text-slate-400 font-medium mb-2">{metric.label}</p>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500">Target: {metric.target}</span>
                                                    <span className={`${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'} flex items-center gap-1`}>
                                                        {metric.trend === 'up' ? <TrendingUpIcon size={12} /> : <TrendingDown size={12} />}
                                                        {metric.trend === 'up' ? 'On track' : 'Needs attention'}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Hourly Ticket Flow */}
                                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg font-bold text-white">
                                                    Ticket Flow per Hour
                                                </CardTitle>
                                                <CardDescription className="text-slate-400">
                                                    Peak hours and traffic patterns
                                                </CardDescription>
                                            </div>
                                            <Calendar className="h-5 w-5 text-primary" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64 flex items-end gap-2">
                                            {stats?.hourly_data?.map((d: any, i: number) => {
                                                const maxCount = Math.max(...(stats.hourly_data || []).map((x: any) => x.count));
                                                const heightPercentage = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                                                
                                                return (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-3">
                                                        <div className="w-full flex flex-col items-center gap-1">
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${heightPercentage}%` }}
                                                                transition={{ delay: i * 0.05, duration: 1 }}
                                                                className="w-3/4 bg-gradient-to-t from-primary to-primary/40 rounded-t-lg"
                                                            />
                                                            <span className="text-[10px] font-medium text-slate-500">{d.hour}:00</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-white">{d.count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Service Health Score */}
                                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg font-bold text-white">
                                                    Service Health Score
                                                </CardTitle>
                                                <CardDescription className="text-slate-400">
                                                    Overall kitchen performance metrics
                                                </CardDescription>
                                            </div>
                                            <Award className="h-5 w-5 text-amber-500" />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {[
                                            { label: 'Order Precision', value: 99.2, color: 'bg-green-500', icon: Shield },
                                            { label: 'Speed Target (<15m)', value: 86.5, color: 'bg-primary', icon: Clock },
                                            { label: 'Customer Satisfaction', value: 94.8, color: 'bg-blue-500', icon: Star },
                                            { label: 'Waste Reduction', value: 78.3, color: 'bg-amber-500', icon: TrendingDown }
                                        ].map((item, index) => (
                                            <div key={item.label} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <item.icon className="h-4 w-4 text-slate-400" />
                                                        <span className="text-sm font-medium text-slate-300">{item.label}</span>
                                                    </div>
                                                    <span className="text-sm font-bold text-white">{item.value}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${item.value}%` }}
                                                        transition={{ delay: index * 0.1, duration: 1 }}
                                                        className={`h-full ${item.color} rounded-full`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Top Items & Staff Performance */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Top Performing Items */}
                                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg font-bold text-white">
                                                    Top Performing Items
                                                </CardTitle>
                                                <CardDescription className="text-slate-400">
                                                    Most popular dishes by volume
                                                </CardDescription>
                                            </div>
                                            <PieChart className="h-5 w-5 text-green-500" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {topItems.map((item: any, index: number) => (
                                                <div key={item.name} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-md bg-slate-700 flex items-center justify-center text-xs font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{item.name}</p>
                                                            <p className="text-xs text-slate-400">Revenue: ${item.revenue}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-white">{item.count} orders</p>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {((item.count / stats?.total_orders) * 100).toFixed(1)}%
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Staff Performance */}
                                <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg font-bold text-white">
                                                    Staff Performance
                                                </CardTitle>
                                                <CardDescription className="text-slate-400">
                                                    Team efficiency metrics
                                                </CardDescription>
                                            </div>
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {staffPerformance.map((staff: any, index: number) => (
                                                <div key={staff.name} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-slate-700 to-slate-600 flex items-center justify-center">
                                                            <ChefHat size={16} />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{staff.name}</p>
                                                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                                                <span>{staff.orders} orders</span>
                                                                <span>•</span>
                                                                <span>{staff.avgTime} avg</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge 
                                                            variant={
                                                                parseInt(staff.accuracy) >= 99 ? 'default' : 
                                                                parseInt(staff.accuracy) >= 95 ? 'secondary' : 'destructive'
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {staff.accuracy} accuracy
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeView === 'efficiency' && (
                        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-white">Efficiency Analytics</CardTitle>
                                <CardDescription>Detailed performance breakdown and optimization insights</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Efficiency metrics content */}
                                <div className="text-center py-12">
                                    <LineChart className="h-12 w-12 text-primary mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Efficiency View</h3>
                                    <p className="text-slate-400">Advanced efficiency analytics coming soon</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeView === 'revenue' && (
                        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-white">Revenue Analytics</CardTitle>
                                <CardDescription>Sales performance and financial insights</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Revenue metrics content */}
                                <div className="text-center py-12">
                                    <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Revenue View</h3>
                                    <p className="text-slate-400">Financial performance analytics coming soon</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeView === 'staff' && (
                        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-white">Staff Analytics</CardTitle>
                                <CardDescription>Team performance and productivity insights</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {/* Staff analytics content */}
                                <div className="text-center py-12">
                                    <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">Staff View</h3>
                                    <p className="text-slate-400">Team performance analytics coming soon</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Export Options */}
            <Card className="mt-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-white">Export Report</CardTitle>
                    <CardDescription>Download comprehensive reports for analysis</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button 
                            variant="outline" 
                            onClick={() => exportReport('pdf')}
                            className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border-slate-700"
                        >
                            <FileText className="h-8 w-8 text-primary" />
                            <div className="text-center">
                                <p className="font-bold text-white">PDF Report</p>
                                <p className="text-xs text-slate-400">Detailed analysis</p>
                            </div>
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => exportReport('csv')}
                            className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border-slate-700"
                        >
                            <BarChart3 className="h-8 w-8 text-green-500" />
                            <div className="text-center">
                                <p className="font-bold text-white">CSV Data</p>
                                <p className="text-xs text-slate-400">Raw data export</p>
                            </div>
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => exportReport('email')}
                            className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border-slate-700"
                        >
                            <Mail className="h-8 w-8 text-amber-500" />
                            <div className="text-center">
                                <p className="font-bold text-white">Email Summary</p>
                                <p className="text-xs text-slate-400">Daily digest</p>
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Add missing Mail icon import
import { Mail, FileText } from "lucide-react";

export default KitchenReports;