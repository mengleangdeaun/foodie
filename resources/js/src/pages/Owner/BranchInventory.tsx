import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/util/api';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import ProductReorderModal from "./components/ProductReorderModal";
import { 
    Package, CheckCircle2, XCircle, Search, 
    Tag, Percent, ChevronLeft, ChevronRight, Loader2,
    RefreshCw, Layers, Trophy, Star, Flame, Maximize2, Store, ListOrdered,
    Filter, DollarSign, Eye, EyeOff, AlertCircle, BarChart3, Ruler
} from "lucide-react";

interface InventoryItem {
    id: number;
    name: string;
    category_id: number;
    category_name: string;
    base_price: string | number;
    tags: any[];
    sizes: any[];
    pivot: {
        branch_price: string | number | null;
        is_available: boolean;
        discount_percentage: string | number;
        has_active_discount: boolean;
        is_popular: boolean;
        is_signature: boolean;
        is_chef_recommendation: boolean;
    };
}

const BranchInventory = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [branches, setBranches] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [reorderModalOpen, setReorderModalOpen] = useState(false);
    const [selectedBranchName, setSelectedBranchName] = useState<string>('');
    const [sizeManagementLoading, setSizeManagementLoading] = useState<{[key: number]: boolean}>({});

    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [onlyDiscounted, setOnlyDiscounted] = useState(false);
    const [onlyUnavailable, setOnlyUnavailable] = useState(false);
    const [onlyMultiSize, setOnlyMultiSize] = useState(false);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        Promise.all([
            api.get('/admin/branches'),
            api.get('/admin/show_categories')
        ]).then(([branchRes, catRes]) => {
            setBranches(branchRes.data);
            setCategories(catRes.data);
            if (branchRes.data.length > 0) {
                const firstBranch = branchRes.data[0];
                setSelectedBranch(firstBranch.id.toString());
                setSelectedBranchName(firstBranch.branch_name);
            }
        });
    }, []);

    useEffect(() => {
        if (selectedBranch) {
            fetchInventory();
            setCurrentPage(1);
            setSelectedItems([]);
            const branch = branches.find(b => b.id.toString() === selectedBranch);
            if (branch) setSelectedBranchName(branch.branch_name);
        }
    }, [selectedBranch]);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/branches/${selectedBranch}/inventory`);
            setInventory(Array.isArray(res.data) ? res.data : []);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to load inventory",
                description: error.response?.data?.message || "Please try again later."
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSyncAll = async () => {
        if (!selectedBranch) return;
        setSyncing(true);

        try {
            const res = await api.post(`/admin/branches/${selectedBranch}/sync-products`);
            toast({ title: "Sync Complete", description: res.data.message });
            fetchInventory();
        } catch (error) {
            toast({ variant: "destructive", title: "Sync Failed" });
        } finally {
            setSyncing(false);
        }
    };

    const handleUpdatePivot = async (productId: number, updatedFields: Partial<InventoryItem['pivot']>) => {
        if (!selectedBranch) return;
        try {
            await api.put(`/admin/branches/${selectedBranch}/products/${productId}`, updatedFields);
            
            setInventory(prev => prev.map(item => 
                item.id === productId ? { ...item, pivot: { ...item.pivot, ...updatedFields } } : item
            ));
            
            toast({ 
                title: "Success", 
                description: "Product settings have been updated." 
            });
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: "Update Failed", 
                description: error.response?.data?.message || "Please check your network connection."
            });
        }
    };

    const handleBulkUpdate = async (fields: any) => {
        if (!selectedBranch || selectedItems.length === 0) return;
        setBulkLoading(true);
        try {
            await api.post(`/admin/branches/${selectedBranch}/inventory/bulk`, {
                product_ids: selectedItems,
                ...fields
            });
            
            toast({ 
                title: "Bulk Update Successful", 
                description: `Updated ${selectedItems.length} product(s).` 
            });
            
            setSelectedItems([]);
            fetchInventory();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Bulk Update Failed",
                description: error.response?.data?.message || "Please try again."
            });
        } finally {
            setBulkLoading(false);
        }
    };

    const handleManageSizes = async (productId: number) => {
        if (!selectedBranch) return;
        
        setSizeManagementLoading(prev => ({ ...prev, [productId]: true }));
        
        try {
            // First, check if the product has sizes defined
            const product = inventory.find(p => p.id === productId);
            if (!product) {
                toast({
                    variant: "destructive",
                    title: "Product not found",
                    description: "Cannot manage sizes for this product."
                });
                return;
            }

            if (!product.sizes || product.sizes.length === 0) {
                toast({
                    title: "No Sizes Available",
                    description: "This product doesn't have any sizes defined. Add sizes in the master product first.",
                    variant: "default"
                });
                return;
            }

            // Navigate to size management page
            navigate(`/admin/price-size/${selectedBranch}/products/${productId}/sizes`);
            
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Cannot Manage Sizes",
                description: error.response?.data?.message || "An error occurred."
            });
        } finally {
            setSizeManagementLoading(prev => ({ ...prev, [productId]: false }));
        }
    };

    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  item.tags?.some((tag: any) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = categoryFilter === 'all' || item.category_id?.toString() === categoryFilter;
            const matchesPromo = !onlyDiscounted || !!item.pivot?.has_active_discount;
            const matchesAvailability = !onlyUnavailable || !item.pivot?.is_available;
            const matchesMultiSize = !onlyMultiSize || (item.sizes?.length || 0) > 0;
            
            return matchesSearch && matchesCategory && matchesPromo && matchesAvailability && matchesMultiSize;
        });
    }, [inventory, searchQuery, categoryFilter, onlyDiscounted, onlyUnavailable, onlyMultiSize]);

    const paginatedItems = filteredInventory.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(filteredInventory.length / pageSize);

    // Statistics
    const availableCount = inventory.filter(item => item.pivot.is_available).length;
    const popularCount = inventory.filter(item => item.pivot.is_popular).length;
    const discountedCount = inventory.filter(item => item.pivot.has_active_discount).length;
    const multiSizeCount = inventory.filter(item => (item.sizes?.length || 0) > 0).length;

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Store className="h-7 w-7 text-primary" />
                        Branch Inventory
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage product availability, pricing, and promotions for {selectedBranchName || 'selected branch'}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">{inventory.length} Total</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-500">{availableCount} Available</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 rounded-full">
                            <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-500">{popularCount} Popular</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full">
                            <Ruler className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-500">{multiSizeCount} Multi-Size</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative">
                        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-[220px] h-10">
                                <SelectValue placeholder="Select Branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((b: any) => (
                                    <SelectItem key={b.id} value={b.id.toString()}>
                                        {b.branch_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <Button 
                        variant="outline" 
                        onClick={() => setReorderModalOpen(true)} 
                        disabled={!selectedBranch || inventory.length === 0}
                        className="h-10"
                    >
                        <ListOrdered className="mr-2 h-4 w-4" /> 
                        Reorder Menu
                    </Button>
                    
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchInventory()} 
                        disabled={loading || !selectedBranch}
                        className="h-10"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" className='h-10'  onClick={handleSyncAll} disabled={syncing || !selectedBranch}>
                        {syncing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Sync Master Menu
                    </Button>
                </div>
            </div>

            {/* BULK ACTION BAR */}
            {selectedItems.length > 0 && (
                <div className="bg-slate/30 border border-slate/30 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Layers className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground">Bulk Actions</h4>
                            <p className="text-sm text-muted-foreground">
                                {selectedItems.length} product{selectedItems.length !== 1 ? 's' : ''} selected
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleBulkUpdate({ is_available: true })}
                            disabled={bulkLoading}
                        >
                            <CheckCircle2 className="mr-2 h-3 w-3" />
                            Set Available
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleBulkUpdate({ is_popular: true })}
                            disabled={bulkLoading}
                        >
                            <Trophy className="mr-2 h-3 w-3" />
                            Mark Popular
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleBulkUpdate({ is_available: false })}
                            disabled={bulkLoading}
                        >
                            <EyeOff className="mr-2 h-3 w-3" />
                            Set Unavailable
                        </Button>
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setSelectedItems([])}
                            disabled={bulkLoading}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* FILTER BAR */}
            <Card className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                    <div className="lg:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search products or tags..." 
                                className="pl-10 h-10" 
                                value={searchQuery} 
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }} 
                            />
                        </div>
                    </div>
                    
                    <Select value={categoryFilter} onValueChange={(value) => {
                        setCategoryFilter(value);
                        setCurrentPage(1);
                    }}>
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id.toString()}>
                                    {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-4 p-2 rounded-md border bg-muted/20">
                        <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-primary" />
                            <Label htmlFor="on-promo" className="text-sm cursor-pointer">
                                On Discount
                            </Label>
                        </div>
                        <Switch 
                            id="on-promo" 
                            checked={onlyDiscounted} 
                            onCheckedChange={(checked) => {
                                setOnlyDiscounted(checked);
                                setCurrentPage(1);
                            }} 
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 p-2 rounded-md border bg-muted/20">
                        <div className="flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="multi-size" className="text-sm cursor-pointer">
                                Multi-Size Only
                            </Label>
                        </div>
                        <Switch 
                            id="multi-size" 
                            checked={onlyMultiSize} 
                            onCheckedChange={(checked) => {
                                setOnlyMultiSize(checked);
                                setCurrentPage(1);
                            }} 
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 p-2 rounded-md border bg-muted/20">
                        <div className="flex items-center gap-2">
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="unavailable" className="text-sm cursor-pointer">
                                Unavailable Only
                            </Label>
                        </div>
                        <Switch 
                            id="unavailable" 
                            checked={onlyUnavailable} 
                            onCheckedChange={(checked) => {
                                setOnlyUnavailable(checked);
                                setCurrentPage(1);
                            }} 
                        />
                    </div>
                </div>
            </Card>

            {/* INVENTORY TABLE */}
            <Card className="overflow-hidden border p-4">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <Checkbox 
                                        checked={selectedItems.length === paginatedItems.length && paginatedItems.length > 0}
                                        onCheckedChange={() => {
                                            if (selectedItems.length === paginatedItems.length) {
                                                setSelectedItems([]);
                                            } else {
                                                setSelectedItems(paginatedItems.map(i => i.id));
                                            }
                                        }}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead className="font-semibold">Product</TableHead>
                                <TableHead className="font-semibold">Category</TableHead>
                                <TableHead className="font-semibold">Sizes</TableHead>
                                <TableHead className="font-semibold text-center">Branch Pricing</TableHead>
                                <TableHead className="font-semibold text-center">Discount</TableHead>
                                <TableHead className="font-semibold text-center">Highlights</TableHead>
                                <TableHead className="font-semibold text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell colSpan={8}>
                                            <div className="flex items-center gap-3 p-4">
                                                <Skeleton className="h-4 w-4 rounded" />
                                                <Skeleton className="h-4 flex-1" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : paginatedItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                            <h3 className="font-semibold text-foreground mb-2">
                                                {searchQuery || categoryFilter !== 'all' || onlyDiscounted || onlyUnavailable || onlyMultiSize
                                                    ? 'No matching products found' 
                                                    : 'No inventory loaded'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-4 max-w-md">
                                                {searchQuery || categoryFilter !== 'all' || onlyDiscounted || onlyUnavailable || onlyMultiSize
                                                    ? 'Try adjusting your search or filter criteria.'
                                                    : 'Select a branch to view its inventory.'}
                                            </p>
                                            {(searchQuery || categoryFilter !== 'all' || onlyDiscounted || onlyUnavailable || onlyMultiSize) && (
                                                <Button 
                                                    variant="outline" 
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        setCategoryFilter('all');
                                                        setOnlyDiscounted(false);
                                                        setOnlyUnavailable(false);
                                                        setOnlyMultiSize(false);
                                                    }}
                                                >
                                                    Clear Filters
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedItems.map((item) => (
                                    <TableRow 
                                        key={item.id} 
                                        className={`${!item.pivot.is_available ? 'bg-muted/10' : ''} transition-colors hover:bg-muted/30`}
                                    >
                                        <TableCell>
                                            <Checkbox 
                                                checked={selectedItems.includes(item.id)} 
                                                onCheckedChange={(checked) => {
                                                    setSelectedItems(prev => 
                                                        checked ? [...prev, item.id] : prev.filter(id => id !== item.id)
                                                    );
                                                }}
                                            />
                                        </TableCell>
                                        
                                        <TableCell>
                                            <div className="space-y-1.5">
                                                <div className="font-medium text-sm">{item.name}</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {item.tags?.slice(0, 2).map((t: any) => (
                                                        <Badge 
                                                            key={t.id} 
                                                            variant="secondary" 
                                                            className="text-[10px] h-5"
                                                        >
                                                            {t.name}
                                                        </Badge>
                                                    ))}
                                                    {item.tags?.length > 2 && (
                                                        <Badge variant="outline" className="text-[10px] h-5">
                                                            +{item.tags.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {item.category_name || 'Uncategorized'}
                                            </Badge>
                                        </TableCell>
                                        
                                        <TableCell>
                                            {item.sizes?.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs">
                                                            {item.sizes.length} size{item.sizes.length !== 1 ? 's' : ''}
                                                        </Badge>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 px-2"
                                                            onClick={() => handleManageSizes(item.id)}
                                                            disabled={sizeManagementLoading[item.id]}
                                                        >
                                                            {sizeManagementLoading[item.id] ? (
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Ruler className="h-3 w-3 mr-1" />
                                                                    Manage
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                        {item.sizes.slice(0, 2).map((s: any) => s.name).join(', ')}
                                                        {item.sizes.length > 2 && ` +${item.sizes.length - 2}`}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No sizes</span>
                                            )}
                                        </TableCell>
                                        
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="flex items-center gap-1">
                                                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                                                    <Input 
                                                        type="number" 
                                                        step="0.01" 
                                                        min="0"
                                                        className="w-28 h-8 text-center text-sm"
                                                        defaultValue={item.pivot?.branch_price || item.base_price}
                                                        onBlur={(e) => handleUpdatePivot(item.id, { 
                                                            branch_price: e.target.value === '' ? null : e.target.value 
                                                        })}
                                                    />
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Base: ${item.base_price}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col items-start gap-2">
                                                <div className="flex items-center gap-2">
                                                    
                                                    <Input 
                                                        type="number" 
                                                        min="0" 
                                                        max="100"
                                                        className="w-28 h-8 text-center text-sm"
                                                        defaultValue={item.pivot?.discount_percentage || 0}
                                                        onBlur={(e) => handleUpdatePivot(item.id, { 
                                                                discount_percentage: e.target.value 
                                                            })}
                                                    />
                                                    <Percent className="h-3 w-3 text-muted-foreground" />
                                                <Switch 
                                                        checked={!!item.pivot?.has_active_discount} 
                                                        onCheckedChange={(val) => handleUpdatePivot(item.id, { 
                                                            has_active_discount: val 
                                                        })} 
                                                    />
                                                </div>
                                                {item.pivot?.has_active_discount && item.pivot?.discount_percentage && (
                                                    <Badge variant="outline" className="text-xs items-start bg-green-500/10 text-green-700 border-green-200">
                                                        Discount Active
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        
                                        <TableCell>
                                            <div className="flex justify-center gap-3">
                                                <button 
                                                    onClick={() => handleUpdatePivot(item.id, { is_popular: !item.pivot?.is_popular })}
                                                    className={`p-1.5 rounded transition-all ${item.pivot?.is_popular 
                                                        ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' 
                                                        : 'text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50'}`}
                                                    title={item.pivot?.is_popular ? "Marked as Popular" : "Mark as Popular"}
                                                >
                                                    <Trophy size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdatePivot(item.id, { is_signature: !item.pivot?.is_signature })}
                                                    className={`p-1.5 rounded transition-all ${item.pivot?.is_signature 
                                                        ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' 
                                                        : 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50'}`}
                                                    title={item.pivot?.is_signature ? "Marked as Signature" : "Mark as Signature"}
                                                >
                                                    <Star size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdatePivot(item.id, { is_chef_recommendation: !item.pivot?.is_chef_recommendation })}
                                                    className={`p-1.5 rounded transition-all ${item.pivot?.is_chef_recommendation 
                                                        ? 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' 
                                                        : 'text-muted-foreground hover:text-orange-600 hover:bg-orange-50'}`}
                                                    title={item.pivot?.is_chef_recommendation ? "Chef's Recommendation" : "Mark as Chef's Recommendation"}
                                                >
                                                    <Flame size={18} />
                                                </button>
                                            </div>
                                        </TableCell>
                                        
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <Switch 
                                                    checked={!!item.pivot?.is_available} 
                                                    onCheckedChange={(val) => handleUpdatePivot(item.id, { 
                                                        is_available: val 
                                                    })} 
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* PAGINATION */}
                {!loading && paginatedItems.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t py-4 px-4 bg-muted/20 gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                                Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                                <span className="font-semibold">
                                    {Math.min(currentPage * pageSize, filteredInventory.length)}
                                </span> of{" "}
                                <span className="font-semibold">{filteredInventory.length}</span> items
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Rows:</span>
                                <Select 
                                    value={pageSize.toString()} 
                                    onValueChange={(v) => { 
                                        setPageSize(parseInt(v)); 
                                        setCurrentPage(1); 
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(p => p - 1)} 
                                disabled={currentPage === 1} 
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }
                                    
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "secondary" : "ghost"}
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setCurrentPage(p => p + 1)} 
                                disabled={currentPage === totalPages || totalPages === 0} 
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* REORDER MODAL */}
            <ProductReorderModal
                open={reorderModalOpen}
                onOpenChange={setReorderModalOpen}
                branchId={selectedBranch}
                items={inventory}
                onSuccess={fetchInventory}
            />
        </div>
    );
};

export default BranchInventory;