import React, { useState, useEffect } from 'react';
import api from '@/util/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
    Plus, Pencil, Trash2, Tag as TagIcon, 
    Maximize, Loader2, Palette, Hash, Flame, 
    Leaf, Star, Sparkles, AlertCircle, 
    Coffee, Pizza, Beer, Clock, Heart
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Skeleton Components
const TableSkeleton = ({ rows = 5, columns = 3 }: { rows?: number; columns?: number }) => (
    <Table>
        <TableHeader>
            <TableRow>
                {Array.from({ length: columns }).map((_, i) => (
                    <TableHead key={i}>
                        <Skeleton className="h-4 w-24" />
                    </TableHead>
                ))}
            </TableRow>
        </TableHeader>
        <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <TableCell key={colIndex}>
                            <Skeleton className="h-6 w-full max-w-[200px]" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    </Table>
);

const CardHeaderSkeleton = () => (
    <div className="flex flex-row items-center justify-between p-6">
        <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
    </div>
);

const TagTableSkeleton = () => (
    <div className="space-y-4">
        <CardHeaderSkeleton />
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                        <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-6 w-32" />
                                </div>
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-6 w-24" />
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <div className="inline-flex gap-2 float-right">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </div>
);

const SizeTableSkeleton = () => (
    <div className="space-y-4">
        <CardHeaderSkeleton />
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                        <TableHead className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <Skeleton className="h-6 w-32" />
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <div className="inline-flex gap-2 float-right">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </div>
);

const AttributeManager = () => {
    const { toast } = useToast();
    const [tags, setTags] = useState<any[]>([]);
    const [sizes, setSizes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [initialLoading, setInitialLoading] = useState(true);
    
    // Modal States
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [tagForm, setTagForm] = useState({ name: '', color_type: 'primary', icon_type: '' });
    const [sizeForm, setSizeForm] = useState({ name: '' });

    const availableIcons = [
        { id: 'flame', icon: Flame, label: 'Spicy' },
        { id: 'leaf', icon: Leaf, label: 'Vegan' },
        { id: 'star', icon: Star, label: 'Signature' },
        { id: 'sparkles', icon: Sparkles, label: 'New' },
        { id: 'heart', icon: Heart, label: 'Loved' },
        { id: 'clock', icon: Clock, label: 'Limited' },
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [tagsRes, sizesRes] = await Promise.all([
                api.get('/admin/tags'),
                api.get('/admin/sizes')
            ]);
            setTags(tagsRes.data);
            setSizes(sizesRes.data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to load data",
                description: "Please try again later"
            });
        } finally { 
            setLoading(false);
            setInitialLoading(false);
        }
    };

    const handleSaveTag = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingItem) {
                await api.put(`/admin/tags/${editingItem.id}`, tagForm);
                toast({ title: "Tag Updated", description: "Tag has been successfully updated." });
            } else {
                await api.post('/admin/tags', tagForm);
                toast({ title: "Tag Created", description: "New tag has been added to your library." });
            }
            setIsTagModalOpen(false);
            loadData();
        } catch (error) {
            toast({
                variant: "destructive",
                title: editingItem ? "Update Failed" : "Creation Failed",
                description: "Please check your input and try again."
            });
        } finally { 
            setSubmitting(false); 
        }
    };

    const handleSaveSize = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingItem) {
                await api.put(`/admin/sizes/${editingItem.id}`, sizeForm);
                toast({ title: "Size Updated", description: "Size has been successfully updated." });
            } else {
                await api.post('/admin/sizes', sizeForm);
                toast({ title: "Size Created", description: "New size has been added to your library." });
            }
            setIsSizeModalOpen(false);
            loadData();
        } catch (error) {
            toast({
                variant: "destructive",
                title: editingItem ? "Update Failed" : "Creation Failed",
                description: "Please check your input and try again."
            });
        } finally { 
            setSubmitting(false); 
        }
    };

    const deleteItem = async (type: 'tags' | 'sizes', id: number) => {
        if (!confirm("Are you sure? This will remove this attribute from all products.")) return;
        try {
            await api.delete(`/admin/${type}/${id}`);
            toast({ 
                title: "Deleted Successfully", 
                description: "Attribute has been removed from all products." 
            });
            loadData();
        } catch (e) { 
            toast({ 
                variant: "destructive", 
                title: "Delete Failed", 
                description: "This attribute might be in use by some products." 
            }); 
        }
    };

    return (
        <div className="mx-auto space-y-8 text-foreground transition-all duration-300">
            <header className="space-y-1">
                {initialLoading ? (
                    <>
                        <Skeleton className="h-9 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </>
                ) : (
                    <>
                        <h1 className="text-3xl font-bold tracking-tight">Menu Attributes</h1>
                        <p className="text-sm text-muted-foreground">Manage global tags and sizes used across your entire catalog.</p>
                    </>
                )}
            </header>

            <Tabs defaultValue="tags" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 border rounded-xl">
                    <TabsTrigger value="tags" className="rounded-lg px-8 flex gap-2">
                        <TagIcon size={14} /> Master Tags
                    </TabsTrigger>
                    <TabsTrigger value="sizes" className="rounded-lg px-8 flex gap-2">
                        <Maximize size={14} /> Master Sizes
                    </TabsTrigger>
                </TabsList>

                {/* --- TAGS MANAGEMENT --- */}
                <TabsContent value="tags" className="animate-in fade-in slide-in-from-bottom-2">
                    <Card className="border-border shadow-sm">
                        {loading ? (
                            <TagTableSkeleton />
                        ) : (
                            <>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Tags Library</CardTitle>
                                        <CardDescription>Label items as Spicy, Vegan, or Signature.</CardDescription>
                                    </div>
                                    <Button 
                                        onClick={() => { 
                                            setEditingItem(null); 
                                            setTagForm({ name: '', color_type: 'primary', icon_type: '' }); 
                                            setIsTagModalOpen(true); 
                                        }}
                                    >
                                        <Plus size={16} className="mr-2" /> Add New Tag
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {tags.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <TagIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                            <h3 className="font-semibold text-lg mb-2">No Tags Created</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Get started by creating your first menu tag
                                            </p>
                                            <Button 
                                                onClick={() => { 
                                                    setEditingItem(null); 
                                                    setTagForm({ name: '', color_type: 'primary', icon_type: '' }); 
                                                    setIsTagModalOpen(true); 
                                                }}
                                            >
                                                <Plus size={16} className="mr-2" /> Create First Tag
                                            </Button>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Tag Name</TableHead>
                                                    <TableHead>Preview (Theme Colors)</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {tags.map((tag) => (
                                                    <TableRow key={tag.id}>
                                                        <TableCell className="font-semibold">
                                                            <div className="flex items-center gap-2">
                                                                {tag.icon_type && (
                                                                    <div className="p-1.5 rounded-md bg-muted">
                                                                        {tag.icon_type === 'flame' && <Flame size={14} className="text-orange-500" />}
                                                                        {tag.icon_type === 'leaf' && <Leaf size={14} className="text-green-500" />}
                                                                        {tag.icon_type === 'star' && <Star size={14} className="text-yellow-500" />}
                                                                        {tag.icon_type === 'sparkles' && <Sparkles size={14} className="text-fuchsia-600" />}
                                                                        {tag.icon_type === 'heart' && <Heart size={14} className="text-red-600" />}
                                                                        {tag.icon_type === 'clock' && <Clock size={14} className="text-cyan-500" />}
                                                                    </div>
                                                                )}
                                                                {tag.name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge 
                                                                className={`uppercase text-[10px] px-3 font-bold 
                                                                    ${tag.color_type === 'primary' ? 'bg-primary' : 
                                                                    tag.color_type === 'secondary' ? 'bg-secondary' : 
                                                                    tag.color_type === 'accent' ? 'bg-accent text-accent-foreground' : 'bg-destructive'}`}
                                                            >
                                                                {tag.color_type} theme
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => { 
                                                                    setEditingItem(tag); 
                                                                    setTagForm({ 
                                                                        name: tag.name, 
                                                                        color_type: tag.color_type, 
                                                                        icon_type: tag.icon_type || '' 
                                                                    }); 
                                                                    setIsTagModalOpen(true); 
                                                                }}
                                                            >
                                                                <Pencil size={14} />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                                onClick={() => deleteItem('tags', tag.id)}
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </>
                        )}
                    </Card>
                </TabsContent>

                {/* --- SIZES MANAGEMENT --- */}
                <TabsContent value="sizes" className="animate-in fade-in slide-in-from-bottom-2">
                    <Card className="border-border shadow-sm">
                        {loading ? (
                            <SizeTableSkeleton />
                        ) : (
                            <>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Size Library</CardTitle>
                                        <CardDescription>Standardize sizes like Small, Large, or 500ml.</CardDescription>
                                    </div>
                                    <Button 
                                        onClick={() => { 
                                            setEditingItem(null); 
                                            setSizeForm({ name: '' }); 
                                            setIsSizeModalOpen(true); 
                                        }}
                                    >
                                        <Plus size={16} className="mr-2" /> Add New Size
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {sizes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <Maximize className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                            <h3 className="font-semibold text-lg mb-2">No Sizes Created</h3>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Start by adding standard sizes for your menu items
                                            </p>
                                            <Button 
                                                onClick={() => { 
                                                    setEditingItem(null); 
                                                    setSizeForm({ name: '' }); 
                                                    setIsSizeModalOpen(true); 
                                                }}
                                            >
                                                <Plus size={16} className="mr-2" /> Create First Size
                                            </Button>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Size Name</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sizes.map((size) => (
                                                    <TableRow key={size.id}>
                                                        <TableCell className="font-semibold tracking-tight">{size.name}</TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => { 
                                                                    setEditingItem(size); 
                                                                    setSizeForm({ name: size.name }); 
                                                                    setIsSizeModalOpen(true); 
                                                                }}
                                                            >
                                                                <Pencil size={14} />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                                onClick={() => deleteItem('sizes', size.id)}
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            {/* TAG MODAL */}
            <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveTag} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tag Name</Label>
                            <Input 
                                value={tagForm.name} 
                                onChange={e => setTagForm({...tagForm, name: e.target.value})} 
                                placeholder="e.g. Spicy" 
                                required 
                                autoFocus
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Select Icon (Optional)</Label>
                            <div className="grid grid-cols-6 gap-2">
                                <Button
                                    type="button"
                                    variant={!tagForm.icon_type ? "default" : "outline"}
                                    className="h-10 w-10 p-0 rounded-lg"
                                    onClick={() => setTagForm({...tagForm, icon_type: ''})}
                                >
                                    <span className="text-xs">None</span>
                                </Button>
                                {availableIcons.map((item) => {
                                    const IconComp = item.icon;
                                    return (
                                        <Button
                                            key={item.id}
                                            type="button"
                                            variant={tagForm.icon_type === item.id ? "default" : "outline"}
                                            className="h-10 w-10 p-0 rounded-lg"
                                            onClick={() => setTagForm({...tagForm, icon_type: item.id})}
                                        >
                                            <IconComp size={18} />
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Color Type (Branch Theme)</Label>
                            <Select value={tagForm.color_type} onValueChange={v => setTagForm({...tagForm, color_type: v})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select color theme" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="primary">Primary (Signature)</SelectItem>
                                    <SelectItem value="secondary">Secondary (Details)</SelectItem>
                                    <SelectItem value="accent">Accent (Alerts)</SelectItem>
                                    <SelectItem value="danger">Danger (Spicy)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground">
                                This tag will automatically use the colors from each branch's theme.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={submitting} className="w-full">
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {editingItem ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    editingItem ? 'Update Tag' : 'Create Tag'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* SIZE MODAL */}
            <Dialog open={isSizeModalOpen} onOpenChange={setIsSizeModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Size' : 'Create Size'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveSize} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Size Name</Label>
                            <Input 
                                value={sizeForm.name} 
                                onChange={e => setSizeForm({ name: e.target.value })} 
                                placeholder="e.g. Regular" 
                                required 
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={submitting} className="w-full">
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {editingItem ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    editingItem ? 'Update Size' : 'Create Size'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AttributeManager;