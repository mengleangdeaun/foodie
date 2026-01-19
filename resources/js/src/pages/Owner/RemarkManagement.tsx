import { useState, useEffect } from 'react';
import api from '@/util/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Plus, Trash2, Tag, Globe, RefreshCw, X, 
    Settings2, Filter, Copy, CheckCircle, Download,
    Layers, Hash, Building, Package, Edit3, MoreVertical,
    Save, ArrowLeft, Circle, CheckSquare, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SyncRemarkModal from './components/SyncRemarkModal';
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

interface Remark {
    id: number;
    name: string;
    options: string[];
    type: 'single' | 'multiple';
    is_required: boolean;
    branches?: any[];
    categories?: any[];
    branches_count?: number;
    categories_count?: number;
    created_at?: string;
}

const RemarkManagement = () => {
    const { toast } = useToast();
    const [remarks, setRemarks] = useState<Remark[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Create/Edit Form State
    const [formData, setFormData] = useState({
        id: null as number | null,
        name: '',
        options: [''],
        type: 'single' as 'single' | 'multiple',
        is_required: false,
    });
    
    // Sync Modal State
    const [selectedRemark, setSelectedRemark] = useState<Remark | null>(null);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    
    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [remarkToDelete, setRemarkToDelete] = useState<Remark | null>(null);

    useEffect(() => { 
        fetchRemarks(); 
    }, []);

    const fetchRemarks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/remark-presets');
            setRemarks(res.data);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to load remarks",
                description: error.response?.data?.message || "Please try again later."
            });
        } finally { 
            setLoading(false); 
        }
    };

const handleSaveRemark = async () => {
    // Validation
    if (!formData.name.trim()) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please enter a remark name."
        });
        return;
    }

    const filteredOptions = formData.options.filter(opt => opt.trim() !== '');
    if (filteredOptions.length === 0) {
        toast({
            variant: "destructive",
            title: "Missing Options",
            description: "Please add at least one option."
        });
        return;
    }

    try {
        const payload = {
            name: formData.name.trim(),
            options: filteredOptions,
            type: formData.type,
            is_required: formData.is_required,
        };

        if (formData.id) {
            // Update existing remark using PUT
            await api.put(`/admin/remark-presets/${formData.id}`, payload);
            toast({ 
                title: "Remark Updated", 
                description: `${formData.name} has been updated successfully.` 
            });
        } else {
            // Create new remark using POST
            await api.post('/admin/remark-presets', payload);
            toast({ 
                title: "Remark Preset Created", 
                description: `${formData.name} has been added to the library.` 
            });
        }
        
        resetForm();
        fetchRemarks();
    } catch (error: any) { 
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.errors?.type?.[0] ||
                           "Please check your network connection.";
        
        toast({ 
            variant: "destructive", 
            title: formData.id ? "Failed to Update Remark" : "Failed to Create Remark",
            description: errorMessage
        }); 
    }
};

    const handleEditRemark = (remark: Remark) => {
        setFormData({
            id: remark.id,
            name: remark.name,
            options: remark.options.length > 0 ? remark.options : [''],
            type: remark.type,
            is_required: remark.is_required,
        });
        // Scroll to form
        document.getElementById('remark-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteRemark = async () => {
        if (!remarkToDelete) return;

        try {
            await api.delete(`/admin/remark-presets/${remarkToDelete.id}`);
            
            toast({
                title: "Remark Deleted",
                description: `${remarkToDelete.name} has been removed from the library.`
            });
            
            fetchRemarks();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Failed to Delete",
                description: error.response?.data?.message || "Please try again later."
            });
        } finally {
            setIsDeleteModalOpen(false);
            setRemarkToDelete(null);
        }
    };

    const openSync = (remark: Remark) => {
        setSelectedRemark(remark);
        setIsSyncModalOpen(true);
    };

    const duplicateOption = (index: number) => {
        const newOptions = [...formData.options];
        newOptions.splice(index + 1, 0, newOptions[index]);
        setFormData({...formData, options: newOptions});
    };

    const resetForm = () => {
        setFormData({
            id: null,
            name: '',
            options: [''],
            type: 'single',
            is_required: false,
        });
    };

    const addNewOption = () => {
        setFormData({...formData, options: [...formData.options, '']});
    };

    const removeOption = (index: number) => {
        if (formData.options.length <= 1) return;
        const newOptions = formData.options.filter((_, idx) => idx !== index);
        setFormData({...formData, options: newOptions});
    };

    const openDeleteModal = (remark: Remark) => {
        setRemarkToDelete(remark);
        setIsDeleteModalOpen(true);
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'single': return 'Single Selection';
            case 'multiple': return 'Multiple Selection';
            default: return type;
        }
    };


    const getBranchCount = (remark: Remark) => {
    if (remark.branches_count !== undefined) {
        return remark.branches_count;
    }
    if (Array.isArray(remark.branches)) {
        return remark.branches.length;
    }
    return 0;
};

