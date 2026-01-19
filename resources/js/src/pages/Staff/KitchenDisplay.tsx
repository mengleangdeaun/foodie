import { useEffect, useState, useMemo } from 'react';
import api from '@/util/api';
import { getOrderDisplayLabel } from '@/util/order-format';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { 
    ChefHat, Clock, AlertCircle, Loader2, 
    Tag as TagIcon, ListChecks, X, 
    Group, Ticket, CheckCircle,
    Timer, StickyNote, Settings,
    Filter, ArrowUpDown, Check,
    ArrowDownUp, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

const KitchenDisplay = ({ isMuted }: { isMuted?: boolean }) => {
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [totalDailyCount, setTotalDailyCount] = useState(0); 
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(new Date());
    const [isGrouped, setIsGrouped] = useState(false);
    const [showRecap, setShowRecap] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('oldest');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'cooking' | 'ready'>('all');
    const [updatingOrders, setUpdatingOrders] = useState<Record<string, boolean>>({});
    
    // Helper function to check if date is today
    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    };

    // Get today's date string for display
    const getTodayString = () => {
        return now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Kitchen Recap Logic
    const kitchenRecap = useMemo(() => {
        const summary: Record<string, number> = {};
        orders.forEach(order => {
            order.items?.forEach((item: any) => {
                const name = item.product?.name || 'Unknown Item';
                summary[name] = (summary[name] || 0) + item.quantity;
            });
        });
        return Object.entries(summary).sort((a, b) => b[1] - a[1]);
    }, [orders]);

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const calculateWaitTime = (dateString: string) => {
        const diff = Math.floor((now.getTime() - new Date(dateString).getTime()) / 60000);
        return diff > 0 ? diff : 0;
    };

    const parseItemRemark = (remark: string) => {
        if (!remark) return { size: '', adds: [], presets: [], note: '' };

        let currentRemark = remark;

        // 1. Extract Size (e.g., [Size: ចានតូច])
        const sizeMatch = currentRemark.match(/\[Size:\s*([^\]]+)\]/i);
        const size = sizeMatch ? sizeMatch[1].trim() : '';
        if (sizeMatch) currentRemark = currentRemark.replace(sizeMatch[0], '');

        // 2. Extract Additions (e.g., + Egg + Vige)
        const addSectionMatch = currentRemark.match(/\+\s*([^\[]+)/);
        let adds: string[] = [];
        if (addSectionMatch) {
            adds = addSectionMatch[1].split(',').map(a => a.trim()).filter(Boolean);
            currentRemark = currentRemark.replace(addSectionMatch[0], '');
        }

        // 3. Extract Remaining Presets (e.g., [Sugar Level: 70 %])
        const tagRegex = /\[([^\]]+)\]/g;
        const presetsMatch = currentRemark.match(tagRegex) || [];
        const presets = presetsMatch.map(p => p.replace(/[\[\]]/g, '').trim()).filter(Boolean);
        currentRemark = currentRemark.replace(tagRegex, '');

        // 4. The remainder is the manual Note (e.g., អត់យកបន្លែ)
        const note = currentRemark.trim();

        return { size, adds, presets, note };
    };

    // Urgency level based on wait time
    const getUrgencyLevel = (minutes: number) => {
        if (minutes >= 20) return 'critical';
        if (minutes >= 15) return 'high';
        if (minutes >= 10) return 'medium';
        return 'low';
    };

useEffect(() => {
    fetchKitchenOrders();
    
    if (window.Echo && user?.branch_id) {
        const channel = `branch.${user.branch_id}`;
        
        // Ensure we don't have multiple listeners
        window.Echo.leave(channel);
        
        window.Echo.channel(channel)
                .listen('.order.created', (data: any) => {
                    // POINT 1: Update the total count first using a functional update
                    setTotalDailyCount(prevCount => {
                        const nextSequence = prevCount + 1;

                        // POINT 2: Nest the setOrders update inside to use the fresh nextSequence
                        setOrders(prevOrders => {
                            if (prevOrders.some(o => o.id === data.order.id)) return prevOrders;

                            // POINT 3: Manually attach the sequence so it is "locked"
                            const newOrder = { 
                                ...data.order, 
                                daily_sequence: nextSequence 
                            };
                            
                            // Add to the list (using your current sort/design)
                            return [newOrder, ...prevOrders];
                        });

                        // Return the new count to update the totalDailyCount state
                        return nextSequence;
                    });

                    if (!isMuted) {
                        const audio = new Audio('/assets/sounds/notification.mp3');
                        audio.play().catch(() => {});
                    }
                });
            
        return () => window.Echo.leave(channel);
    }
}, [user?.branch_id, isMuted]); // Note: totalDailyCount is handled via functional update to avoid re-binding Echo

const fetchKitchenOrders = async () => {
    try {
        const res = await api.get('/admin/orders/kitchen');
        // POINT: Map state to the specific 'orders' array from backend
        setOrders(Array.isArray(res.data.orders) ? res.data.orders : []);
        // POINT: Capture the total count for the header summary
        setTotalDailyCount(res.data.total_count || 0);
    } finally { setLoading(false); }
};


const displayData = useMemo(() => {
    // 1. Filter by status
    let filteredOrders = orders;
    if (statusFilter !== 'all') {
        filteredOrders = orders.filter(order => order.status === statusFilter);
    }

    // 2. Sort - Keep your FIFO (First-In, First-Out) logic
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === 'oldest' ? dateA - dateB : dateB - dateA;
    });

    if (!isGrouped) return sortedOrders;
    
    const grouped: any = {};
    
    sortedOrders.forEach(order => {
        const tableKey = order.restaurant_table?.table_number 
            ? `Table ${order.restaurant_table.table_number}`
            : (order.delivery_partner?.name || 'POS');

        if (!grouped[tableKey]) {
            grouped[tableKey] = { 
                id: `group-${tableKey}`, 
                isGroup: true, 
                display_name: tableKey,
                items: [], 
                status: order.status, 
                created_at: order.created_at, 
                orderIds: [],
                // POINT 1: Use the DB sequence property name
                daily_sequences: [] 
            };
        }
        grouped[tableKey].items.push(...order.items);
        grouped[tableKey].orderIds.push(order.id);

        // POINT 2: Push the permanent daily_sequence from the order object
        // No more looking up in getDailyOrderNumber map!
        grouped[tableKey].daily_sequences.push(order.daily_sequence || 'N/A');

        if (order.status === 'cooking') grouped[tableKey].status = 'cooking';
        if (new Date(order.created_at) < new Date(grouped[tableKey].created_at)) {
            grouped[tableKey].created_at = order.created_at;
        }
    });

    return Object.values(grouped);

// POINT 3: Remove getDailyOrderNumber from the dependency array
}, [orders, isGrouped, statusFilter, sortOrder]);

    const updateStatus = async (id: any, status: string, isGroup: boolean = false, orderIds: number[] = []) => {
        const updateKey = isGroup ? `group-${id}` : id;
        
        try {
            setUpdatingOrders(prev => ({ ...prev, [updateKey]: true }));
            
            if (isGroup) {
                await Promise.all(orderIds.map(oid => api.patch(`/admin/orders/${oid}/status`, { status })));
                if (status === 'ready') setOrders(prev => prev.filter(o => !orderIds.includes(o.id)));
                else setOrders(prev => prev.map(o => orderIds.includes(o.id) ? { ...o, status } : o));
            } else {
                await api.patch(`/admin/orders/${id}/status`, { status });
                if (status === 'ready') setOrders(prev => prev.filter(o => o.id !== id));
                else setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
            }
        } catch (e) { 
            console.error(e); 
        } finally {
            setUpdatingOrders(prev => ({ ...prev, [updateKey]: false }));
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
            <div className="relative">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
                <ChefHat className="absolute inset-0 m-auto text-white animate-pulse h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-400">Loading kitchen orders...</p>
        </div>
    );

    return (
        <div className="h-full bg-gradient-to-br from-slate-900 to-slate-950 p-4 md:p-6 overflow-y-auto">
            {/* Enhanced Header */}
            <div className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-lg rounded-2xl p-4 mb-6 border border-slate-700/50 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
                                <ChefHat className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Kitchen Display</h1>
                                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                    <Calendar size={12} />
                                    <span>{getTodayString()}</span>
                                    <span className="h-1 w-1 rounded-full bg-slate-500"></span>
                                    <span>Daily Order # Reset</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex bg-slate-800 rounded-lg p-1">
                            <button 
                                onClick={() => setIsGrouped(false)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    !isGrouped 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                <Ticket size={14} />
                                Tickets
                            </button>
                            <button 
                                onClick={() => setIsGrouped(true)}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    isGrouped 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                <Group size={14} />
                                Grouped
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button 
                            onClick={() => setShowRecap(true)}
                            variant="outline"
                            className="bg-white/5 hover:bg-white/10 border-slate-700 text-white rounded-lg h-9 px-4 text-xs font-semibold flex items-center gap-2"
                        >
                            <ListChecks size={14} />
                            Kitchen Recap
                            <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                                {kitchenRecap.length}
                            </span>
                        </Button>
                        
                        <div className="text-right">
                            <p className="text-xs font-semibold text-slate-300">
                                {displayData.length} Active {displayData.length === 1 ? 'Order' : 'Orders'}
                                {statusFilter !== 'all' && ` (${statusFilter})`}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                <Clock size={10} />
                                <span>Sorted: {sortOrder === 'oldest' ? 'Oldest First' : 'Latest First'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter and Sort Controls */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    {/* Status Filter Tabs */}
                    <div className="w-full sm:w-auto">
                        <Tabs 
                            value={statusFilter} 
                            onValueChange={(value: any) => setStatusFilter(value)}
                            className="w-full"
                        >
                            <TabsList className="bg-slate-800 p-1 h-9">
                                <TabsTrigger 
                                    value="all" 
                                    className="data-[state=active]:bg-white data-[state=active]:text-slate-900 text-xs px-3"
                                >
                                    All Orders
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="pending" 
                                    className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs px-3"
                                >
                                    Pending
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="cooking" 
                                    className="data-[state=active]:bg-primary data-[state=active]:text-white text-xs px-3"
                                >
                                    Cooking
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="ready" 
                                    className="data-[state=active]:bg-green-500 data-[state=active]:text-white text-xs px-3"
                                >
                                    Ready
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Sort and View Controls */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Sort Dropdown - Kitchen Priority: Oldest First */}
                        <Select value={sortOrder} onValueChange={(value: 'latest' | 'oldest') => setSortOrder(value)}>
                            <SelectTrigger className="h-9 bg-slate-800 border-slate-700 text-white text-xs w-[160px]">
                                <ArrowDownUp className="h-3.5 w-3.5 mr-2" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="oldest" className="text-xs">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5" />
                                        Oldest First
                                    </div>
                                </SelectItem>
                                <SelectItem value="latest" className="text-xs">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3.5 w-3.5 rotate-180" />
                                        Latest First
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* View Mode Toggle */}
                        <div className="flex bg-slate-800 rounded-lg p-1">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    viewMode === 'grid' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                Grid
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    viewMode === 'list' 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-300 hover:text-white'
                                }`}
                            >
                                List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Grid/List View - OLDEST orders appear first (top-left) */}
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-4'}`}>
                <AnimatePresence mode="popLayout">
                    {displayData.map((order: any) => {
                        const waitTime = calculateWaitTime(order.created_at);
                        const urgency = getUrgencyLevel(waitTime);
                        const isUrgent = urgency === 'critical' || urgency === 'high';
                        const isUpdating = updatingOrders[order.id] || false;
                        const orderDate = new Date(order.created_at);
                        const isOrderToday = isToday(orderDate);
                    

                        return (
                            <motion.div 
                                key={order.id} 
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`bg-gradient-to-br from-white to-slate-50 rounded-2xl overflow-hidden flex flex-col border ${
                                    isUrgent 
                                    ? 'border-red-300 shadow-lg shadow-red-500/10' 
                                    : order.status === 'cooking'
                                    ? 'border-primary/30 shadow-lg shadow-primary/5'
                                    : order.status === 'ready'
                                    ? 'border-green-300 shadow-lg shadow-green-500/10'
                                    : 'border-slate-200 shadow-md'
                                } transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5`}
                            >
                                {/* Order Header with Priority Indicator */}
                                <div className={`p-4 flex justify-between items-center ${
                                    isUrgent 
                                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                    : order.status === 'cooking'
                                    ? 'bg-gradient-to-r from-primary to-primary/90'
                                    : order.status === 'ready'
                                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                                    : 'bg-gradient-to-r from-orange-500 to-orange-600'
                                }`}>
                                    <div className="text-white">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium opacity-90">
                                                {order.restaurant_table ? 'TABLE' : 'SERVICE'}
                                            </span>
                                            {isUrgent && (
                                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                                                    URGENT
                                                </span>
                                            )}
                                            {order.status === 'ready' && (
                                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                    READY
                                                </span>
                                            )}
                                            {/* {sortOrder === 'oldest' && waitTime >= 15 && (
                                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                    WAITING {waitTime}MIN
                                                </span>
                                            )} */}
                                        </div>
                                        <h3 className="text-2xl font-bold">
                                            {order.isGroup ? order.display_name : (
                                                order.restaurant_table?.table_number 
                                                ? `#${order.restaurant_table.table_number}` 
                                                : (order.delivery_partner?.name || 'POS')
                                            )}
                                        </h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        {/* POINT 1: Use the backend sequence instead of the local variable */}
                                        {order.daily_sequence ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-semibold bg-white/20 px-2 py-0.5 rounded">
                                                    {/* This uses your global function logic */}
                                                    {getOrderDisplayLabel(order)}
                                                </span>
                                            </div>
                                        ) : null}

                                        {/* POINT 2: Show the Date Badge ONLY if it is not today */}
                                        {!isOrderToday && (
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs opacity-75 bg-white/10 px-2 py-0.5 rounded">
                                                    {orderDate.toLocaleDateString('en-US', { 
                                                        month: 'short', 
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        )}

                                        {/* POINT 3: Always show the specific Time */}
                                        <span className="text-xs opacity-75">
                                            {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`flex items-center gap-1.5 font-bold ${
                                            isUrgent ? 'text-red-100' : 'text-white/90'
                                        }`}>
                                            <Timer size={16} />
                                            <span className="text-lg">{waitTime}m</span>
                                        </div>
                                        <p className="text-[10px] opacity-75 mt-0.5 uppercase font-bold">wait time</p>
                                        
                                        {/* POINT TO MODIFY: Replace dailyOrderNumber with the DB property */}
{order.isGroup && (
    <div className="mt-2 space-y-1">
        <p className="text-[10px] opacity-75 font-black uppercase tracking-widest text-white/80">
            {order.orderIds?.length || 0} Combined Orders
        </p>
        
        {/* POINT 2: Show the actual daily numbers so the chef knows exactly which orders are at this table */}
        <p className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded inline-block text-white">
            {order.daily_sequences?.join(', ')}
        </p>
    </div>
)}
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="flex-1 p-4 space-y-3">
                                    {order.items?.map((item: any, i: number) => {
                                        const { size, adds, presets, note } = parseItemRemark(item.remark);

                                        return (
                                            <div key={i} className="space-y-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                                                <div className="flex items-start gap-3">
                                                    {/* Quantity */}
                                                    <span className="h-7 w-7 shrink-0 rounded-md bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
                                                        {item.quantity}
                                                    </span>

                                                    <div className="flex-1 space-y-2">
                                                        {/* Header: Name + Size Badge */}
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="font-bold text-slate-900 text-base">
                                                                {item.product?.name}
                                                            </h4>
                                                            {size && (
                                                                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[11px] font-black uppercase">
                                                                    {size}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Modifiers */}
                                                        {adds.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 items-center">
                                                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Additions:</span>
                                                                {adds.map((add: string, idx: number) => (
                                                                    <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-bold border border-green-200">
                                                                        {add}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Presets */}
                                                        {presets.length > 0 && (
                                                            <div className="flex items-center gap-2 text-slate-500 font-medium text-xs bg-slate-50 w-fit px-2 py-1 rounded border border-slate-100">
                                                                <Settings size={12} />
                                                                {presets.join(' • ')}
                                                            </div>
                                                        )}

                                                        {/* Special Kitchen Note */}
                                                        {note && (
                                                            <div className="bg-red-600 text-white px-3 py-2 rounded-lg mt-2 shadow-sm border-l-4 border-red-900">

                                                                <p className="text-base font-black leading-tight">
                                                                    {note}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Action Button */}
                                <div className="p-4 bg-slate-50 border-t border-slate-200">
                                    <Button 
                                        className={`w-full h-12 font-semibold rounded-xl transition-all duration-200 ${
                                            order.status === 'cooking'
                                            ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg'
                                            : order.status === 'ready'
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 opacity-50 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg'
                                        }`}
                                        onClick={() => updateStatus(
                                            order.id, 
                                            order.status === 'cooking' ? 'ready' : 'cooking', 
                                            order.isGroup, 
                                            order.orderIds
                                        )}
                                        // POINT TO MODIFY: Add the status check here
                                        disabled={isUpdating || order.status === 'ready'}
                                    >
                                        {isUpdating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : order.status === 'cooking' ? (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Mark as Ready
                                            </>
                                        ) : order.status === 'ready' ? (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Already Ready
                                            </>
                                        ) : (
                                            <>
                                                <ChefHat className="mr-2 h-4 w-4" />
                                                Start Cooking
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {displayData.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-24 w-24 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                        <ChefHat className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">
                        {statusFilter === 'all' ? 'No Active Orders' : `No ${statusFilter} Orders`}
                    </h3>
                    <p className="text-slate-500 max-w-md">
                        {statusFilter !== 'all' 
                            ? `No orders with "${statusFilter}" status. Try selecting "All Orders".`
                            : 'All caught up! New orders will appear here automatically.'}
                    </p>
                </div>
            )}

            {/* Daily Order Summary */}
            <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <h4 className="text-sm font-semibold text-slate-300">Today's Order Summary</h4>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Today's Date</p>
                            <p className="text-sm font-semibold text-white">{getTodayString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Orders Today</p>
                            <p className="text-sm font-semibold text-white">
                                {totalDailyCount}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Next Order #</p>
                            <p className="text-sm font-semibold text-white">
                                #{totalDailyCount + 1}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Kitchen Recap Modal */}
            <AnimatePresence>
                {showRecap && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowRecap(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center">
                                            <ChefHat className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">Kitchen Recap</h2>
                                            <p className="text-sm text-slate-300">Total items needed across all active orders</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setShowRecap(false)}
                                        className="h-10 w-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                    >
                                        <X className="h-5 w-5 text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Recap Content */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {kitchenRecap.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                                            <ChefHat className="h-8 w-8 text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 font-medium">No items in queue</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {kitchenRecap.map(([name, qty], index) => (
                                            <motion.div 
                                                key={name}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="h-8 w-8 rounded-md bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700">
                                                        {index + 1}
                                                    </span>
                                                    <span className="font-semibold text-slate-800">{name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-slate-500">Total</span>
                                                    <span className="h-10 w-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                                                        {qty}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-200">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-500">
                                        Updated in real-time • {kitchenRecap.length} unique items
                                    </p>
                                    <Button 
                                        onClick={() => setShowRecap(false)}
                                        className="bg-slate-900 hover:bg-slate-800 text-white"
                                    >
                                        Close Recap
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default KitchenDisplay;