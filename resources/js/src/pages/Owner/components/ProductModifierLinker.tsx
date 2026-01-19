import React, { useEffect, useState } from 'react';
import api from '@/util/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
    Search, 
    Loader2, 
    Link as LinkIcon, 
    Trash2, 
    ChevronRight, 
    Filter, 
    AlertCircle,
    CheckCircle2,
    Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ProductModifierLinkerProps {
    modifierGroups: any[];
    onRefresh: () => void;
}

const ProductModifierLinker = ({ modifierGroups, onRefresh }: ProductModifierLinkerProps) => {
    const { toast } = useToast();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'linked' | 'unlinked'>('all');
    
    // Selection States
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkActionType, setBulkActionType] = useState<'attach' | 'detach'>('attach');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/products');
            setProducts(res.data);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredProducts = products.filter((p: any) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const hasModifiers = p.modifier_groups && p.modifier_groups.length > 0;
        
        if (filterStatus === 'linked') return matchesSearch && hasModifiers;
        if (filterStatus === 'unlinked') return matchesSearch && !hasModifiers;
        return matchesSearch;
    });

    const toggleProduct = (id: number) => {
        setSelectedProducts(prev => 
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleGroupSelection = (id: number) => {
        setSelectedGroups(prev => 
            prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
        );
    };

    const handleBulkOperation = async () => {
        setIsSubmitting(true);
        try {
            await api.post('/admin/modifiers/bulk-sync', {
                product_ids: selectedProducts,
                modifier_group_ids: selectedGroups,
                action: bulkActionType
            });

            toast({ 
                title: "Operation Successful", 
                description: `${bulkActionType === 'attach' ? 'Linked' : 'Unlinked'} ${selectedGroups.length} groups for ${selectedProducts.length} items.` 
            });

            setIsBulkModalOpen(false);
            setSelectedProducts([]);
            setSelectedGroups([]);
            fetchProducts(); // Refresh local product list to show updated links
            onRefresh();     // Refresh parent group list
        } catch (error) {
            toast({ variant: "destructive", title: "Operation Failed", description: "Check your connection and permissions." });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex h-96 flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground italic">Auditing your catalog...</p>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* AUDIT FILTER BAR */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20 p-2 rounded-xl border border-border">
                <div className="flex gap-1 w-full md:w-auto overflow-x-auto">
                    {(['all', 'unlinked', 'linked'] as const).map((status) => (
                        <Button
                            key={status}
                            variant={filterStatus === status ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setFilterStatus(status)}
                            className="text-[10px] font-bold uppercase tracking-tight h-8 px-4"
                        >
                            {status === 'unlinked' && <AlertCircle size={12} className="mr-1.5 text-orange-500" />}
                            {status === 'linked' && <CheckCircle2 size={12} className="mr-1.5 text-green-500" />}
                            {status} items
                        </Button>
                    ))}
                </div>
                <div className="text-[10px] font-bold text-muted-foreground px-4 uppercase italic">
                    {filteredProducts.length} Products Found
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 1. PRODUCT LISTING */}
                <Card className="lg:col-span-8 shadow-sm bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4 bg-muted/5">
                        <div className="space-y-1">
                            <CardTitle className="text-base font-semibold">Catalog Selection</CardTitle>
                            <p className="text-xs text-muted-foreground">{selectedProducts.length} items chosen</p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-[10px] font-bold uppercase"
                                onClick={() => setSelectedProducts(filteredProducts.map(p => p.id))}
                            >
                                Select All
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-[10px] font-bold uppercase"
                                onClick={() => setSelectedProducts([])}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search products by name..." 
                                className="pl-9 bg-background h-10 border-border"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <ScrollArea className="h-[550px] border rounded-lg bg-background/50">
                            <div className="divide-y divide-border/50">
                                {filteredProducts.map((product) => (
                                    <div 
                                        key={product.id}
                                        onClick={() => toggleProduct(product.id)}
                                        className={`
                                            flex items-center p-4 cursor-pointer transition-all hover:bg-muted/30 group
                                            ${selectedProducts.includes(product.id) ? 'bg-primary/[0.03]' : ''}
                                        `}
                                    >
                                        <Checkbox checked={selectedProducts.includes(product.id)} className="mr-4 pointer-events-none" />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold tracking-tight text-foreground">{product.name}</p>
                                                <Badge variant="outline" className="font-mono text-[9px] h-4 py-0">${product.base_price}</Badge>
                                            </div>
                                            
                                            {/* VISIBILITY: Showing exact links */}
                                            <div className="flex flex-wrap gap-1">
                                                {product.modifier_groups?.map((mg: any) => (
                                                    <Badge key={mg.id} variant="secondary" className="text-[9px] bg-muted text-muted-foreground border-none font-medium h-4">
                                                        {mg.name}
                                                    </Badge>
                                                ))}
                                                {(!product.modifier_groups || product.modifier_groups.length === 0) && (
                                                    <span className="text-[9px] text-destructive font-black uppercase italic tracking-tighter">No Options Configured</span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="ml-4 opacity-0 group-hover:opacity-30 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* 2. ACTION CONTROLS */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className="border-primary/20 bg-primary/[0.02] shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-bold uppercase tracking-tight">Bulk Actions</CardTitle>
                            <CardDescription className="text-xs">Manage links for {selectedProducts.length} products.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button 
                                className="w-full h-11 justify-start font-bold" 
                                disabled={selectedProducts.length === 0}
                                onClick={() => { setBulkActionType('attach'); setIsBulkModalOpen(true); }}
                            >
                                <LinkIcon size={14} className="mr-2" /> Attach Modifiers
                            </Button>
                            
                            <Button 
                                variant="outline"
                                className="w-full h-11 justify-start font-bold text-destructive hover:bg-destructive/10 border-destructive/20" 
                                disabled={selectedProducts.length === 0}
                                onClick={() => { setBulkActionType('detach'); setIsBulkModalOpen(true); }}
                            >
                                <Trash2 size={14} className="mr-2" /> Detach Modifiers
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/10 border-border">
                        <CardContent className="p-4 flex gap-3">
                            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                                <strong>Attach</strong> adds new groups without removing existing ones. 
                                <strong>Detach</strong> removes only the groups you select in the next step.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ACTION DIALOG */}
            <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-border bg-background shadow-2xl rounded-xl">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="text-xl font-bold tracking-tight">
                            {bulkActionType === 'attach' ? 'Select Groups to Link' : 'Select Groups to Unlink'}
                        </DialogTitle>
                        <DialogDescription className="text-xs uppercase font-bold text-primary mt-1">
                            Action will affect {selectedProducts.length} items
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <ScrollArea className="h-72 border rounded-lg bg-muted/10 p-2">
                            <div className="space-y-1">
                                {modifierGroups.map((group) => (
                                    <div 
                                        key={group.id}
                                        onClick={() => toggleGroupSelection(group.id)}
                                        className={`
                                            flex items-center space-x-3 p-3 rounded-md cursor-pointer border border-transparent 
                                            transition-all hover:bg-background hover:border-border
                                            ${selectedGroups.includes(group.id) ? 'bg-background border-border shadow-sm' : ''}
                                        `}
                                    >
                                        <Checkbox checked={selectedGroups.includes(group.id)} className="pointer-events-none" />
                                        <div className="flex-1">
                                            <p className="text-sm font-bold tracking-tight">{group.name}</p>
                                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{group.selection_type} Choice</p>
                                        </div>
                                        <Badge variant="secondary" className="text-[9px] font-bold px-1.5 h-5 bg-muted-foreground/10 border-none">
                                            {group.modifiers?.length} Options
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <Button variant="ghost" onClick={() => setIsBulkModalOpen(false)}>Cancel</Button>
                        <Button 
                            variant={bulkActionType === 'detach' ? 'destructive' : 'default'}
                            disabled={selectedGroups.length === 0 || isSubmitting}
                            onClick={handleBulkOperation}
                            className="px-8 font-bold"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : `Confirm ${bulkActionType === 'attach' ? 'Mapping' : 'Removal'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProductModifierLinker;