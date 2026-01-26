import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/util/api';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import OrderTypeBadge from "./components/OrderTypeBadge";
import { useDebounce } from 'use-debounce'; 
import {
    Clock, User as UserIcon, Loader2,
    ChevronLeft, ChevronRight, RefreshCw, Truck, Utensils,
    LayoutGrid, Package, Eye, Printer,
    Search, Filter as FilterIcon, Download,
    ShoppingBag, MoreVertical, QrCode, Monitor, Filter, X
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { ORDER_STATUS, STATUS_CONFIG } from '@/constants/orderStatus';
import { useAuth } from '@/context/AuthContext';
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import DateTimeRangePicker, { DateTimeRange } from "@/components/ui/date-time-range-picker";
import { cn } from "@/lib/utils";
import ThermalReceipt from '@/components/printing/ThermalReceipt';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";


const OrderManagement = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    // --- DATA STATES ---
    const [orders, setOrders] = useState<any[]>([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [staffList, setStaffList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [receiptSettings, setReceiptSettings] = useState<any>(null);
    const [branchInfo, setBranchInfo] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500); // 500ms delay
    const [selectedTab, setSelectedTab] = useState('all');

    // Pagination & Limit States
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [perPage, setPerPage] = useState('10');

    const [statusFilter, setStatusFilter] = useState('all');
    const [staffFilter, setStaffFilter] = useState('all');

    const [dateTimeRange, setDateTimeRange] = useState<DateTimeRange | undefined>({
        startDate: startOfDay(subDays(new Date(), 7)),
        endDate: endOfDay(new Date()),
        useTimeRange: false,
    });

    // Print functionality
    const printReceiptRef = useRef<HTMLDivElement>(null);
    const [printing, setPrinting] = useState(false);
    const [orderToPrint, setOrderToPrint] = useState<any>(null);
    const [printData, setPrintData] = useState<any>(null);
    const [printIframe, setPrintIframe] = useState<HTMLIFrameElement | null>(null);

    // Create a hidden iframe for printing
    useEffect(() => {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
        setPrintIframe(iframe);

        return () => {
            if (iframe && document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        };
    }, []);

    // Handle print receipt
    const handlePrintReceipt = async (order: any) => {
        try {
            setPrinting(true);
            setOrderToPrint(order);
            
            // Fetch receipt data
            const response = await api.get(`/admin/orders/${order.id}/print-receipt`);
            const receiptData = {
                order: response.data.order,
                settings: response.data.receipt_settings,
                branch: response.data.branch
            };
            
            // Store print data
            setPrintData(receiptData);
            
            // Trigger print after a small delay to ensure state is updated
            setTimeout(() => {
                if (printReceiptRef.current && printIframe) {
                    printDocument();
                }
            }, 100);
            
        } catch (error: any) {
            console.error('Print error:', error);
            toast({
                variant: "destructive",
                title: "Print Error",
                description: error.response?.data?.message || "Failed to fetch receipt data"
            });
            setPrinting(false);
            setOrderToPrint(null);
        }
    };

    // Function to trigger print dialog
    const printDocument = () => {
        if (!printIframe || !printReceiptRef.current) return;

        try {
            // Get the receipt HTML
            const receiptHtml = printReceiptRef.current.innerHTML;
            
            // Set up iframe content
            printIframe.contentDocument?.open();
            printIframe.contentDocument?.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Receipt - Order #${orderToPrint?.id}</title>
                    <style>
                        @page {
                            size: ${printData?.settings?.paper_width || 80}mm auto;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: ${printData?.settings?.font_family || 'monospace'};
                            background: white;
                        }
                        .receipt-container {
                            width: ${printData?.settings?.paper_width || 80}mm;
                            max-width: ${printData?.settings?.paper_width || 80}mm;
                            margin: 0 auto;
                            padding: ${printData?.settings?.margin_size || 10}px;
                            font-size: ${printData?.settings?.font_size_base || 12}px;
                        }
                        @media print {
                            body * {
                                visibility: hidden;
                            }
                            .receipt-container, .receipt-container * {
                                visibility: visible;
                            }
                            .receipt-container {
                                position: absolute;
                                left: 0;
                                top: 0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        ${receiptHtml}
                    </div>
                    <script>
                        // Auto-print when loaded
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                                setTimeout(function() {
                                    window.parent.postMessage('printComplete', '*');
                                }, 100);
                            }, 200);
                        };
                        
                        // Handle print dialog close
                        window.onafterprint = function() {
                            window.parent.postMessage('printComplete', '*');
                        };
                    </script>
                </body>
                </html>
            `);
            printIframe.contentDocument?.close();
            
            // Listen for print completion
            const handlePrintComplete = (event: MessageEvent) => {
                if (event.data === 'printComplete') {
                    toast({
                        title: "Receipt Printed",
                        description: "Receipt has been sent to printer",
                    });
                    setPrinting(false);
                    setOrderToPrint(null);
                    setPrintData(null);
                    window.removeEventListener('message', handlePrintComplete);
                }
            };
            
            window.addEventListener('message', handlePrintComplete);
            
        } catch (error) {
            console.error('Print setup error:', error);
            toast({
                variant: "destructive",
                title: "Print Error",
                description: "Failed to prepare receipt for printing"
            });
            setPrinting(false);
            setOrderToPrint(null);
        }
    };

    // Quick print from table
    const handleQuickPrint = (order: any) => {
        handlePrintReceipt(order);
    };



    const fetchHistory = useCallback(async (pageNumber = 1) => {
        if (!dateTimeRange?.startDate || !dateTimeRange?.endDate) return;

        setLoading(true);
        try {
            const params: any = {
                page: pageNumber,
                per_page: perPage,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                staff_id: staffFilter !== 'all' ? staffFilter : undefined,
                search: debouncedSearchQuery || undefined,
                start_date: format(dateTimeRange.startDate, "yyyy-MM-dd"),
                end_date: format(dateTimeRange.endDate, "yyyy-MM-dd"),
            };

            if (dateTimeRange.useTimeRange && dateTimeRange.startTime && dateTimeRange.endTime) {
                params.start_time = dateTimeRange.startTime;
                params.end_time = dateTimeRange.endTime;
            }

            const res = await api.get('/admin/orders/history', { params });
            
            if (res.data?.success) {
                const pagination = res.data.orders;
                setOrders(pagination.data || []);
                setTotalOrders(pagination.total || 0);
                setLastPage(pagination.last_page || 1);
                setCurrentPage(pagination.current_page || 1);
            } else {
                setOrders(res.data?.orders?.data || []);
                setTotalOrders(res.data?.orders?.total || 0);
                setLastPage(res.data?.orders?.last_page || 1);
                setCurrentPage(res.data?.orders?.current_page || 1);
            }
            
            setStaffList(res.data.staff_list || []);
            
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to fetch orders"
            });
            setOrders([]);
            setTotalOrders(0);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, staffFilter, dateTimeRange, perPage, debouncedSearchQuery]);

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const fetchReceiptSettings = async () => {
        try {
            const res = await api.get('/admin/settings/receipt');
            setReceiptSettings(res.data.settings);
            setBranchInfo(res.data.branch);
        } catch (error) {
            console.error("Failed to fetch receipt settings");
            // Use default settings
            setReceiptSettings({
                paper_width: 80,
                margin_size: 10,
                font_size_base: 12,
                font_family: 'monospace',
                show_logo: false,
                show_header: true,
                show_order_id: true,
                show_customer_info: true,
                show_qr: false,
                show_footer: true,
                store_name: user?.branch?.branch_name || 'Store Name',
                footer_text: 'Thank you for your purchase!'
            });
            setBranchInfo(user?.branch || {});
        }
    };

    useEffect(() => {
        fetchReceiptSettings();
    }, []);

    useEffect(() => {
        fetchHistory(1);
    }, [statusFilter, staffFilter, dateTimeRange, perPage, debouncedSearchQuery]);

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
            toast({
                title: "Status Updated",
                description: `Order #${id} status changed to ${newStatus}`
            });
            fetchHistory(currentPage);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: error.response?.data?.message || "Failed to update status"
            });
        }
    };


    const getOrderTypeIcon = (type: string) => {
        switch (type) {
            case 'qr_scan': return <QrCode className="h-3 w-3" />;
            case 'walk_in': return <Monitor className="h-3 w-3" />;
            case 'takeaway': return <ShoppingBag className="h-3 w-3" />;
            case 'delivery': return <Truck className="h-3 w-3" />;
            default: return <ShoppingBag className="h-3 w-3" />;
        }
    };

    const getOrderTypeLabel = (type: string) => {
        switch (type) {
            case 'qr_scan': return 'QR Scan';
            case 'walk_in': return 'POS';
            case 'takeaway': return 'Takeaway';
            case 'delivery': return 'Delivery';
            default: return type;
        }
    };

    const getStatusClasses = (status: string): string => {
        const config = STATUS_CONFIG[status];
        if (!config) return '';
        
        return `${config.bg} ${config.border} ${config.text} ${config.darkBg} ${config.darkBorder} ${config.darkText} border-2`;
    };

    const filteredOrders = selectedTab === 'all'
        ? orders
        : orders.filter(order => order.status === selectedTab);

    const startIndex = (currentPage - 1) * parseInt(perPage) + 1;
    const endIndex = Math.min(currentPage * parseInt(perPage), totalOrders);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Order Management
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            Manage and track all orders for {user?.branch?.branch_name}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => fetchHistory(1)}
                            disabled={loading}
                            variant="outline"
                            className="gap-2"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Search and Filters */}
 <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="md:col-span-2">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by order ID, customer, or items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10" // Add right padding for the clear icon
                            onKeyDown={(e) => e.key === 'Enter' && fetchHistory(1)}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
