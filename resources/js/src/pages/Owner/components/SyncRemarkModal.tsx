import React, { useState, useEffect } from 'react';
import api from '@/util/api';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    X, RefreshCw, Building, Package, Loader2, 
    Globe, Filter, CheckCircle, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SyncProps {
    remark: any;
    isOpen: boolean;
    onClose: () => void;
}

const SyncRemarkModal = ({ remark, isOpen, onClose }: SyncProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [branches, setBranches] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    
    // State for selected IDs
    const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
    const [selectedCats, setSelectedCats] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState('branches');

    useEffect(() => {
        if (isOpen && remark) {
            loadSyncData();
            // Pre-fill existing syncs if available
            setSelectedBranches(remark.branches?.map((b: any) => b.id) || []);
            setSelectedCats(remark.categories?.map((c: any) => c.id) || []);
        }
    }, [isOpen, remark]);

    const loadSyncData = async () => {
        setLoading(true);
        try {
            const [resB, resC] = await Promise.all([
                api.get('/admin/branches'),
                api.get('/admin/categories')
            ]);
            setBranches(resB.data);
            setCategories(resC.data);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to load data",
                description: error.response?.data?.message || "Please check your network connection."
            });
        } finally { 
            setLoading(false); 
        }
    };

    const handleSync = async () => {
        setSaving(true);
        try {
            await api.post(`/admin/remark-presets/${remark.id}/sync`, {
                branch_ids: selectedBranches,
                category_ids: selectedCats
            });
            
            toast({ 
                title: "Sync Successful", 
                description: `"${remark.name}" has been synchronized to selected locations.` 
            });
            
            onClose();
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: "Sync Failed",
                description: error.response?.data?.message || "Please try again later."
            });
        } finally { 
            setSaving(false); 
        }
    };

    const toggleAllBranches = () => {
        if (selectedBranches.length === branches.length) {
            setSelectedBranches([]);
        } else {
            setSelectedBranches(branches.map(b => b.id));
        }
    };

    const toggleAllCategories = () => {
        if (selectedCats.length === categories.length) {
            setSelectedCats([]);
        } else {
            setSelectedCats(categories.map(c => c.id));
        }
    };

    const getSelectedCount = () => {
        return selectedBranches.length + selectedCats.length;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-semibold">
                                Sync Remark Preset
                            </DialogTitle>
                            <DialogDescription>
                                Distribute "{remark?.name}" to branches and categories
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="text-sm text-muted-foreground">Loading sync options...</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Sync Summary */}
                        <Card className="p-4 bg-muted/20">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Info className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-medium">Sync Overview</h3>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="gap-1">
                                                <Building className="h-3 w-3" />
                                                {selectedBranches.length} of {branches.length} branches
                                            </Badge>
                                            <Badge variant="outline" className="gap-1">
                                                <Package className="h-3 w-3" />
                                                {selectedCats.length} of {categories.length} categories
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm">
                                    <p className="font-semibold">
                                        Total Selections: <span className="text-primary">{getSelectedCount()}</span>
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Sync Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="branches" className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    Branches ({selectedBranches.length})
                                </TabsTrigger>
                                <TabsTrigger value="categories" className="flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Categories ({selectedCats.length})
                                </TabsTrigger>
                            </TabsList>

                            {/* Branches Tab */}
                            <TabsContent value="branches" className="space-y-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <Label>Select branches to receive this remark preset</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleAllBranches}
                                        className="h-8 text-xs"
                                    >
                                        {selectedBranches.length === branches.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                                
                                <ScrollArea className="h-72 rounded-md border">
                                    <div className="p-4 space-y-2">
                                        {branches.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Building className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">No branches available</p>
                                            </div>
                                        ) : (
                                            branches.map(branch => (
                                                <div 
                                                    key={branch.id} 
                                                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <Checkbox 
                                                        id={`branch-${branch.id}`} 
                                                        checked={selectedBranches.includes(branch.id)}
                                                        onCheckedChange={(checked) => {
                                                            setSelectedBranches(prev => 
                                                                checked 
                                                                    ? [...prev, branch.id] 
                                                                    : prev.filter(id => id !== branch.id)
                                                            );
                                                        }}
                                                    />
                                                    <Label 
                                                        htmlFor={`branch-${branch.id}`} 
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        <div className="font-medium">{branch.branch_name}</div>
                                                        {branch.address && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {branch.address}
                                                            </p>
                                                        )}
                                                    </Label>
                                                    {selectedBranches.includes(branch.id) && (
                                                        <CheckCircle className="h-4 w-4 text-primary" />
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            {/* Categories Tab */}
                            <TabsContent value="categories" className="space-y-4 mt-4">
                                <div className="flex items-center justify-between">
                                    <Label>Select categories where this remark will be available</Label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleAllCategories}
                                        className="h-8 text-xs"
                                    >
                                        {selectedCats.length === categories.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                                
                                <ScrollArea className="h-72 rounded-md border">
                                    <div className="p-4 space-y-2">
                                        {categories.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                                <p className="text-sm text-muted-foreground">No categories available</p>
                                            </div>
                                        ) : (
                                            categories.map(category => (
                                                <div 
                                                    key={category.id} 
                                                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                                >
                                                    <Checkbox 
                                                        id={`cat-${category.id}`} 
                                                        checked={selectedCats.includes(category.id)}
                                                        onCheckedChange={(checked) => {
                                                            setSelectedCats(prev => 
                                                                checked 
                                                                    ? [...prev, category.id] 
                                                                    : prev.filter(id => id !== category.id)
                                                            );
                                                        }}
                                                    />
                                                    <Label 
                                                        htmlFor={`cat-${category.id}`} 
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        <div className="font-medium">{category.name}</div>
                                                        {category.description && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {category.description}
                                                            </p>
                                                        )}
                                                    </Label>
                                                    {selectedCats.includes(category.id) && (
                                                        <CheckCircle className="h-4 w-4 text-primary" />
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>

                        {/* Selection Summary */}
                        {getSelectedCount() > 0 && (
                            <Card className="p-4 bg-primary/5 border-primary/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-primary/20 rounded">
                                        <Info className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-foreground">
                                            This remark will be available in:
                                        </p>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {selectedBranches.length > 0 && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Building className="h-3 w-3" />
                                                    {selectedBranches.length} branch{selectedBranches.length !== 1 ? 'es' : ''}
                                                </Badge>
                                            )}
                                            {selectedCats.length > 0 && (
                                                <Badge variant="secondary" className="gap-1">
                                                    <Package className="h-3 w-3" />
                                                    {selectedCats.length} categor{selectedCats.length !== 1 ? 'ies' : 'y'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                )}

                <DialogFooter className="p-6 border-t gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSync}
                        disabled={saving || (selectedBranches.length === 0 && selectedCats.length === 0)}
                        className="flex-1 sm:flex-none"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Syncing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Sync Preset ({getSelectedCount()})
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SyncRemarkModal;