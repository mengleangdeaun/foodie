import { useState, useEffect } from 'react';
import api from '@/util/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import ImagePicker from "@/components/ImagePicker";
import { 
  Bike, 
  Percent, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Upload
} from "lucide-react";

const DeliveryPartnerManagement = () => {
    const { toast } = useToast();
    const [partners, setPartners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [clearCurrentImage, setClearCurrentImage] = useState(false); // Add this
    const [searchQuery, setSearchQuery] = useState('');
    
    // UI States
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPartner, setEditingPartner] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [partnerToDelete, setPartnerToDelete] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '', 
        discount_percentage: 0, 
        is_discount_active: true, 
        is_active: true, 
    });

    useEffect(() => { 
        fetchPartners(); 
    }, []);

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/delivery-partners');
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setPartners(data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to load partners",
                description: "Please try again later"
            });
            setPartners([]);
        } finally { 
            setLoading(false); 
        }
    };

    const handleEdit = (partner: any) => {
        setEditingPartner(partner);
        setFormData({
            name: partner.name,
            discount_percentage: partner.discount_percentage,
            is_discount_active: !!partner.is_discount_active,
            is_active: !!partner.is_active,
        });
        setClearCurrentImage(false);
        setOpenDialog(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData.discount_percentage < 0 || formData.discount_percentage > 100) {
            toast({
                variant: "destructive",
                title: "Invalid discount percentage",
                description: "Discount must be between 0 and 100"
            });
            return;
        }
        
        setSubmitting(true);

        const data = new FormData();
        data.append('name', formData.name.trim());
        data.append('discount_percentage', formData.discount_percentage.toString());
        data.append('is_discount_active', formData.is_discount_active ? '1' : '0');
        data.append('is_active', formData.is_active ? '1' : '0');
   

        if (clearCurrentImage && editingPartner) {
        // Send flag to remove existing image
            data.append('remove_image', 'true'); // Changed from '1' to 'true'
        } else if (selectedFile) {
            // Upload new image
            data.append('logo', selectedFile);
        }

        try {
            if (editingPartner) {
                data.append('_method', 'PUT');
                await api.post(`/admin/delivery-partners/${editingPartner.id}`, data);

            } else {
                await api.post('/admin/delivery-partners', data);
            }
            
            setOpenDialog(false);
            setEditingPartner(null);
            setSelectedFile(null);
            setClearCurrentImage(false); 
            fetchPartners();
            toast({ 
                title: editingPartner ? "Delivery Updated" : "Delivery Created",
                description: editingPartner ? `${formData.name} has been updated.` : `${formData.name} has been added.`
            });
        } catch (error: any) {
            console.error("Submission Error:", error.response?.data);
            toast({ 
                variant: "destructive", 
                title: "Operation failed", 
                description: error.response?.data?.message || "Please check your input and try again" 
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeletePartner = async () => {
        if (!partnerToDelete) return;
        try {
            await api.delete(`/admin/delivery-partners/${partnerToDelete}`);
            setPartners(prev => prev.filter(p => p.id !== partnerToDelete));
            toast({ 
                title: "Partner deleted",
                description: "The delivery partner has been removed"
            });
        } catch (error) {
            toast({ 
                variant: "destructive", 
                title: "Delete failed",
                description: "Unable to delete the partner. Please try again."
            });
        } finally {
            setIsDeleteModalOpen(false);
            setPartnerToDelete(null);
        }
    };

    const toggleStatus = async (id: number, field: string, value: boolean) => {
        try {
            await api.patch(`/admin/delivery-partners/${id}`, { [field]: value });
            setPartners(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
            toast({ 
                title: "Status updated",
                description: field === 'is_active' 
                    ? value ? "Partner activated" : "Partner deactivated"
                    : value ? "Discount activated" : "Discount deactivated"
            });
        } catch (error) {
            toast({ 
                variant: "destructive", 
                title: "Update failed",
                description: "Unable to update status. Please try again."
            });
        }
    };

    const filteredPartners = partners.filter(partner =>
        partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.discount_percentage.toString().includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Bike className="h-8 w-8 text-primary" />
                        Delivery Partners
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your delivery partners and their discount settings
                    </p>
                </div>
                <Dialog open={openDialog} onOpenChange={(v) => { 
                    if(!v){
                        setOpenDialog(false); 
                        setEditingPartner(null); 
                        setSelectedFile(null);
                        setClearCurrentImage(false);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2"
                            onClick={() =>{setEditingPartner(null); setOpenDialog(true);} }    >
                            <Plus className="h-4 w-4" />
                            Add Partner
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">
                                {editingPartner ? 'Edit Partner' : 'Add New Partner'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingPartner 
                                    ? 'Update the delivery partner details'
                                    : 'Add a new delivery partner to your system'
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className='grid grid-cols-2 gap-5' >
                                <ImagePicker 
                                        onImageSelect={setSelectedFile} 
                                        currentImage={clearCurrentImage ? undefined : editingPartner?.logo} 
                                        clearCurrentImage={() => setClearCurrentImage(true)}
                                        label="Partner Logo"
                                        description="Upload a logo for this partner (Recommended: 200x200px)"
                                    />
                                <div className="space-y-4">
    
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-medium">
                                            Partner Name *
                                        </Label>
                                        <Input 
                                            id="name"
                                            required 
                                            value={formData.name} 
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            placeholder="Enter partner name"
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="discount" className="text-sm font-medium">
                                            Discount Percentage *
                                        </Label>
                                        <div className="relative">
                                            <Input 
                                                id="discount"
                                                type="number" 
                                                min="0"
                                                max="100"
                                                step="0.01" 
                                                required 
                                                value={formData.discount_percentage} 
                                                onChange={e => setFormData({...formData, discount_percentage: parseFloat(e.target.value) || 0})}
                                                placeholder="0.00"
                                                className="pr-10"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                <Percent className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 py-2">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-medium">
                                                    Active Status
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Make this partner visible in the system
                                                </p>
                                            </div>
                                            <Switch 
                                                checked={formData.is_active} 
                                                onCheckedChange={(v) => setFormData({...formData, is_active: v})} 
                                            />
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label className="text-sm font-medium">
                                                    Discount Active
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Enable or disable discount for this partner
                                                </p>
                                            </div>
                                            <Switch 
                                                checked={formData.is_discount_active} 
                                                onCheckedChange={(v) => setFormData({...formData, is_discount_active: v})} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <DialogFooter>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setOpenDialog(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={submitting}
                                    className="min-w-[120px]"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : editingPartner ? (
                                        'Update Partner'
                                    ) : (
                                        'Save Partner'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>All Partners</CardTitle>
                            <CardDescription>
                                {partners.length} partner{partners.length !== 1 ? 's' : ''} in your system
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search partners..."
                                className="pl-9 w-full sm:w-[300px]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center space-x-4 p-4">
                                    <Skeleton className="h-12 w-12 rounded-lg" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-3 w-1/3" />
                                    </div>
                                    <Skeleton className="h-10 w-24" />
                                </div>
                            ))}
                        </div>
                    ) : filteredPartners.length === 0 ? (
                        <div className="text-center py-12">
                            <Bike className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                                {searchQuery ? 'No matching partners' : 'No partners yet'}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery 
                                    ? 'Try adjusting your search terms'
                                    : 'Get started by adding your first delivery partner'
                                }
                            </p>
                            {!searchQuery && (
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Your First Partner
                                    </Button>
                                </DialogTrigger>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Partner</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Discount</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPartners.map(partner => (
                                        <TableRow key={partner.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                                        {partner.logo ? (
                                                            <img 
                                                                src={partner.logo} 
                                                                alt={partner.name}
                                                                className="h-full w-full object-contain"
                                                            />
                                                        ) : (
                                                            <Bike className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{partner.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            ID: {partner.id}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge 
                                                        variant={partner.is_active ? "default" : "secondary"}
                                                        className="gap-1"
                                                    >
                                                        {partner.is_active ? (
                                                            <>
                                                                <CheckCircle className="h-3 w-3" />
                                                                Active
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="h-3 w-3" />
                                                                Inactive
                                                            </>
                                                        )}
                                                    </Badge>
                                                    <Switch
                                                        checked={!!partner.is_active}
                                                        onCheckedChange={(v) => toggleStatus(partner.id, 'is_active', v)}
                                                        className="scale-75"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="font-semibold">
                                                        {partner.discount_percentage}%
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={!!partner.is_discount_active}
                                                            onCheckedChange={(v) => toggleStatus(partner.id, 'is_discount_active', v)}
                                                            className="scale-75"
                                                        />
                                                        <Badge 
                                                            variant={partner.is_discount_active ? "outline" : "secondary"}
                                                            className="text-xs"
                                                        >
                                                            {partner.is_discount_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleEdit(partner)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit Partner
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onClick={() => {
                                                                setPartnerToDelete(partner.id);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                            className="cursor-pointer text-destructive"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete Partner
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setPartnerToDelete(null);
                }}
                onConfirm={handleDeletePartner}
                title="Delete Delivery Partner"
                description={`Are you sure you want to delete "${partners.find(p => p.id === partnerToDelete)?.name}" ? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </div>
    );
};

export default DeliveryPartnerManagement;