<Button 
    onClick={() => fetchHistory(1)}
    className="whitespace-nowrap"
    disabled={loading} // Disable while loading
>
    {loading ? (
        <div className="flex items-center">
            <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Searching...
        </div>
    ) : (
        <>
            <Search className="h-4 w-4 mr-2" />
            Search
        </>
    )}
</Button>
                </div>
            </div>
            
            <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                        <FilterIcon className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {Object.values(ORDER_STATUS).map(status => (
                            <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${STATUS_CONFIG[status]?.dot || 'bg-slate-400'}`} />
                                    {STATUS_CONFIG[status]?.label || status.charAt(0).toUpperCase() + status.slice(1)}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    

            <Card className="border shadow-sm mb-6">
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
                        
                        </div>
                    </div>
                </CardContent>
            </Card>

                {/* Status Tabs */}
<Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
    <TabsList className="flex w-full md:grid md:grid-cols-8 gap-1 md:gap-2 pb-2">
        <TabsTrigger value="all" className="flex gap-2 min-w-[120px] md:min-w-0">
            <LayoutGrid className="h-4 w-4" />
            All Orders
        </TabsTrigger>
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <TabsTrigger 
                key={status} 
                value={status} 
                className="flex gap-2 min-w-[120px] md:min-w-0 whitespace-nowrap"
            >
                {/* Change config.color to config.dot */}
                <div className={`h-2 w-2 rounded-full ${config.dot}`} />
                {config.label}
            </TabsTrigger>
        ))}
    </TabsList>
</Tabs>
            </div>

            {/* Orders Table */}
            <Card className="border-0 shadow-lg">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Orders</CardTitle>
                            <CardDescription>
                                Showing {filteredOrders.length} of {totalOrders} total orders
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={perPage} onValueChange={(v) => { 
                                setPerPage(v); 
                                setCurrentPage(1);
                                fetchHistory(1);
                            }}>
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Per page" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                    <SelectItem value="100">100 per page</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>#</TableHead>
                                    <TableHead className="w-[100px]">Order ID</TableHead>
                                    <TableHead>Customer/Table</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                                <span>Loading orders...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <Package className="h-12 w-12 text-slate-300" />
                                                <p>No orders found</p>
                                                {searchQuery && (
                                                    <Button
                                                        variant="link"
                                                        onClick={() => {
                                                            setSearchQuery('');
                                                            fetchHistory(1);
                                                        }}
                                                    >
                                                        Clear search
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order, index) => (
                                        <TableRow key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <TableCell className="font-medium">
                                                #{startIndex + index}
                                            </TableCell>
                                            <TableCell className="font-mono font-medium">
                                                {order.order_code || `#${order.id}`}
                                            </TableCell>
                                            <TableCell>
                                                    <OrderTypeBadge order={order} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px]">
                                                    <div className="text-sm line-clamp-2">
                                                        {order.items?.slice(0, 2).map((item: any, i: number) => (
                                                            <span key={i} className="block">
                                                                {item.quantity}x {item.product?.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {order.items?.length > 2 && (
                                                        <span className="text-xs text-slate-500">
                                                            +{order.items.length - 2} more items
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getOrderTypeIcon(order.order_type)}
                                                    <span>{getOrderTypeLabel(order.order_type)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                ${parseFloat(order.total || 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={`${getStatusClasses(order.status)}  font-medium`}>     
                                                            {STATUS_CONFIG[order.status]?.label}
                                                        </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">
                                                        {format(new Date(order.created_at), "MMM dd")}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {format(new Date(order.created_at), "HH:mm")}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {/* Print Button */}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleQuickPrint(order)}
                                                        disabled={printing && orderToPrint?.id === order.id}
                                                        className="h-8 w-8 p-0"
                                                        title="Print Receipt"
                                                    >
                                                        {printing && orderToPrint?.id === order.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Printer className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    
                                                    {/* More Options Dropdown */}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handlePrintReceipt(order)}>
                                                                <Printer className="h-4 w-4 mr-2" />
                                                                Print Receipt
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                                                            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                                                <DropdownMenuItem
                                                                    key={status}
                                                                    onClick={() => handleUpdateStatus(order.id, status)}
                                                                    className={cn(
                                                                        order.status === status && "bg-slate-100 dark:bg-slate-800"
                                                                    )}
                                                                >
                                                                    <div className={`h-2 w-2 rounded-full mr-2 ${config.dot}`} />
                                                                    {config.label}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalOrders > 0 && lastPage > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                        Showing {startIndex} to {endIndex} of {totalOrders} orders
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const newPage = currentPage - 1;
                                setCurrentPage(newPage);
                                fetchHistory(newPage);
                            }}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                                let pageNum;
                                if (lastPage <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= lastPage - 2) {
                                    pageNum = lastPage - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "default" : "outline"}
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                        onClick={() => {
                                            setCurrentPage(pageNum);
                                            fetchHistory(pageNum);
                                        }}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const newPage = currentPage + 1;
                                setCurrentPage(newPage);
                                fetchHistory(newPage);
                            }}
                            disabled={currentPage === lastPage}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Order Details Dialog */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                    {selectedOrder && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                    <div className={`h-3 w-3 rounded-full ${STATUS_CONFIG[selectedOrder.status]?.color || 'bg-slate-500'}`} />
                                    Order #{selectedOrder.id}
                                    <Badge variant="outline">
                                        {getOrderTypeLabel(selectedOrder.order_type)}
                                    </Badge>
                                </DialogTitle>
                                <DialogDescription>
                                    Created on {format(new Date(selectedOrder.created_at), "PPpp")}
                                </DialogDescription>
                            </DialogHeader>

                            <ScrollArea className="max-h-[60vh] pr-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-6">
                                        {/* Order Items */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Order Items</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    {selectedOrder.items?.map((item: any) => (
                                                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                            <div className="flex-1">
                                                                <div className="font-medium">{item.product?.name}</div>
                                                                {item.notes && (
                                                                    <div className="text-sm text-slate-500 mt-1">
                                                                        Note: {item.notes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="text-center">
                                                                    <div className="text-sm text-slate-500">Qty</div>
                                                                    <div className="font-medium">{item.quantity}</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="text-sm text-slate-500">Price</div>
                                                                    <div className="font-medium">${item.product?.price || '0.00'}</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="text-sm text-slate-500">Total</div>
                                                                    <div className="font-medium text-green-600">${item.total}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Order Notes */}
                                        {selectedOrder.notes && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-lg">Order Notes</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-slate-700 dark:text-slate-300">{selectedOrder.notes}</p>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>

                                    {/* Order Summary */}
                                    <div className="space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Order Summary</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Subtotal</span>
                                                        <span>${selectedOrder.subtotal || selectedOrder.total}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-600">Tax</span>
                                                        <span>${selectedOrder.tax || '0.00'}</span>
                                                    </div>
                                                    {selectedOrder.delivery_fee && (
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-600">Delivery Fee</span>
                                                            <span>${selectedOrder.delivery_fee}</span>
                                                        </div>
                                                    )}
                                                    <div className="border-t pt-3 mt-3">
                                                        <div className="flex justify-between font-bold text-lg">
                                                            <span>Total</span>
                                                            <span>${selectedOrder.total}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Customer Info */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Customer Information</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-4 w-4 text-slate-500" />
                                                    <span>{selectedOrder.customer_name || 'Walk-in Customer'}</span>
                                                </div>
                                                {selectedOrder.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-4 w-4 text-slate-500">📱</div>
                                                        <span>{selectedOrder.phone}</span>
                                                    </div>
                                                )}
                                                {selectedOrder.table_number && (
                                                    <div className="flex items-center gap-2">
                                                        <Utensils className="h-4 w-4 text-slate-500" />
                                                        <span>Table {selectedOrder.table_number}</span>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col gap-2">
                                            <Button
                                                onClick={() => handlePrintReceipt(selectedOrder)}
                                                disabled={printing}
                                                className="gap-2"
                                            >
                                                {printing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Printer className="h-4 w-4" />
                                                )}
                                                Print Receipt
                                            </Button>
                                            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                                Close
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Hidden Receipt for Printing */}
            <div 
                ref={printReceiptRef} 
                style={{ 
                    position: 'absolute', 
                    left: -10000, 
                    top: -10000,
                    width: '80mm',
                    backgroundColor: 'white',
                    zIndex: -9999
                }}
            >
                {printData && (
                    <ThermalReceipt
                        settings={printData.settings}
                        order={printData.order}
                        branch={printData.branch}
                    />
                )}
            </div>
        </div>
    );
};

export default OrderManagement;