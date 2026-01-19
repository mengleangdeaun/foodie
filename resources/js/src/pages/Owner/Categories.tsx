import { useEffect, useState, useMemo } from 'react';
import api from '@/util/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge"; // Added Badge
import { 
    LayoutGrid, 
    Plus, 
    Trash2, 
    Pencil, 
    Search, 
    List, 
    PackageOpen,
    Layers
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

const Categories = () => {
    const { toast } = useToast();
    
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    
    const [open, setOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [categoryName, setCategoryName] = useState('');

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/categories');
            setCategories(res.data);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load categories." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const filteredCategories = useMemo(() => {
        return categories.filter(cat => 
            cat.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [categories, searchQuery]);

    const handleOpenModal = (category: any = null) => {
        if (category) {
            setEditingCategory(category);
            setCategoryName(category.name);
        } else {
            setEditingCategory(null);
            setCategoryName('');
        }
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.put(`/admin/categories/${editingCategory.id}`, { name: categoryName });
                toast({ title: "Success", description: "Category updated!" });
            } else {
                await api.post('/admin/categories', { name: categoryName });
                toast({ title: "Success", description: "Category created!" });
            }
            setOpen(false);
            fetchCategories();
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: "Error", 
                description: error.response?.data?.message || "Something went wrong" 
            });
        }
    };

    const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
        // Optimistic Update: Update UI immediately for a snappy feel
        setCategories(prev => prev.map(cat => 
            cat.id === id ? { ...cat, is_active: !currentStatus } : cat
        ));

        await api.put(`/admin/categories/${id}`, { is_active: !currentStatus });
        
        toast({ 
            title: !currentStatus ? "Category Activated" : "Category Deactivated",
            description: `Category is now ${!currentStatus ? 'visible' : 'hidden'} on the menu.`
        });
    } catch (error) {
        // Rollback on error
        fetchCategories(); 
        toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
};

    const confirmDelete = (id: number) => {
        setCategoryToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/admin/categories/${categoryToDelete}`);
            toast({ title: "Deleted", description: "Category removed." });
            fetchCategories();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: "Could not delete category." });
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setCategoryToDelete(null);
        }
    }

    const renderEmptyState = () => {
    if (searchQuery) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <h3 className="font-medium text-lg">No matches found</h3>
                <p className="text-muted-foreground">We couldn't find any category named "{searchQuery}"</p>
                <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">
                    Clear search
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-muted/10">
            <PackageOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium">Your menu is empty</p>
            <Button onClick={() => handleOpenModal()} variant="outline" className="mt-4">
                Create your first category
            </Button>
        </div>
    );
};

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Layers className="h-6 w-6 text-primary" /> Categories
                </h2>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
            </div>

            <Tabs defaultValue="table" className="w-full">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search categories..." 
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <TabsList className="grid grid-cols-2 w-full md:w-auto">
                        <TabsTrigger value="table"><List className="h-4 w-4 mr-2" /> Table</TabsTrigger>
                        <TabsTrigger value="grid"><LayoutGrid className="h-4 w-4 mr-2" /> Grid</TabsTrigger>
                    </TabsList>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                    </div>
                ) : filteredCategories.length === 0 ? (
                     renderEmptyState()
                ) : (
                    <>
                        {/* Table View */}
                        <TabsContent value="table" className="mt-0">
                            <Card className="overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Category Name</TableHead>
                                            <TableHead>Product Count</TableHead>
                                             <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCategories.map((cat) => (
                                            <TableRow key={cat.id} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-semibold">{cat.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">
                                                        {cat.products_count || 0} Products
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Switch 
                                                            checked={cat.is_active} 
                                                            onCheckedChange={() => handleToggleActive(cat.id, cat.is_active)}
                                                        />
                                                        <span className="text-xs text-muted-foreground">
                                                            {cat.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cat)}>
                                                        <Pencil className="h-4 w-4 text-primary" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(cat.id)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Card>
                        </TabsContent>

                        {/* Grid View */}
<TabsContent value="grid" className="mt-0">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {filteredCategories.map((cat) => (
      <Card 
        key={cat.id} 
        className={`group transition-all duration-200 hover:shadow-md border-l-4 ${
          cat.is_active ? "border-l-primary" : "border-l-muted-foreground opacity-75 bg-muted/20"
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold truncate max-w-[140px]">
                  {cat.name}
                </CardTitle>
                {!cat.is_active && (
                   <Badge variant="outline" className="text-[10px] h-4 px-1 uppercase tracking-wider opacity-60">
                     Hidden
                   </Badge>
                )}
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors">
                {cat.products_count || 0} Items
              </Badge>
            </div>
            
            <div className="flex flex-col items-end gap-3">
               <Switch 
                checked={cat.is_active} 
                onCheckedChange={() => handleToggleActive(cat.id, cat.is_active)}
                className="scale-90"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4">
           <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/50">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-muted-foreground hover:text-primary"
                onClick={() => handleOpenModal(cat)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-muted-foreground hover:text-destructive"
                onClick={() => confirmDelete(cat.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
           </div>
        </CardContent>
      </Card>
    ))}
  </div>
</TabsContent>
                    </>
                )}
            </Tabs>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Update Category' : 'New Category'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="category-name">Category Name</Label>
                            <Input 
                                id="category-name"
                                value={categoryName} 
                                onChange={(e) => setCategoryName(e.target.value)} 
                                placeholder="e.g. Beverages" 
                                required 
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            {editingCategory ? 'Update' : 'Create'} Category
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setCategoryToDelete(null);
                }}
                onConfirm={handleDelete}
                 title="Delete Category?"
                description="Are you sure you want to delete this category? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </div>
    );
};

export default Categories;



