import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ThermalReceipt } from '@/components/printing/ThermalReceipt';
import api from '@/util/api';
import { parseItemRemark } from '@/util/remark-util';
import { getOrderDisplayLabel } from '@/util/order-format';
import { useAuth } from '@/context/AuthContext';
import OrderTypeBadge from "./components/OrderTypeBadge";
import {
    Search, Loader2, Timer, ArrowUpRight, AlertCircle,
    Printer, XCircle, CheckCircle, ChefHat, Calendar as CalendarIcon,
    ArrowRightCircle, Settings, RefreshCw, Bell, BellOff,
    Filter, Download, MoreVertical, Clock, Users, DollarSign,
    Package, Utensils, Truck, Coffee, Check, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, differenceInMinutes, isToday } from "date-fns";

// Shadcn UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import OrderCancellationModal from '@/components/orders/OrderCancellationModal';

import { ORDER_STATUS } from "@/constants/orderStatus";
import { Order, OrderStatus, OrderItem } from "@/types";
// Get all status values as an array

// Get all status values as an array
const ALL_STATUS_VALUES = Object.values(ORDER_STATUS);

export const STATUS_CONFIG: Record<OrderStatus, {
    color: string;
    label: string;
    icon: React.ReactNode;
    bgColor: string;
    textColor: string;
    actionColor: string;
    actionHoverColor: string;
}> = {
    [ORDER_STATUS.PENDING]: {
        color: 'bg-amber-500',
        label: 'Pending',
        icon: <Clock className="h-3 w-3" />,
        bgColor: 'bg-amber-50 dark:bg-amber-950/20',
        textColor: 'text-amber-700 dark:text-amber-300',
        actionColor: 'bg-amber-600 hover:bg-amber-700',
        actionHoverColor: 'hover:bg-amber-700'
    },
    [ORDER_STATUS.CONFIRMED]: {
        color: 'bg-blue-500',
        label: 'Confirmed',
        icon: <CheckCircle className="h-3 w-3" />,
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        textColor: 'text-blue-700 dark:text-blue-300',
        actionColor: 'bg-blue-600 hover:bg-blue-700',
        actionHoverColor: 'hover:bg-blue-700'
    },
    [ORDER_STATUS.COOKING]: {
        color: 'bg-orange-500',
        label: 'Cooking',
        icon: <ChefHat className="h-3 w-3" />,
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        textColor: 'text-orange-700 dark:text-orange-300',
        actionColor: 'bg-orange-600 hover:bg-orange-700',
        actionHoverColor: 'hover:bg-orange-700'
    },
    [ORDER_STATUS.READY]: {
        color: 'bg-green-500',
        label: 'Ready',
        icon: <Package className="h-3 w-3" />,
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        textColor: 'text-green-700 dark:text-green-300',
        actionColor: 'bg-green-600 hover:bg-green-700',
        actionHoverColor: 'hover:bg-green-700'
    },
    [ORDER_STATUS.IN_SERVICE]: {
        color: 'bg-purple-600',
        label: 'In Service',
        icon: <Utensils className="h-3 w-3" />,
        bgColor: 'bg-purple-50 dark:bg-purple-950/20',
        textColor: 'text-purple-700 dark:text-purple-300',
        actionColor: 'bg-purple-600 hover:bg-purple-700',
        actionHoverColor: 'hover:bg-purple-700'
    },
    [ORDER_STATUS.PAID]: {
        color: 'bg-slate-600',
        label: 'Paid',
        icon: <DollarSign className="h-3 w-3" />,
        bgColor: 'bg-slate-50 dark:bg-slate-950/20',
        textColor: 'text-slate-700 dark:text-slate-300',
        actionColor: 'bg-slate-600 hover:bg-slate-700',
        actionHoverColor: 'hover:bg-slate-700'
    },
    [ORDER_STATUS.CANCELLED]: {
        color: 'bg-red-600',
        label: 'Cancelled',
        icon: <XCircle className="h-3 w-3" />,
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        textColor: 'text-red-700 dark:text-red-300',
        actionColor: 'bg-red-600 hover:bg-red-700',
        actionHoverColor: 'hover:bg-red-700'
    },
};

