import { useState, useEffect } from 'react';
import api from '@/util/api';
import { 
  Button 
} from "@/components/ui/button";
import { 
  Input 
} from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Badge 
} from "@/components/ui/badge";
import { 
  Checkbox 
} from "@/components/ui/checkbox";
import { 
  Label 
} from "@/components/ui/label";
import { 
  Separator 
} from "@/components/ui/separator";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  UserPlus, 
  ShieldCheck, 
  Store, 
  Mail, 
  Loader2, 
  Lock, 
  Wand2, 
  Pencil, 
  Trash2,
  Filter,
  Search,
  Eye,
  EyeOff,
  Key,
  Users,
  Building,
  MoreVertical,
  Copy,
  AlertCircle
} from "lucide-react";

// Import your helper mapping
import { PERMISSION_MAP, ROLE_PRESETS } from '@/util/permissions';

const OwnerStaffManagement = () => {
    const { toast } = useToast();
    const [staff, setStaff] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState<number | null>(null);
    
    const [formData, setFormData] = useState({
        name: '', 
        email: '', 
        password: '', 
        branch_id: '', 
        role: 'waiter', 
        permissions: {} as Record<string, Record<string, boolean>>
    });

    useEffect(() => { 
        fetchData(); 
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffRes, branchRes] = await Promise.all([
                api.get('/admin/staff'), 
                api.get('/admin/branches')
            ]);
            setStaff(Array.isArray(staffRes.data) ? staffRes.data : (staffRes.data.data || []));
            setBranches(branchRes.data || []);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to load data",
                description: "Please try again later"
            });
        } finally { 
            setLoading(false); 
        }
    };

    const handleOpenModal = (member: any = null) => {
        if (member) {
            setEditingStaff(member);
            setFormData({
                name: member.name, 
                email: member.email, 
                password: '', 
                branch_id: member.branch_id?.toString() || '', 
                role: member.role, 
                permissions: member.permissions || {} 
            });
        } else {
            setEditingStaff(null);
            setFormData({ 
                name: '', 
                email: '', 
                password: '', 
                branch_id: '', 
                role: 'waiter', 
                permissions: {} 
            });
        }
        setShowPassword(false);
        setOpenDialog(true);
    };

    const applyPreset = (role: keyof typeof ROLE_PRESETS) => {
        setFormData(prev => ({
            ...prev,
            role: role,
            permissions: ROLE_PRESETS[role]
        }));
        toast({ 
            title: "Template Applied", 
            description: `Permissions set for ${role} role` 
        });
    };

    const handleToggle = (module: string, action: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [module]: {
                    ...prev.permissions[module],
                    [action]: !prev.permissions[module]?.[action]
                }
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.branch_id) {
            toast({
                variant: "destructive",
                title: "Branch required",
                description: "Please select a branch for this staff member"
            });
            return;
        }
        
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                branch_id: parseInt(formData.branch_id),
                // Only include password if provided (for updates) or required (for new)
                ...(!editingStaff || formData.password ? {} : { password: undefined })
            };

            if (editingStaff) {
                await api.put(`/admin/staff/${editingStaff.id}`, payload);
                toast({ 
                    title: "Staff Updated",
                    description: `${formData.name}'s account has been updated`
                });
            } else {
                await api.post('/admin/staff', payload);
                toast({ 
                    title: "Staff Created",
                    description: `${formData.name} has been added to the team`
                });
            }
            setOpenDialog(false);
            fetchData();
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: "Operation failed",
                description: error.response?.data?.message || "Please check your input and try again"
            });
        } finally { 
            setSubmitting(false); 
        }
    };

    const handleDelete = async () => {
        if (!staffToDelete) return;
        try {
            await api.delete(`/admin/staff/${staffToDelete}`);
            toast({ 
                title: "Staff Removed",
                description: "Staff member has been deleted from the system"
            });
            fetchData();
        } catch (error) { 
            toast({ 
                variant: "destructive", 
                title: "Delete failed",
                description: "Unable to delete staff member. Please try again."
            }); 
        } finally {
            setDeleteDialogOpen(false);
            setStaffToDelete(null);
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, password }));
        toast({
            title: "Password Generated",
            description: "A secure password has been generated"
        });
    };

    const filteredStaff = staff.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 ">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                        Staff Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your team members and their access permissions
                    </p>
                </div>
                <Button 
                    onClick={() => handleOpenModal()}
                    className="gap-2"
                >
                    <UserPlus className="h-4 w-4" />
                    Add Staff
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>
                                {staff.length} staff member{staff.length !== 1 ? 's' : ''} in your system
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search staff..."
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
                                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-3 w-1/3" />
                                    </div>
                                    <Skeleton className="h-9 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">
                                {searchQuery ? 'No matching staff' : 'No staff members yet'}
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                {searchQuery 
                                    ? 'Try adjusting your search terms'
                                    : 'Start building your team by adding the first staff member'
                                }
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => handleOpenModal()}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add First Staff Member
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Staff Member</TableHead>
                                        <TableHead>Role & Permissions</TableHead>
                                        <TableHead>Branch</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStaff.map((user: any) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="font-semibold text-primary">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <Badge 
                                                        variant="secondary" 
                                                        className="w-fit capitalize"
                                                    >
                                                        {user.role}
                                                    </Badge>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Lock className="h-3 w-3" />
                                                        {Object.keys(user.permissions || {}).reduce((acc, module) => 
                                                            acc + Object.keys(user.permissions[module] || {}).filter(k => user.permissions[module][k]).length, 0
                                                        )} permissions
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="gap-1">
                                                    <Store className="h-3 w-3" />
                                                    {user.branch?.branch_name || 'No Branch'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon"
                                                                    onClick={() => handleOpenModal(user)}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Edit Staff</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon"
                                                                    className="text-destructive"
                                                                    onClick={() => {
                                                                        setStaffToDelete(user.id);
                                                                        setDeleteDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Delete Staff</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            {editingStaff ? 'Edit Staff Member' : 'Add New Staff'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingStaff 
                                ? 'Update staff information and permissions'
                                : 'Create a new staff account with specific access rights'
                            }
                        </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                                <TabsTrigger value="preview">Preview</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="basic" className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name *</Label>
                                        <Input 
                                            id="name"
                                            required 
                                            value={formData.name} 
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            placeholder="Sok Sabay"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address *</Label>
                                        <Input 
                                            id="email"
                                            type="email" 
                                            required 
                                            value={formData.email} 
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                            placeholder="soksabay@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">
                                            Password {editingStaff && "(Leave blank to keep current)"}
                                        </Label>
                                        <div className="relative">
                                            <Input 
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                required={!editingStaff}
                                                value={formData.password} 
                                                onChange={e => setFormData({...formData, password: e.target.value})}
                                                placeholder={editingStaff ? "••••••••" : "Enter password"}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-3 w-3" />
                                                    ) : (
                                                        <Eye className="h-3 w-3" />
                                                    )}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={generatePassword}
                                                >
                                                    <Key className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="branch">Branch Assignment *</Label>
                                        <Select 
                                            value={formData.branch_id} 
                                            onValueChange={v => setFormData({...formData, branch_id: v})}
                                        >
                                            <SelectTrigger id="branch">
                                                <SelectValue placeholder="Select Branch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map(b => (
                                                    <SelectItem 
                                                        key={b.id} 
                                                        value={b.id.toString()}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Building className="h-3 w-3" />
                                                            {b.branch_name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-medium">Quick Role Presets</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Apply predefined permission sets for common roles
                                            </p>
                                        </div>
                                        <Wand2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(ROLE_PRESETS).map(role => (
                                            <Button 
                                                key={role} 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => applyPreset(role as any)}
                                                className="capitalize"
                                            >
                                                {role.replace('_', ' ')}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="permissions" className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Lock className="h-5 w-5 text-primary" />
                                        <div>
                                            <Label className="text-base font-medium">Granular Permissions</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Fine-tune access for this staff member
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(PERMISSION_MAP).map(([module, config]) => (
                                            <Card key={module} className="overflow-hidden">
                                                <CardHeader className="pb-3 bg-muted/50">
                                                    <CardTitle className="text-sm font-bold uppercase">
                                                        {config.label}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="pt-4">
                                                    <div className="space-y-3">
                                                        {config.actions.map(action => (
                                                            <div 
                                                                key={action} 
                                                                className="flex items-center justify-between"
                                                            >
                                                                <Label 
                                                                    htmlFor={`${module}-${action}`}
                                                                    className="text-sm cursor-pointer flex-1"
                                                                >
                                                                    {action.replace('_', ' ')}
                                                                </Label>
                                                                <Checkbox 
                                                                    id={`${module}-${action}`}
                                                                    checked={formData.permissions[module]?.[action] || false}
                                                                    onCheckedChange={() => handleToggle(module, action)}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                            
                            <TabsContent value="preview" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Staff Preview</CardTitle>
                                        <CardDescription>
                                            Review the staff member's information and permissions
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm text-muted-foreground">Name</Label>
                                                <p className="font-medium">{formData.name || 'Not set'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-muted-foreground">Email</Label>
                                                <p className="font-medium">{formData.email || 'Not set'}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-muted-foreground">Role</Label>
                                                <p className="font-medium capitalize">{formData.role}</p>
                                            </div>
                                            <div>
                                                <Label className="text-sm text-muted-foreground">Branch</Label>
                                                <p className="font-medium">
                                                    {branches.find(b => b.id.toString() === formData.branch_id)?.branch_name || 'Not assigned'}
                                                </p>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div>
                                            <Label className="text-sm text-muted-foreground mb-2">Permissions Summary</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(formData.permissions).map(([module, actions]) => 
                                                    Object.entries(actions).map(([action, enabled]) => 
                                                        enabled && (
                                                            <Badge key={`${module}-${action}`} variant="outline">
                                                                {PERMISSION_MAP[module]?.label} - {action.replace('_', ' ')}
                                                            </Badge>
                                                        )
                                                    )
                                                )}
                                            </div>
                                            {Object.keys(formData.permissions).length === 0 && (
                                                <p className="text-sm text-muted-foreground italic">No permissions set</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                        
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
                                className="min-w-[140px]"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {editingStaff ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : editingStaff ? (
                                    'Update Staff'
                                ) : (
                                    'Create Staff Account'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                            Delete Staff Member
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this staff member? This action cannot be undone.
                            The staff member will lose all access to the system immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default OwnerStaffManagement;