// Helper function to get category count
const getCategoryCount = (remark: Remark) => {
    if (remark.categories_count !== undefined) {
        return remark.categories_count;
    }
    if (Array.isArray(remark.categories)) {
        return remark.categories.length;
    }
    return 0;
};

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Tag className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Remark Presets</h1>
                        <p className="text-sm text-muted-foreground">
                            Create and manage remark templates that can be synchronized across branches and categories
                        </p>
                    </div>
                </div>
                
<div className="flex items-center gap-4 pt-2">
    <Badge variant="outline" className="gap-1">
        <Layers className="h-3 w-3" />
        {remarks.length} Presets
    </Badge>
    <Badge variant="outline" className="gap-1">
        <Building className="h-3 w-3" />
        {remarks.reduce((acc, remark) => acc + getBranchCount(remark), 0)} Branch Assignments
    </Badge>
    <Badge variant="outline" className="gap-1">
        <Package className="h-3 w-3" />
        {remarks.reduce((acc, remark) => acc + getCategoryCount(remark), 0)} Category Assignments
    </Badge>
</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* CREATE/EDIT PANEL */}
                <div className="lg:col-span-4">
                    <Card id="remark-form" className="h-fit">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    {formData.id ? (
                                        <>
                                            <Edit3 className="h-5 w-5" />
                                            Edit Remark Preset
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-5 w-5" />
                                            New Remark Preset
                                        </>
                                    )}
                                </CardTitle>
                                {formData.id && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetForm}
                                        className="h-8 text-xs"
                                    >
                                        <ArrowLeft className="mr-1 h-3 w-3" />
                                        New
                                    </Button>
                                )}
                            </div>
                            <CardDescription>
                                {formData.id 
                                    ? "Update the remark preset details below"
                                    : "Create a new remark template with customizable options"}
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="space-y-6">
                            {/* Preset Name */}
                            <div className="space-y-2">
                                <Label htmlFor="remark-name">Preset Name *</Label>
                                <Input 
                                    id="remark-name"
                                    placeholder="e.g., Sugar Level, Spice Level, Special Instructions" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="h-10"
                                />
                            </div>
                            
                            {/* Selection Type */}
                            <div className="space-y-3">
                                <Label>Selection Type *</Label>
                                <RadioGroup 
                                    value={formData.type} 
                                    onValueChange={(value: 'single' | 'multiple') => 
                                        setFormData({...formData, type: value})
                                    }
                                    className="flex flex-col space-y-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="single" id="single" />
                                        <Label htmlFor="single" className="flex items-center gap-2 cursor-pointer">
                                            <Circle className="h-3 w-3" />
                                            Single Selection
                                            <span className="text-xs text-muted-foreground">(Radio buttons)</span>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="multiple" id="multiple" />
                                        <Label htmlFor="multiple" className="flex items-center gap-2 cursor-pointer">
                                            <CheckSquare className="h-3 w-3" />
                                            Multiple Selection
                                            <span className="text-xs text-muted-foreground">(Checkboxes)</span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            
                            {/* Required Field */}
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Required Field</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Customers must select an option when this remark is required
                                    </p>
                                </div>
                                <Switch 
                                    checked={formData.is_required} 
                                    onCheckedChange={(checked) => 
                                        setFormData({...formData, is_required: checked})
                                    }
                                />
                            </div>
                            
                            {/* Options */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Options *</Label>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={addNewOption}
                                        className="h-8 text-xs"
                                    >
                                        <Plus className="mr-1 h-3 w-3" />
                                        Add Option
                                    </Button>
                                </div>
                                
                                <div className="space-y-3">
                                    {formData.options.map((opt, i) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <div className="flex-1">
                                                <Input 
                                                    placeholder={`Option ${i + 1}`}
                                                    value={opt}
                                                    onChange={e => {
                                                        const newOpts = [...formData.options];
                                                        newOpts[i] = e.target.value;
                                                        setFormData({...formData, options: newOpts});
                                                    }}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => duplicateOption(i)}
                                                    className="h-8 w-8 p-0"
                                                    title="Duplicate option"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                                {formData.options.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeOption(i)}
                                                        className="h-8 w-8 p-0 text-destructive"
                                                        title="Remove option"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="rounded-md bg-muted/50 p-3">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-medium">At least one option is required</p>
                                            <p className="text-muted-foreground text-xs">
                                                Customers will see these options when the remark is presented
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        
                        <CardFooter className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetForm}
                                className="flex-1"
                            >
                                {formData.id ? 'Cancel' : 'Clear'}
                            </Button>
                            <Button
                                onClick={handleSaveRemark}
                                disabled={!formData.name.trim() || formData.options.filter(o => o.trim()).length === 0}
                                className="flex-1"
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {formData.id ? 'Update' : 'Create'} Preset
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* USAGE GUIDE */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                How It Works
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <div className="p-1 bg-primary/10 rounded mt-0.5">
                                    <Building className="h-3 w-3 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Branch Sync</p>
                                    <p className="text-muted-foreground text-xs">
                                        Sync remarks to specific branches for location-specific instructions
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-1 bg-primary/10 rounded mt-0.5">
                                    <Package className="h-3 w-3 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Category Assignment</p>
                                    <p className="text-muted-foreground text-xs">
                                        Assign remarks to product categories for automatic inclusion
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-1 bg-primary/10 rounded mt-0.5">
                                    <Settings2 className="h-3 w-3 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Global Management</p>
                                    <p className="text-muted-foreground text-xs">
                                        Update once and changes propagate to all assigned locations
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* REMARKS LIBRARY */}
                <div className="lg:col-span-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">Remark Preset Library</h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchRemarks}
                                disabled={loading}
                            >
                                <RefreshCw className={`mr-2 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardHeader>
                                        <div className="h-4 bg-muted rounded w-1/3"></div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            <div className="h-3 bg-muted rounded w-full"></div>
                                            <div className="h-3 bg-muted rounded w-2/3"></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : remarks.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Tag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">No Remark Presets</h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    Get started by creating your first remark preset. These templates can be synchronized across branches and categories.
                                </p>
                                <Button onClick={() => setFormData({
                                    id: null,
                                    name: 'New Remark Preset',
                                    options: ['Option 1'],
                                    type: 'single',
                                    is_required: false,
                                })}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create First Preset
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {remarks.map(remark => (
                                <Card key={remark.id} className="group hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-primary/10 rounded-md">
                                                        <Tag className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <CardTitle className="text-base font-semibold">
                                                        {remark.name}
                                                    </CardTitle>
                                                </div>
                                                <CardDescription>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="text-xs">
                                                            {getTypeLabel(remark.type)}
                                                        </Badge>
                                                        {remark.is_required && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Required
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEditRemark(remark)}>
                                                        <Edit3 className="mr-2 h-4 w-4" />
                                                        Edit Preset
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openSync(remark)}>
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Sync to Branches
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        onClick={() => openDeleteModal(remark)}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent className="pb-4">
                                        <div className="mb-4">
                                            <p className="text-sm font-medium mb-2">Options</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {remark.options.map((opt: string, index: number) => (
                                                    <Badge 
                                                        key={index} 
                                                        variant="secondary"
                                                        className="text-xs font-normal"
                                                    >
                                                        {opt}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <Separator className="my-3" />
                                        
                                {/* In your card component, update the branch/category count display: */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Branches</p>
                                        <div className="flex items-center gap-2">
                                            <Building className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-sm font-medium">
                                                {getBranchCount(remark)} assigned
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">Categories</p>
                                        <div className="flex items-center gap-2">
                                            <Package className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-sm font-medium text-primary">
                                                {getCategoryCount(remark)} assigned
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                    </CardContent>
                                    
                                    <CardFooter className="pt-2">
                                        <Button 
                                            onClick={() => openSync(remark)} 
                                            variant="outline" 
                                            size="sm"
                                            className="w-full"
                                        >
                                            <RefreshCw className="mr-2 h-3 w-3" />
                                            Manage Distribution
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SYNC MODAL */}
            <SyncRemarkModal 
                remark={selectedRemark} 
                isOpen={isSyncModalOpen} 
                onClose={() => { 
                    setIsSyncModalOpen(false); 
                    fetchRemarks(); 
                }} 
            />

            {/* DELETE CONFIRMATION MODAL */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setRemarkToDelete(null);
                }}
                onConfirm={handleDeleteRemark}
                title="Delete Remark Preset"
                description={`Are you sure you want to delete "${remarkToDelete?.name}"? This action cannot be undone and will remove this preset from all branches and categories.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </div>
    );
};

export default RemarkManagement;