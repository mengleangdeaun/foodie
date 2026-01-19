import { useEffect, useState, useMemo } from 'react';
import api from '@/util/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
    Plus, Loader2, Utensils, Settings2, LayoutGrid, List, 
    Search, Package, ChevronLeft, ChevronRight, Star, Flame, Trophy,
    Layers, CheckCircle2, XCircle, Tag, Maximize2, Filter,
    Edit3, Eye, EyeOff, DollarSign, Hash
} from "lucide-react";
import ImagePicker from "@/components/ImagePicker";
import { MultiSelect } from "@/components/ui/multi-select";

const OwnerProducts = () => {
    const { toast } = useToast();
    
    // Data States
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [masterTags, setMasterTags] = useState<any[]>([]);
    const [masterSizes, setMasterSizes] = useState<any[]>([]);
    
    // UI & Filter States
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [clearCurrentImage, setClearCurrentImage] = useState(false); // Add this

    const [formData, setFormData] = useState({
        name: '', category_id: '', base_price: '',
        short_description: '', description: '',
        discount_percentage: '0', 
        tag_ids: [] as string[],
        size_ids: [] as string[],
        is_popular: false,
        is_signature: false,
        is_chef_recommendation: false
    });

    useEffect(() => {
        const loadInitialData = async () => {
            setFetching(true);
            await Promise.all([fetchProducts(), fetchCategories(), fetchAttributes()]);
            setFetching(false);
        };
        loadInitialData();
    }, []);

    const fetchAttributes = async () => {
        try {
            const [tags, sizes] = await Promise.all([api.get('/admin/tags'), api.get('/admin/sizes')]);
            setMasterTags(tags.data.map((t:any) => ({ label: t.name, value: t.id.toString() })));
            setMasterSizes(sizes.data.map((s:any) => ({ label: s.name, value: s.id.toString() })));
        } catch (e) { console.error(e); }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/admin/show_categories');
            setCategories(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (e) { setCategories([]); }
    };

    const fetchProducts = async () => {
        try {
            const res = await api.get('/admin/products');
            setProducts(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (e) { setProducts([]); }
    };

    // --- Filter & Pagination Logic ---
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  p.short_description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === "all" || p.category_id?.toString() === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, categoryFilter]);

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        return filteredProducts.slice(start, start + rowsPerPage);
    }, [filteredProducts, currentPage, rowsPerPage]);

    const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);

    const handleEdit = (product: any) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category_id: product.category_id?.toString() || '',
            base_price: product.base_price?.toString() || '',
            short_description: product.short_description || '',
            description: product.description || '',
            discount_percentage: product.discount_percentage?.toString() || '0',
            tag_ids: product.tags?.map((t:any) => t.id.toString()) || [],
            size_ids: product.sizes?.map((s:any) => s.id.toString()) || [],
            is_popular: !!product.is_popular,
            is_signature: !!product.is_signature,
            is_chef_recommendation: !!product.is_chef_recommendation
        });
        setClearCurrentImage(false); // Reset when editing new product
        setOpen(true);
    };

       const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const data = new FormData();
        data.append('name', formData.name);
        data.append('category_id', formData.category_id);
        data.append('base_price', formData.base_price);
        data.append('short_description', formData.short_description);
        data.append('description', formData.description || '');
        data.append('is_popular', formData.is_popular ? '1' : '0');
        data.append('is_signature', formData.is_signature ? '1' : '0');
        data.append('is_chef_recommendation', formData.is_chef_recommendation ? '1' : '0');
        formData.tag_ids.forEach(id => data.append('tag_ids[]', id));
        formData.size_ids.forEach(id => data.append('size_ids[]', id));
        
        // If clearCurrentImage is true, append a flag to remove the image
    if (clearCurrentImage && editingProduct) {
        // Send flag to remove existing image
        data.append('remove_image', 'true'); // Changed from '1' to 'true'
    } else if (selectedFile) {
        // Upload new image
        data.append('image', selectedFile);
    }

        try {
            if (editingProduct) {
                data.append('_method', 'PUT');
                await api.post(`/admin/products/${editingProduct.id}`, data);
            } else {
                await api.post('/admin/products', data);
            }
            setOpen(false);
            setEditingProduct(null);
            setSelectedFile(null);
            setClearCurrentImage(false); // Reset after successful save
            fetchProducts();
            toast({ 
                title: editingProduct ? "Product Updated" : "Product Created",
                description: editingProduct ? `${formData.name} has been updated.` : `${formData.name} has been added to the catalog.`
            });
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: "Operation Failed", 
                description: error.response?.data?.message || "Please check your network connection and try again."
            });
        } finally { 
            setLoading(false); 
        }
    };

    const toggleActive = async (id: number, currentValue: boolean) => {
        const newValue = !currentValue;
        setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: newValue } : p));
        try {
            await api.patch(`/admin/products/${id}`, { is_active: newValue });
            toast({
                title: newValue ? "Product Activated" : "Product Deactivated",
                description: newValue ? "Product is now visible to customers." : "Product is now hidden from customers."
            });
        } catch (error) {
            setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: currentValue } : p));
            toast({
                variant: "destructive",
                title: "Failed to Update Status",
                description: "Please try again or check your network connection."
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* 1. HEADER WITH STATUS COUNTERS */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Menu Catalog</h2>
                    <p className="text-sm text-muted-foreground">Manage your restaurant's menu items, pricing, and availability</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">{products.length} Total</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-500">{products.filter(p=>p.is_active).length} Active</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium text-muted-foreground">{products.filter(p=>!p.is_active).length} Hidden</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search products, descriptions..." 
                            className="pl-9 h-10 bg-background border-input" 
                            value={searchTerm} 
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
                            <SelectTrigger className="w-[180px] h-10 pl-9 border-input"><SelectValue placeholder="Category" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((c:any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex bg-slate/50 p-1 rounded-lg border">
                        <Button 
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                            size="icon" 
                            className="h-8 w-8 rounded-md" 
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid size={16} />
                        </Button>
                        <Button 
                            variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                            size="icon" 
                            className="h-8 w-8 rounded-md" 
                            onClick={() => setViewMode('table')}
                        >
                            <List size={16} />
                        </Button>
                    </div>
                    <Button 
                        onClick={() => { setEditingProduct(null); setOpen(true); }} 
                        className="h-10 font-semibold px-6 bg-primary hover:bg-primary/90 shadow-sm"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                </div>
            </div>

            {/* 2. MAIN VIEW RENDERER */}
            {fetching ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="animate-spin h-10 w-10 text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">Loading menu data...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                /* EMPTY STATE */
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
                    <Utensils className="h-16 w-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                    <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                        {searchTerm || categoryFilter !== "all" 
                            ? "Try adjusting your search or filter criteria." 
                            : "Get started by adding your first menu item."}
                    </p>
                    <div className="flex gap-3">
                        {(searchTerm || categoryFilter !== "all") && (
                            <Button 
                                variant="outline" 
                                onClick={() => { setSearchTerm(""); setCategoryFilter("all"); }}
                            >
                                Clear Filters
                            </Button>
                        )}
                        <Button 
                            onClick={() => { setEditingProduct(null); setOpen(true); }}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Product
                        </Button>
                    </div>
                </div>
            ) : viewMode === 'grid' ? (
                /* GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {paginatedProducts.map(product => (
                        <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/30">
                            <div className="aspect-square bg-muted relative overflow-hidden">
                                {product.image_path ? (
                                    <img 
                                        src={product.image_path} 
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted">
                                        <Utensils className="h-12 w-12 text-muted-foreground/30" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex flex-col gap-1">
                                    {!!product.is_popular && (
                                        <Badge className="bg-yellow-100 text-yellow-800 border-none hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300">
                                            <Trophy size={10} className="mr-1" /> Popular
                                        </Badge>
                                    )}
                                    {!!product.is_signature && (
                                        <Badge className="bg-blue-100 text-blue-800 border-none hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                                            <Star size={10} className="mr-1" /> Signature
                                        </Badge>
                                    )}
                                    {!!product.is_chef_recommendation && (
                                        <Badge className="bg-orange-100 text-orange-800 border-none hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300">
                                            <Flame size={10} className="mr-1" /> Chef's Pick
                                        </Badge>
                                    )}
                                </div>
                                <div className="absolute bottom-2 left-2">
                                    <Badge className="bg-background/90 backdrop-blur-sm text-foreground font-semibold border">
                                        <DollarSign size={10} className="mr-0.5" />{product.base_price}
                                    </Badge>
                                </div>
                                {!product.is_active && (
                                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
                                        <Badge variant="outline" className="bg-background/80">
                                            <EyeOff size={12} className="mr-1" /> Hidden
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            <CardHeader className="p-4 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                    <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                                        {product.name}
                                    </CardTitle>
                                    <Badge variant="secondary" className="text-xs font-medium">
                                        {product.category?.name || "Uncategorized"}
                                    </Badge>
                                </div>
                                <CardDescription className="text-xs line-clamp-2 min-h-[2.5em]">
                                    {product.short_description || "No description provided."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 space-y-3">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Tag size={12} className="text-muted-foreground flex-shrink-0" />
                                        <div className="flex flex-wrap gap-1">
                                            {product.tags?.length > 0 ? product.tags.map((t:any) => (
                                                <Badge key={t.id} variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                                    {t.name}
                                                </Badge>
                                            )) : (
                                                <span className="text-[10px] text-muted-foreground italic">No tags</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Maximize2 size={12} className="text-muted-foreground flex-shrink-0" />
                                        <div className="flex flex-wrap gap-1">
                                            {product.sizes?.length > 0 ? product.sizes.map((s:any) => (
                                                <Badge key={s.id} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                                    {s.name}
                                                </Badge>
                                            )) : (
                                                <span className="text-[10px] text-muted-foreground italic">No sizes</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-4  border-t flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Switch 
                                        checked={!!product.is_active} 
                                        onCheckedChange={() => toggleActive(product.id, product.is_active)} 
                                    />
                                    <span className="text-xs font-medium">
                                        {product.is_active ? 'Active' : 'Hidden'}
                                    </span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEdit(product)} 
                                    className="h-8 w-8 p-0 rounded-full"
                                >
                                    <Edit3 size={16} />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                /* TABLE VIEW */
                <Card className="rounded-lg overflow-hidden border">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[60px]">Image</TableHead>
                                    <TableHead>Product Info</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Tags & Sizes</TableHead>
                                    <TableHead>Highlights</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedProducts.map(product => (
                                    <TableRow key={product.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="w-10 h-10 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                                                {product.image_path ? (
                                                    <img 
                                                        src={product.image_path} 
                                                        alt={product.name}
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <Utensils className="h-5 w-5 text-muted-foreground/50" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-semibold text-sm">{product.name}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                {product.short_description || "No description"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-xs">
                                                {product.category?.name || "—"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-wrap gap-1">
                                                    {product.tags?.slice(0, 2).map((t:any) => (
                                                        <Badge key={t.id} variant="secondary" className="text-[10px] h-5">
                                                            {t.name}
                                                        </Badge>
                                                    ))}
                                                    {product.tags?.length > 2 && (
                                                        <Badge variant="outline" className="text-[10px] h-5">
                                                            +{product.tags.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {product.sizes?.slice(0, 2).map((s:any) => (
                                                        <Badge key={s.id} variant="outline" className="text-[10px] h-5 border-dashed">
                                                            {s.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {!!product.is_popular && (
                                                    <Trophy size={14} className="text-yellow-600 dark:text-yellow-500" title="Popular" />
                                                )}
                                                {!!product.is_signature && (
                                                    <Star size={14} className="text-blue-600 dark:text-blue-500" title="Signature" />
                                                )}
                                                {!!product.is_chef_recommendation && (
                                                    <Flame size={14} className="text-orange-600 dark:text-orange-500" title="Chef's Recommendation" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            <div className="flex items-center gap-1">
                                                <DollarSign size={12} className="text-muted-foreground" />
                                                {product.base_price}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={product.is_active ? "default" : "outline"} 
                                                className={`text-xs ${product.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300' : ''}`}
                                            >
                                                {product.is_active ? 'Active' : 'Hidden'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Switch 
                                                    checked={!!product.is_active} 
                                                    onCheckedChange={() => toggleActive(product.id, product.is_active)} 
                                                />
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleEdit(product)} 
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <Settings2 size={16} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* FOOTER: PAGINATION */}
                    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t bg-muted/20 gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                                Showing <span className="font-semibold">{(currentPage - 1) * rowsPerPage + 1}</span> to{" "}
                                <span className="font-semibold">
                                    {Math.min(currentPage * rowsPerPage, filteredProducts.length)}
                                </span> of{" "}
                                <span className="font-semibold">{filteredProducts.length}</span> items
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Rows per page:</span>
                                <Select 
                                    value={rowsPerPage.toString()} 
                                    onValueChange={(v) => { setRowsPerPage(parseInt(v)); setCurrentPage(1); }}
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
                </Card>
            )}

            {/* PRODUCT FORM DIALOG */}
            <Dialog open={open} onOpenChange={(v) => { 
                if(!v) { 
                    setOpen(false); 
                    setEditingProduct(null); 
                    setSelectedFile(null);
                    setClearCurrentImage(false); 
                } }}>
                <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-lg bg-background">
                    <DialogHeader className="p-6 border-b">
                        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                            {editingProduct ? (
                                <>
                                    <Edit3 size={20} />
                                    Edit Product
                                </>
                            ) : (
                                <>
                                    <Plus size={20} />
                                    Add New Product
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {editingProduct 
                                ? "Update product details and configurations." 
                                : "Add a new product to your menu catalog."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <ScrollArea className="h-[70vh] w-full">
                            <div className='px-6 py-4' >
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Image Upload */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium">Product Image</Label>
                                        <div className="border rounded-lg p-4 bg-muted/20">
                                            <ImagePicker 
                                                aspectRatio='square'
                                                onImageSelect={setSelectedFile}  
                                                currentImage={clearCurrentImage ? undefined : editingProduct?.image_path} 
                                                clearCurrentImage={() => setClearCurrentImage(true)}
                                            />
                                        </div>
                                    </div>

                                    {/* Marketing Highlights */}
                                    <div className="space-y-4">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                            <Star size={16} />
                                            Marketing Highlights
                                        </Label>
                                        <div className="space-y-3 border rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="font-medium">Popular</Label>
                                                    <p className="text-xs text-muted-foreground">Feature as customer favorite</p>
                                                </div>
                                                <Switch 
                                                    checked={formData.is_popular} 
                                                    onCheckedChange={v => setFormData({...formData, is_popular: v})} 
                                                />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="font-medium">Signature</Label>
                                                    <p className="text-xs text-muted-foreground">Show as restaurant specialty</p>
                                                </div>
                                                <Switch 
                                                    checked={formData.is_signature} 
                                                    onCheckedChange={v => setFormData({...formData, is_signature: v})} 
                                                />
                                            </div>
                                            <Separator />
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="font-medium">Chef's Recommendation</Label>
                                                    <p className="text-xs text-muted-foreground">Highlight as chef's pick</p>
                                                </div>
                                                <Switch 
                                                    checked={formData.is_chef_recommendation} 
                                                    onCheckedChange={v => setFormData({...formData, is_chef_recommendation: v})} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-5">
                                    {/* Basic Info */}
                                    <div className="space-y-4">
                                        <Label className="text-sm font-medium">Basic Information</Label>
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label>Product Name *</Label>
                                                <Input 
                                                    value={formData.name} 
                                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                                    required 
                                                    placeholder="Enter product name"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Price ($) *</Label>
                                                    <Input 
                                                        type="number" 
                                                        step="0.01" 
                                                        min="0"
                                                        value={formData.base_price} 
                                                        onChange={e => setFormData({...formData, base_price: e.target.value})} 
                                                        required 
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Category *</Label>
                                                    <Select 
                                                        value={formData.category_id} 
                                                        onValueChange={v => setFormData({...formData, category_id: v})}
                                                        required
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {categories.map((c:any) => (
                                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                                    {c.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attributes */}
                                    <div className="space-y-4">
                                        <Label className="text-sm font-medium">Attributes</Label>
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Tag size={14} />
                                                    Tags
                                                </Label>
                                                <MultiSelect 
                                                    options={masterTags} 
                                                    defaultValue={formData.tag_ids} 
                                                    onValueChange={v => setFormData({...formData, tag_ids: v})}
                                                    placeholder="Select tags..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="flex items-center gap-2">
                                                    <Maximize2 size={14} />
                                                    Sizes
                                                </Label>
                                                <MultiSelect 
                                                    options={masterSizes} 
                                                    defaultValue={formData.size_ids} 
                                                    onValueChange={v => setFormData({...formData, size_ids: v})}
                                                    placeholder="Select sizes..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Descriptions */}
                                    <div className="space-y-4">
                                        <Label className="text-sm font-medium">Descriptions</Label>
                                        <div className="space-y-3">
                                            <div className="space-y-2">
                                                <Label>Short Description</Label>
                                                <Input 
                                                    value={formData.short_description} 
                                                    onChange={e => setFormData({...formData, short_description: e.target.value})}  
                                                    placeholder="Brief description for menus"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Full Description</Label>
                                                <Textarea 
                                                    value={formData.description} 
                                                    onChange={e => setFormData({...formData, description: e.target.value})} 
                                                    placeholder="Detailed product description..."
                                                    className="min-h-[100px] resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                        {/* <ScrollBar
                            orientation="vertical"/> */}
                        </ScrollArea>
                        <DialogFooter className="p-6 border-t gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setOpen(false)}
                                className="flex-1 sm:flex-none"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading} 
                                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {editingProduct ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    editingProduct ? 'Update Product' : 'Create Product'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OwnerProducts;