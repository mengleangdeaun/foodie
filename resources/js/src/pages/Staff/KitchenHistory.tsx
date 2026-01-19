import { useEffect, useState, useMemo } from 'react';
import api from '@/util/api';
import { motion, AnimatePresence } from "framer-motion";
import { 
    RotateCcw, CheckCircle2, Timer, Search, Filter, 
    Hash, User as UserIcon, Calendar, Clock, 
    TrendingUp, ArrowUpRight, FileText, RefreshCw,
    Download, ChevronDown, X, AlertCircle,
    BarChart3, CheckSquare, PieChart
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper function defined outside component to avoid initialization issues
const getPrepTime = (created: string, updated: string) => {
    const diff = Math.floor((new Date(updated).getTime() - new Date(created).getTime()) / 60000);
    return diff > 0 ? diff : 1;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        })
    };
};

const KitchenHistory = () => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState('today');
    const [statusFilter, setStatusFilter] = useState('all');
    const [prepTimeFilter, setPrepTimeFilter] = useState('all');
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [stats, setStats] = useState({
        totalOrders: 0,
        avgPrepTime: 0,
        fastestOrder: 0,
        slowestOrder: 0,
        completedToday: 0
    });

    useEffect(() => {
        fetchHistory();
        fetchStats();
    }, [dateRange]);

    const fetchHistory = async () => {
        try {
            const params: any = { status: 'ready', limit: 100 };
            if (dateRange === 'today') params.today = true;
            if (dateRange === 'week') params.week = true;
            if (dateRange === 'month') params.month = true;
            
            const res = await api.get('/admin/orders', { params });
            setHistory(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/order/stats/history');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    // --- FILTERING LOGIC ---
    const filteredHistory = useMemo(() => {
        return history.filter(order => {
            const tableNum = order.restaurant_table?.table_number?.toString() || '';
            const orderId = order.id.toString();
            const staffName = order.user?.name?.toLowerCase() || '';
            const query = searchQuery.toLowerCase();

            // Search matching
            const matchesSearch = tableNum.includes(query) || 
                                 orderId.includes(query) || 
                                 staffName.includes(query);

            // Prep time calculation
            const prepTime = getPrepTime(order.created_at, order.updated_at);
            let matchesPrepTime = true;
            if (prepTimeFilter === 'fast' && prepTime > 10) matchesPrepTime = false;
            if (prepTimeFilter === 'medium' && (prepTime <= 10 || prepTime > 20)) matchesPrepTime = false;
            if (prepTimeFilter === 'slow' && prepTime <= 20) matchesPrepTime = false;

            // Status filtering
            let matchesStatus = true;
            if (statusFilter === 'delayed' && prepTime <= 20) matchesStatus = false;
            if (statusFilter === 'efficient' && prepTime > 15) matchesStatus = false;

            return matchesSearch && matchesPrepTime && matchesStatus;
        });
    }, [history, searchQuery, prepTimeFilter, statusFilter]);

    const revertStatus = async (id: number) => {
        try {
            await api.patch(`/admin/orders/${id}/status`, { status: 'cooking' });
            setHistory(prev => prev.filter(o => o.id !== id));
            // Remove from selected if present
            setSelectedOrders(prev => prev.filter(orderId => orderId !== id));
        } catch (e) { 
            console.error(e); 
        }
    };

    const revertMultiple = async () => {
        try {
            await Promise.all(selectedOrders.map(id => 
                api.patch(`/admin/orders/${id}/status`, { status: 'cooking' })
            ));
            setHistory(prev => prev.filter(o => !selectedOrders.includes(o.id)));
            setSelectedOrders([]);
        } catch (e) {
            console.error(e);
        }
    };

    const toggleOrderSelection = (id: number) => {
        setSelectedOrders(prev => 
            prev.includes(id) 
                ? prev.filter(orderId => orderId !== id)
                : [...prev, id]
        );
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setPrepTimeFilter('all');
    };

    const exportReport = () => {
        const data = {
            dateRange,
            totalOrders: filteredHistory.length,
            averagePrepTime: Math.round(filteredHistory.reduce((acc, order) => 
                acc + getPrepTime(order.created_at, order.updated_at), 0) / filteredHistory.length || 0
            ),
            orders: filteredHistory.map(order => ({
                id: order.id,
                table: order.restaurant_table?.table_number || 'POS',
                staff: order.user?.name,
                prepTime: getPrepTime(order.created_at, order.updated_at),
                items: order.items?.map((item: any) => ({
                    name: item.product?.name,
                    quantity: item.quantity
                })),
                createdAt: order.created_at,
                completedAt: order.updated_at
            }))
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kitchen-history-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-4 md:p-6 h-full overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-950">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">Order History</h1>
                                <p className="text-sm text-slate-400 font-medium">
                                    Track completed tickets and performance metrics
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline"
                            onClick={exportReport}
                            className="bg-white/5 hover:bg-white/10 border-slate-700 text-white"
                        >
                            <Download size={16} className="mr-2" />
                            Export
                        </Button>
                        <Button 
                            onClick={fetchHistory}
                            variant="ghost"
                            size="icon"
                            className="bg-white/5 hover:bg-white/10"
                        >
                            <RefreshCw size={16} />
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Total</p>
                                    <p className="text-xl font-bold text-white">{stats.totalOrders}</p>
                                </div>
                                <FileText className="h-6 w-6 text-primary/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Avg Time</p>
                                    <p className="text-xl font-bold text-white">{stats.avgPrepTime}m</p>
                                </div>
                                <Timer className="h-6 w-6 text-green-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Fastest</p>
                                    <p className="text-xl font-bold text-white">{stats.fastestOrder}m</p>
                                </div>
                                <TrendingUp className="h-6 w-6 text-blue-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Slowest</p>
                                    <p className="text-xl font-bold text-white">{stats.slowestOrder}m</p>
                                </div>
                                <AlertCircle className="h-6 w-6 text-amber-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Today</p>
                                    <p className="text-xl font-bold text-white">{stats.completedToday}</p>
                                </div>
                                <Calendar className="h-6 w-6 text-purple-500/50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Filters and Search Section */}
            <div className="mb-6 space-y-4">
                {/* Main Controls Row */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                            <Input
                                placeholder="Search orders by table, ID, or staff..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-11 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 rounded-lg"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex flex-wrap gap-2">
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-white">
                                <SelectValue placeholder="Time range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="all">All Time</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={prepTimeFilter} onValueChange={setPrepTimeFilter}>
                            <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-white">
                                <SelectValue placeholder="Prep time" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Times</SelectItem>
                                <SelectItem value="fast">Fast (&lt;10m)</SelectItem>
                                <SelectItem value="medium">Medium (10-20m)</SelectItem>
                                <SelectItem value="slow">Slow (&gt;20m)</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Orders</SelectItem>
                                <SelectItem value="efficient">Efficient (&lt;15m)</SelectItem>
                                <SelectItem value="delayed">Delayed (&gt;20m)</SelectItem>
                            </SelectContent>
                        </Select>

                        {(searchQuery || prepTimeFilter !== 'all' || statusFilter !== 'all') && (
                            <Button
                                variant="ghost"
                                onClick={clearFilters}
                                className="text-slate-400 hover:text-white"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>

                {/* Bulk Actions Bar */}
                {selectedOrders.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckSquare className="h-5 w-5 text-primary" />
                                <span className="font-medium text-white">
                                    {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
                                </span>
                            </div>
                            <Button
                                onClick={revertMultiple}
                                variant="destructive"
                                size="sm"
                            >
                                <RotateCcw size={14} className="mr-2" />
                                Reopen Selected
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Main Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
                    <p className="text-slate-400 font-medium">Loading order history...</p>
                </div>
            ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-24 w-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
                        <FileText className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">No Orders Found</h3>
                    <p className="text-slate-500 max-w-md mb-4">
                        {searchQuery || prepTimeFilter !== 'all' || statusFilter !== 'all' 
                            ? "Try adjusting your search or filters"
                            : "No completed orders in the selected time period"}
                    </p>
                    {(searchQuery || prepTimeFilter !== 'all' || statusFilter !== 'all') && (
                        <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="mt-4"
                        >
                            Clear All Filters
                        </Button>
                    )}
                </div>
            ) : (
                <>
                    {/* Orders Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredHistory.map((order, index) => {
                                const prepMinutes = getPrepTime(order.created_at, order.updated_at);
                                const { time, date } = formatDate(order.created_at);
                                const isSelected = selectedOrders.includes(order.id);
                                const isLongWait = prepMinutes > 20;

                                return (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group"
                                    >
                                        <div 
                                            className={`bg-gradient-to-br from-white to-slate-50 border rounded-xl overflow-hidden h-full cursor-pointer transition-all duration-300 hover:shadow-xl ${
                                                isSelected 
                                                    ? 'border-primary shadow-lg shadow-primary/20' 
                                                    : isLongWait 
                                                        ? 'border-red-200 hover:border-red-300' 
                                                        : 'border-slate-200 hover:border-primary/30'
                                            }`}
                                            onClick={() => toggleOrderSelection(order.id)}
                                        >
                                            {/* Card Header */}
                                            <div className={`p-4 ${isSelected ? 'bg-primary/10' : 'bg-gradient-to-r from-slate-50 to-white'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-6 w-6 rounded-md flex items-center justify-center ${
                                                            isSelected ? 'bg-primary text-white' : 'bg-slate-900 text-white'
                                                        }`}>
                                                            <Hash size={12} />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600">
                                                            #{order.id}
                                                        </span>
                                                    </div>
                                                    <Badge 
                                                        variant={isLongWait ? "destructive" : prepMinutes > 15 ? "outline" : "default"}
                                                        className={`text-xs font-medium ${
                                                            isLongWait ? 'bg-red-50 text-red-700 border-red-200' : 
                                                            prepMinutes > 15 ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                                            'bg-green-50 text-green-700 border-green-200'
                                                        }`}
                                                    >
                                                        {prepMinutes}m
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-xl font-bold text-slate-900">
                                                        #{order.restaurant_table?.table_number || 'POS'}
                                                    </h3>
                                                    {isSelected && (
                                                        <CheckSquare className="h-5 w-5 text-primary" />
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        <span>{time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <UserIcon size={10} />
                                                        <span className="font-medium">{order.user?.name || 'System'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="p-4 border-b border-slate-100">
                                                <div className="space-y-2">
                                                    {order.items?.slice(0, 3).map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between text-sm">
                                                            <span className="text-slate-700 font-medium truncate">
                                                                {item.quantity}x {item.product?.name}
                                                            </span>
                                                            {item.remark && (
                                                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                                                                    Note
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {order.items?.length > 3 && (
                                                        <div className="text-xs text-slate-500 font-medium pt-2">
                                                            +{order.items.length - 3} more items
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Card Footer */}
                                            <div className="p-4">
                                                <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                                                    <div className="flex items-center gap-1">
                                                        <Timer size={12} />
                                                        <span>Prep: {prepMinutes}m</span>
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {date}
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        revertStatus(order.id);
                                                    }}
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900"
                                                >
                                                    <RotateCcw size={14} className="mr-2" />
                                                    Reopen Ticket
                                                </Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Footer Stats */}
                    <div className="mt-8 pt-6 border-t border-slate-800/50">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <BarChart3 size={14} />
                                    <span className="font-medium">
                                        Showing {filteredHistory.length} of {history.length} orders
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Timer size={14} />
                                    <span>
                                        Average prep time: {stats.avgPrepTime}m
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckSquare size={14} />
                                <span>
                                    Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default KitchenHistory;