// Status Flow Configuration
const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.COOKING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.COOKING]: [ORDER_STATUS.READY],
    [ORDER_STATUS.READY]: [ORDER_STATUS.IN_SERVICE],
    [ORDER_STATUS.IN_SERVICE]: [ORDER_STATUS.PAID],
    [ORDER_STATUS.PAID]: [],
    [ORDER_STATUS.CANCELLED]: []
};

const STATUS_ACTION_LABELS: Record<OrderStatus, string> = {
    [ORDER_STATUS.PENDING]: 'Confirm Order',
    [ORDER_STATUS.CONFIRMED]: 'Start Cooking',
    [ORDER_STATUS.COOKING]: 'Mark as Ready',
    [ORDER_STATUS.READY]: 'Serve to Customer',
    [ORDER_STATUS.IN_SERVICE]: 'Settle Bill',
    [ORDER_STATUS.PAID]: 'Already Settled',
    [ORDER_STATUS.CANCELLED]: 'Cancelled'
};



interface StatsCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: number;
    className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend, className }) => (
    <Card className={cn("p-4", className)}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
                {trend !== undefined && (
                    <div className={cn(
                        "flex items-center text-xs mt-1",
                        trend >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                        <ArrowUpRight className={cn(
                            "h-3 w-3 mr-1",
                            trend < 0 && "rotate-90"
                        )} />
                        {Math.abs(trend)}% from yesterday
                    </div>
                )}
            </div>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {icon}
            </div>
        </div>
    </Card>
);



// MultiSelect Status Filter Component
const StatusMultiSelect: React.FC<{
    selectedStatuses: OrderStatus[];
    onStatusChange: (statuses: OrderStatus[]) => void;
}> = ({ selectedStatuses, onStatusChange }) => {
    const [open, setOpen] = useState(false);

    const toggleStatus = (status: OrderStatus) => {
        if (selectedStatuses.includes(status)) {
            onStatusChange(selectedStatuses.filter(s => s !== status));
        } else {
            onStatusChange([...selectedStatuses, status]);
        }
    };

    const selectAll = () => {
        onStatusChange(ALL_STATUS_VALUES);
    };

    const clearAll = () => {
        onStatusChange([]);
    };

    const getDisplayText = () => {
        if (selectedStatuses.length === 0) return "All Statuses";
        if (selectedStatuses.length === 1) return STATUS_CONFIG[selectedStatuses[0]].label;
        if (selectedStatuses.length === ALL_STATUS_VALUES.length) return "All Selected";
        return `${selectedStatuses.length} selected`;
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start">
                    <Filter className="mr-2 h-4 w-4" />
                    <span className="truncate">{getDisplayText()}</span>
                    {selectedStatuses.length > 0 && (
                        <Badge className="ml-2 h-5 px-1.5">
                            {selectedStatuses.length}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Filter by Status</h4>
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={selectAll}
                            >
                                All
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={clearAll}
                            >
                                Clear
                            </Button>
                        </div>
                    </div>

                    <Separator />

                    <ScrollArea className="h-60">
                        <div className="space-y-2 pr-2">
                            {ALL_STATUS_VALUES.map((status) => {
                                const config = STATUS_CONFIG[status];
                                const isSelected = selectedStatuses.includes(status);
                                return (
                                    <div
                                        key={status}
                                        className={cn(
                                            "flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer",
                                            isSelected && "bg-accent"
                                        )}
                                        onClick={() => toggleStatus(status)}
                                    >
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleStatus(status)}
                                        />
                                        <div className={cn("h-2 w-2 rounded-full", config.color)} />
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="text-sm font-medium">{config.label}</span>
                                            {config.icon}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>

                    {selectedStatuses.length > 0 && (
                        <>
                            <Separator />
                            <div className="pt-2">
                                <div className="flex flex-wrap gap-1">
                                    {selectedStatuses.map(status => {
                                        const config = STATUS_CONFIG[status];
                                        return (
                                            <Badge
                                                key={status}
                                                variant="secondary"
                                                className="text-xs flex items-center gap-1"
                                                onClick={() => toggleStatus(status)}
                                            >
                                                {config.label}
                                                <X className="h-3 w-3 ml-1 cursor-pointer" />
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

const AdminLiveDashboard = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [receiptSettings, setReceiptSettings] = useState<any>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
    const [date, setDate] = useState<Date>(new Date());
    const [notificationsMuted, setNotificationsMuted] = useState(false);
    const [cancelModal, setCancelModal] = useState<{ open: boolean; order: Order | null }>({
        open: false,
        order: null
    });
    const [cancelNote, setCancelNote] = useState('');

    // Calculate statistics
    const stats = useMemo(() => {
        const total = orders.length;
        const pending = orders.filter(o => o.status === ORDER_STATUS.PENDING).length;
        const cooking = orders.filter(o => o.status === ORDER_STATUS.COOKING).length;
        const ready = orders.filter(o => o.status === ORDER_STATUS.READY).length;
        const todayOrders = orders.filter(o => isToday(new Date(o.created_at)));

        const avgWaitTime = orders.length > 0
            ? Math.round(orders.reduce((acc, order) => {
                const waitTime = differenceInMinutes(new Date(), new Date(order.created_at));
                return acc + waitTime;
            }, 0) / orders.length)
            : 0;

        return { total, pending, cooking, ready, todayOrders: todayOrders.length, avgWaitTime };
    }, [orders]);

    // Fetch receipt settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/settings/receipt');
                setReceiptSettings(res.data.settings);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Settings Error",
                    description: "Failed to load receipt settings"
                });
            }
        };
        fetchSettings();
    }, [toast]);

    // Set up real-time clock
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const [now, setNow] = useState(new Date());

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        onAfterPrint: () => {
            setSelectedOrder(null);
            toast({
                title: "Print Successful",
                description: "Receipt has been sent to printer."
            });
        },
        onPrintError: () => {
            toast({
                variant: "destructive",
                title: "Print Failed",
                description: "Failed to print receipt. Please check printer connection."
            });
        }
    });

    const triggerPrint = useCallback((order: Order) => {
        if (!receiptSettings) {
            toast({
                variant: "destructive",
                title: "Print Failed",
                description: "Receipt settings not loaded. Please refresh."
            });
            return;
        }
        setSelectedOrder(order);
        setTimeout(() => {
            handlePrint();
        }, 150);
    }, [handlePrint, receiptSettings, toast]);

    // Fetch orders
    const fetchLiveOrders = useCallback(async () => {
        setRefreshing(true);
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const res = await api.get(`/admin/orders/live?date=${formattedDate}`);

            setOrders(Array.isArray(res.data.orders) ? res.data.orders : []);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Load Failed",
                description: "Failed to load orders. Please try again."
            });
            setOrders([]);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    }, [date, toast]);



    useEffect(() => {
        fetchLiveOrders();

        if (window.Echo && user?.branch_id) {
            const channel = `branch.${user.branch_id}`;

            window.Echo.channel(channel)
                .listen('.order.created', (data: { order: Order }) => {
                    const orderDate = format(new Date(data.order.created_at), 'yyyy-MM-dd');
                    const selectedDate = format(date, 'yyyy-MM-dd');

                    if (orderDate === selectedDate) {
                        setOrders(prev => {
                            if (prev.some(o => o.id === data.order.id)) return prev;
                            return [data.order, ...prev];
                        });

                        if (!notificationsMuted) {
                            const audio = new Audio('/assets/sounds/notification.mp3');
                            audio.volume = 0.3;
                            audio.play().catch(() => { });
                        }

                        toast({
                            title: "New Order Received",
                            description: `Order # ${data.order.order_code} ${getOrderDisplayLabel(data.order)}`,
                            duration: 3000,
                        });
                    }
                })
                .listen('.order.updated', (data: { order: Order }) => {
                    setOrders(prev =>
                        prev.map(o =>
                            o.id === data.order.id
                                ? data.order
                                : o
                        )
                    );
                });
            return () => window.Echo.leave(channel);
        }
    }, [user?.branch_id, date, notificationsMuted, toast]);

    const handleUpdateStatus = useCallback(async (id: number, newStatus: OrderStatus, note?: string) => {
        setUpdatingId(id);
        try {
            await api.patch(`/admin/orders/${id}/status`, {
                status: newStatus,
                note: note?.trim() || undefined
            });

            // Find current order data before update
            const currentOrder = orders.find(o => o.id === id);

            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));

            toast({
                title: "Status Updated",
                description: `Order is now ${STATUS_CONFIG[newStatus].label}`,
            });

            if (newStatus === ORDER_STATUS.CANCELLED) {
                setCancelModal({ open: false, order: null });
                setCancelNote('');
            }

            // Auto-print receipt when marking as PAID
            if (newStatus === ORDER_STATUS.PAID && currentOrder) {
                // Pass order with new status to printer
                triggerPrint({ ...currentOrder, status: newStatus });
            }

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.response?.data?.message || "Failed to update order status"
            });
        } finally {
            setUpdatingId(null);
        }
    }, [orders, toast, triggerPrint]);



    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const matchesSearch = o.id.toString().includes(searchTerm) ||
                (o.restaurant_table?.table_number || '').includes(searchTerm) ||
                o.items.some(item =>
                    item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                );

            // Multi-select filter logic
            const matchesStatus = selectedStatuses.length === 0 ||
                selectedStatuses.includes(o.status);

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, selectedStatuses]);

    const getNextStatus = useCallback((currentStatus: OrderStatus): OrderStatus | null => {
        const nextStatuses = STATUS_FLOW[currentStatus];
        return nextStatuses.length > 0 ? nextStatuses[0] : null;
    }, []);

    const getActionButton = useCallback((order: Order) => {
        const nextStatus = getNextStatus(order.status);
        if (!nextStatus) return null;

        const config = STATUS_CONFIG[nextStatus];
        const actionLabel = STATUS_ACTION_LABELS[order.status];

        // Special case for confirmed -> cooking button
        const buttonClass = order.status === ORDER_STATUS.CONFIRMED
            ? "bg-orange-600 hover:bg-orange-700"
            : config.actionColor;

        return (
            <Button
                size="sm"
                className={cn(
                    "font-bold transition-all duration-200 hover:scale-[1.02]",
                    buttonClass
                )}
                onClick={() => handleUpdateStatus(order.id, nextStatus)}
                disabled={updatingId === order.id}
            >
                {updatingId === order.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    actionLabel
                )}
            </Button>
        );
    }, [getNextStatus, handleUpdateStatus, updatingId]);

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <ChefHat className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Live Orders Dashboard</h1>
                                <p className="text-sm text-muted-foreground">
                                    {user?.branch?.branch_name} • {format(date, 'EEEE, MMMM d, yyyy')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setNotificationsMuted(!notificationsMuted)}
                                >
                                    {notificationsMuted ? (
                                        <BellOff className="h-4 w-4" />
                                    ) : (
                                        <Bell className="h-4 w-4" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {notificationsMuted ? "Enable notifications" : "Disable notifications"}
                            </TooltipContent>
                        </Tooltip>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchLiveOrders}
                            disabled={refreshing}
                        >
                            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title="Total Orders"
                        value={stats.total}
                        icon={<ChefHat className="h-5 w-5" />}
                    />
                    <StatsCard
                        title="Pending"
                        value={stats.pending}
                        icon={<Clock className="h-5 w-5" />}
                        className={stats.pending > 0 ? "border-amber-200 dark:border-amber-800" : ""}
                    />
                    <StatsCard
                        title="Cooking"
                        value={stats.cooking}
                        icon={<ChefHat className="h-5 w-5" />}
                    />
                    <StatsCard
                        title="Ready to Serve"
                        value={stats.ready}
                        icon={<Package className="h-5 w-5" />}
                        className={stats.ready > 0 ? "border-green-200 dark:border-green-800" : ""}
                    />
                </div>

                {/* Controls Bar */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                            <div className="relative flex-1 lg:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search by order ID, table, or item..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[200px] justify-start">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(date, "PPP")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="end">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={(d) => d && setDate(d)}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                {/* Multi-Select Status Filter */}
                                <StatusMultiSelect
                                    selectedStatuses={selectedStatuses}
                                    onStatusChange={setSelectedStatuses}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Tabs (Quick Single-Select) */}
                <Tabs
                    value={selectedStatuses.length === 1 ? selectedStatuses[0] : 'all'}
                    onValueChange={(value) => {
                        if (value === 'all') {
                            setSelectedStatuses([]);
                        } else {
                            setSelectedStatuses([value as OrderStatus]);
                        }
                    }}
                >
                    <TabsList className="grid grid-cols-8 h-auto p-1 border rounded-lg">
                        <TabsTrigger value="all" className="rounded-md px-4 py-2">
                            All
                        </TabsTrigger>
                        {ALL_STATUS_VALUES.map((status) => {
                            const config = STATUS_CONFIG[status];
                            return (
                                <TabsTrigger
                                    key={status}
                                    value={status}
                                    className="rounded-md px-4 py-2"
                                >
                                    <div className="flex items-center gap-2">
                                        {config.icon}
                                        <span className="hidden sm:inline">{config.label}</span>
                                    </div>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </Tabs>

                {/* Active Filters Display */}
                {(selectedStatuses.length > 0) && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        <div className="flex flex-wrap gap-2">
                            {selectedStatuses.map(status => {
                                const config = STATUS_CONFIG[status];
                                return (
                                    <Badge
                                        key={status}
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                    >
                                        <div className={cn("h-2 w-2 rounded-full", config.color)} />
                                        {config.label}
                                        <X
                                            className="h-3 w-3 ml-1 cursor-pointer"
                                            onClick={() => {
                                                setSelectedStatuses(prev =>
                                                    prev.filter(s => s !== status)
                                                );
                                            }}
                                        />
                                    </Badge>
                                );
                            })}
                            {selectedStatuses.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => setSelectedStatuses([])}
                                >
                                    Clear all
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Orders Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <CardHeader className="pb-3">
                                    <Skeleton className="h-4 w-32" />
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <ChefHat className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                            <p className="text-sm text-muted-foreground text-center max-w-sm">
                                {searchTerm || selectedStatuses.length > 0
                                    ? "No orders match your filter criteria."
                                    : `No orders for ${format(date, 'MMMM d, yyyy')}.`}
                            </p>
                            {(searchTerm || selectedStatuses.length > 0) && (
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedStatuses([]);
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredOrders.map((order) => {
                                const config = STATUS_CONFIG[order.status];
                                const waitTime = differenceInMinutes(now, new Date(order.created_at));
                                const nextAction = getActionButton(order);

                                return (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Card className={cn(
                                            "overflow-hidden border-2 transition-all duration-200 hover:shadow-md",
                                            config.bgColor,
                                            config.textColor
                                        )}>
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge className={cn(
                                                                "font-semibold text-xs",
                                                                config.color,
                                                                "text-white"
                                                            )}>
                                                                {config.label}
                                                            </Badge>
                                                            {![ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED].includes(order.status) && (
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                            <Timer size={12} />
                                                                            {waitTime}m
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Order placed at {format(new Date(order.created_at), 'HH:mm')}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            )}
                                                        </div>
                                                        <CardTitle className="text-lg font-bold">
                                                            {getOrderDisplayLabel(order)}
                                                        </CardTitle>
                                                        <div className="flex items-center gap-2">
                                                            <OrderTypeBadge order={order} />
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => triggerPrint(order)}>
                                                                <Printer className="h-4 w-4 mr-2" />
                                                                Print Receipt
                                                            </DropdownMenuItem>
                                                            {order.status !== ORDER_STATUS.CANCELLED &&
                                                                order.status !== ORDER_STATUS.PAID && (
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => setCancelModal({ open: true, order })}
                                                                    >
                                                                        <XCircle className="h-4 w-4 mr-2" />
                                                                        Cancel Order
                                                                    </DropdownMenuItem>
                                                                )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </CardHeader>

                                            <CardContent className="space-y-4">
                                                {/* Order Items with Scroll Area */}
                                                <ScrollArea className="max-h-60 pr-2">
                                                    <div className="space-y-3">
                                                        {order.items.map((item, i) => {
                                                            const { size, adds, presets, note } = parseItemRemark(item.remark);

                                                            return (
                                                                <div key={i} className="pb-3 border-b last:border-0">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div className="flex gap-2 items-center">
                                                                            <span className="flex items-center justify-center h-6 w-6 rounded bg-primary text-white dark:text-slate-900 text-xs font-bold">
                                                                                {item.quantity}
                                                                            </span>
                                                                            <span className="text-sm font-semibold">
                                                                                {item.product?.name}
                                                                            </span>
                                                                        </div>
                                                                        {size && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                {size}
                                                                            </Badge>
                                                                        )}
                                                                    </div>

                                                                    {/* Presets */}
                                                                    {presets.length > 0 && (
                                                                        <div className="mb-2">
                                                                            <div className="flex flex-wrap items-center gap-1 mb-1">
                                                                                {presets.map((preset, idx) => {
                                                                                    const [key, value] = preset.includes('=')
                                                                                        ? preset.split('=')
                                                                                        : [preset, ''];

                                                                                    return (
                                                                                        <Badge
                                                                                            key={idx}
                                                                                            variant="outline"
                                                                                            className="text-xs font-normal bg-slate-50 dark:bg-slate-900"
                                                                                        >
                                                                                            <span className="text-slate-600 dark:text-slate-400">
                                                                                                {key}
                                                                                            </span>
                                                                                            {value && (
                                                                                                <span className="text-slate-800 dark:text-slate-300">
                                                                                                    : {value}
                                                                                                </span>
                                                                                            )}
                                                                                        </Badge>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Adds */}
                                                                    {adds.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mb-2">
                                                                            {adds.map((add, idx) => (
                                                                                <Badge
                                                                                    key={idx}
                                                                                    variant="secondary"
                                                                                    className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                                                                                >
                                                                                    + {add}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {note && (
                                                                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 rounded text-sm border border-red-100 dark:border-red-900">
                                                                            <span className="font-semibold">Note: </span>{note}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </ScrollArea>

                                                {/* Cancellation Note */}
                                                {order.status === ORDER_STATUS.CANCELLED && (
                                                    <div className="mt-2">
                                                        {(() => {
                                                            const cancelHistory = order.histories?.find(h => h.to_status === ORDER_STATUS.CANCELLED);
                                                            return cancelHistory ? (
                                                                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                                                                    <div className="flex items-center gap-2 mb-1 text-red-800 dark:text-red-300 font-semibold text-sm">
                                                                        <AlertCircle className="h-4 w-4" />
                                                                        Cancelled by {cancelHistory.user?.name || 'System'}
                                                                    </div>
                                                                    <p className="text-sm text-red-700 dark:text-red-400">
                                                                        {cancelHistory.note || 'No reason provided'}
                                                                    </p>
                                                                    <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                                                                        {format(new Date(cancelHistory.created_at), 'MMM d, h:mm a')}
                                                                    </p>
                                                                </div>
                                                            ) : null;
                                                        })()}
                                                    </div>
                                                )}

                                                <Separator />

                                                {/* Actions */}
                                                <div className="flex items-center justify-between pt-2">
                                                    <div>
                                                        <div className="text-sm font-medium text-muted-foreground">Total</div>
                                                        <div className="text-xl font-bold">${order.total}</div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {order.status === ORDER_STATUS.PAID && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="hover:scale-[1.02] transition-all"
                                                                onClick={() => triggerPrint(order)}
                                                            >
                                                                <Printer className="h-4 w-4 mr-2" />
                                                                Print Receipt
                                                            </Button>
                                                        )}
                                                        {nextAction}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* Cancel Order Modal */}
                <OrderCancellationModal
                    open={cancelModal.open}
                    onOpenChange={(open) => !open && setCancelModal({ open: false, order: null })}
                    orderId={cancelModal.order?.id || null}
                    requiresNote={user?.branch?.requires_cancel_note === 1}
                    onConfirm={(note) => {
                        if (cancelModal.order) {
                            handleUpdateStatus(
                                cancelModal.order.id,
                                ORDER_STATUS.CANCELLED,
                                note
                            );
                        }
                    }}
                />

                {/* Hidden Print Component */}
                <div className="hidden">
                    {selectedOrder && receiptSettings && (
                        <div ref={printRef}>
                            <ThermalReceipt
                                order={selectedOrder}
                                settings={receiptSettings}
                                branch={user?.branch}
                            />
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
};

export default AdminLiveDashboard;