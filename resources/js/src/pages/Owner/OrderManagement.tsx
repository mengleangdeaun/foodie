import { useEffect, useState, useCallback } from 'react';
import api from '@/util/api';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
    Clock, History, Filter, User as UserIcon, Loader2, 
    Hash, ChevronLeft, ChevronRight, MessageSquare, 
    MoreHorizontal, RefreshCw, Truck, Utensils, 
    LayoutGrid, ListFilter, DollarSign, Package, 
    CheckCircle2, Eye, Receipt, Info, MapPin
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ORDER_STATUS, STATUS_CONFIG } from '@/constants/orderStatus';
import { useAuth } from '@/context/AuthContext';
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import DateTimeRangePicker, { DateTimeRange } from "@/components/ui/date-time-range-picker";
import { cn } from "@/lib/utils";

const OrderManagement = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // --- DATA STATES ---
    const [orders, setOrders] = useState<any[]>([]);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    
    // Pagination & Limit States
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [perPage, setPerPage] = useState('12');

    const [statusFilter, setStatusFilter] = useState('all');
    const [staffFilter, setStaffFilter] = useState('all');

    // CRITICAL: Match the keys used in BranchDashboard (startDate/endDate)
    const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange | undefined>({
        startDate: startOfDay(subDays(new Date(), 7)),
        endDate: endOfDay(new Date()),
        useTimeRange: false,
    });

    const fetchHistory = useCallback(async (pageNumber = 1) => {
        if (!dateTimeRange?.startDate || !dateTimeRange?.endDate) return;

        setLoading(true);
        try {
            const params: any = {
                page: pageNumber,
                per_page: perPage,
                status: statusFilter,
                staff_id: staffFilter,
                start_date: format(dateTimeRange.startDate, "yyyy-MM-dd"),
                end_date: format(dateTimeRange.endDate, "yyyy-MM-dd"),
            };

            // Support Carbon combination logic
            if (dateTimeRange.useTimeRange && dateTimeRange.startTime && dateTimeRange.endTime) {
                params.start_time = dateTimeRange.startTime;
                params.end_time = dateTimeRange.endTime;
            }

            const res = await api.get('/admin/orders/history', { params });
            const pagination = res.data.orders;
            setOrders(pagination.data || []);
            setLastPage(pagination.last_page || 1);
            setCurrentPage(pagination.current_page || 1);
            setStaffList(res.data.staff_list || []);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: "Audit fetch failed." });
        } finally { setLoading(false); }
    }, [statusFilter, staffFilter, dateTimeRange, perPage]);

    useEffect(() => { fetchHistory(1); }, [fetchHistory]);

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
            toast({ title: "Updated", description: `Order #${id} changed to ${newStatus}` });
            fetchHistory(currentPage);
        } catch (error: any) { toast({ variant: "destructive", title: "Update Failed" }); }
    };

    return (
        <div className="p-4 md:p-8 space-y-6 bg-background min-h-screen text-foreground transition-all duration-300">
            {/* TOP BAR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="text-left">
                    <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <History className="text-primary h-8 w-8" /> Audit Log
                    </h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{user?.branch?.branch_name} • History</p>
                </div>
                
                <div className="flex items-center gap-2 bg-card p-1 rounded-full border">
                    <Select value={perPage} onValueChange={(v) => { setPerPage(v); setCurrentPage(1); }}>
                        <SelectTrigger className="w-24 h-8 text-[10px] font-black uppercase border-none focus:ring-0">
                            <SelectValue placeholder="Show" />
                        </SelectTrigger>
                        <SelectContent>
                            {['12', '24', '48', '96'].map(v => <SelectItem key={v} value={v} className="text-[10px] font-black">{v} PER PAGE</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* FILTER BAR */}
            <div className="flex flex-wrap items-center gap-4 bg-card/50 backdrop-blur-md p-4 rounded-2xl border shadow-sm">
                <div className="flex-1 min-w-[280px]">
                    <DateTimeRangePicker value={dateTimeRange} onChange={setDateTimeRange} label="Audit period" className="h-10 text-xs" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40 h-10 font-bold uppercase text-xs border-muted-foreground/10 bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ALL STATUS</SelectItem>
                        {Object.values(ORDER_STATUS).map(s => <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={staffFilter} onValueChange={setStaffFilter}>
                    <SelectTrigger className="w-40 h-10 font-bold uppercase text-xs border-muted-foreground/10 bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">ANY STAFF</SelectItem>
                        {staffList.map((s: any) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button onClick={() => fetchHistory(1)} disabled={loading} className="px-6 font-black uppercase italic tracking-widest h-10 shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4 mr-2" />} Sync
                </Button>
            </div>

            {/* AUDIT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {orders.map(order => (
                    <Card key={order.id} className="border shadow-sm hover:shadow-xl transition-all duration-300 bg-card group flex flex-col overflow-hidden">
                        <div className={cn("h-1 w-full", STATUS_CONFIG[order.status]?.color || "bg-slate-500")} />
                        
                        <CardHeader className="p-4 flex flex-row items-center justify-between bg-muted/20">
                            <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2">
                                {order.order_type === 'walk_in' ? <Utensils size={12} className="text-primary" /> : <Truck size={12} className="text-amber-500" />}
                                {/* Robust property access */}
                                {order.order_type === 'walk_in' 
                                    ? (order.restaurant_table?.table_number || order.restaurantTable?.table_number || 'POS') 
                                    : (order.delivery_partner?.name || order.deliveryPartner?.name || 'Delivery')}
                            </CardTitle>
                            <Badge className={cn("text-[8px] font-black uppercase italic border-none text-white", STATUS_CONFIG[order.status]?.color)}>
                                {STATUS_CONFIG[order.status]?.label}
                            </Badge>
                        </CardHeader>

                        <CardContent className="p-5 space-y-4 flex-1 flex flex-col text-left">
                            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground border-b pb-3 dark:border-slate-800">
                                <span className="flex items-center gap-1"><Clock size={10} /> {format(new Date(order.created_at), "MMM dd, HH:mm")}</span>
                                <span className="flex items-center gap-1"><UserIcon size={10} /> {order.creator?.name || 'System'}</span>
                            </div>

                            {/* ITEM SUMMARY PREVIEW */}
                            <div className="space-y-1.5 min-h-[50px]">
                                {order.items?.slice(0, 2).map((item: any) => (
                                    <p key={item.id} className="text-[11px] font-bold truncate text-foreground/80">
                                        <span className="text-primary mr-1">{item.quantity}x</span> {item.product?.name}
                                    </p>
                                ))}
                                {order.items?.length > 2 && (
                                    <p className="text-[9px] font-bold text-muted-foreground">+{order.items.length - 2} more items...</p>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t dark:border-slate-800 mt-auto">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Total Bill</span>
                                    <span className="text-xl font-black italic tracking-tighter text-foreground">${order.total}</span>
                                </div>
                                
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 w-8 p-0 rounded-full border-muted-foreground/20"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        <Eye size={14} className="text-primary" />
                                    </Button>
                                    
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full border-muted-foreground/20">
                                                <RefreshCw size={14} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40">
                                            {Object.values(ORDER_STATUS).map(s => (
                                                <DropdownMenuItem key={s} onClick={() => handleUpdateStatus(order.id, s)} className="text-[10px] font-black uppercase italic">{s}</DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* --- ORDER DETAIL MODAL --- */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card">
                    <DialogHeader className="border-b pb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                                    Order #{selectedOrder?.id} Details
                                </DialogTitle>
                                <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                                    Processed at {selectedOrder && format(new Date(selectedOrder.created_at), "MMMM dd, yyyy HH:mm:ss")}
                                </DialogDescription>
                            </div>
                            <Badge className={cn("text-[10px] font-black uppercase italic border-none text-white h-6", selectedOrder && STATUS_CONFIG[selectedOrder.status]?.color)}>
                                {selectedOrder && STATUS_CONFIG[selectedOrder.status]?.label}
                            </Badge>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                        {/* ITEM LIST */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                <Receipt size={12} /> Ordered Items
                            </h4>
                            <div className="space-y-3">
                                {selectedOrder?.items?.map((item: any) => (
                                    <div key={item.id} className="bg-muted/30 p-3 rounded-xl border border-muted/50 flex justify-between items-center group">
                                        <div className="text-left">
                                            <p className="text-sm font-black text-foreground">
                                                <span className="text-primary mr-2">{item.quantity}x</span>
                                                {item.product?.name}
                                            </p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">Unit Price: ${item.price}</p>
                                        </div>
                                        <p className="text-sm font-black italic tracking-tighter">${item.total}</p>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4 mt-4 border-t-2 border-dashed border-muted space-y-2">
                                <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                                    <span>Subtotal</span>
                                    <span>${selectedOrder?.total}</span>
                                </div>
                                <div className="flex justify-between text-lg font-black italic text-foreground uppercase pt-2">
                                    <span>Grand Total</span>
                                    <span className="text-primary">${selectedOrder?.total}</span>
                                </div>
                            </div>
                        </div>

                        {/* AUDIT & CONTEXT */}
                        <div className="space-y-6 border-l pl-6 dark:border-slate-800">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                    <Info size={12} /> Order Context
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted/30 p-3 rounded-xl">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase">Service Type</p>
                                        <p className="text-[11px] font-black uppercase italic mt-1">{selectedOrder?.order_type}</p>
                                    </div>
                                    <div className="bg-muted/30 p-3 rounded-xl">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase">Location/Partner</p>
                                        <p className="text-[11px] font-black uppercase italic mt-1">
                                            {selectedOrder?.restaurant_table?.table_number || selectedOrder?.delivery_partner?.name || 'Walk-in'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                                    <History size={12} /> Status Timeline
                                </h4>
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-muted">
                                    {selectedOrder?.histories?.map((h: any) => (
                                        <div key={h.id} className="relative flex items-start gap-4 ml-6">
                                            <div className="absolute -left-6 mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-muted shadow-sm" />
                                            <div className="flex-1 text-left">
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] font-black uppercase italic leading-none">{h.to_status}</p>
                                                    <p className="text-[9px] text-muted-foreground font-mono">{format(new Date(h.created_at), "HH:mm")}</p>
                                                </div>
                                                <p className="text-[9px] text-muted-foreground font-bold mt-1">Verified by {h.user?.name}</p>
                                                {h.note && <p className="text-[9px] italic text-muted-foreground mt-1 bg-muted/50 p-1.5 rounded-md">"{h.note}"</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* PAGINATION */}
            <div className="flex items-center justify-between bg-card p-6 rounded-3xl border shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Page {currentPage} of {lastPage}</p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-9 px-6 text-[10px] font-black uppercase italic rounded-xl bg-background"><ChevronLeft size={16} /></Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, lastPage))} disabled={currentPage === lastPage} className="h-9 px-6 text-[10px] font-black uppercase italic rounded-xl bg-background"><ChevronRight size={16} /></Button>
                </div>
            </div>
        </div>
    );
};

export default OrderManagement;