import { useEffect, useState } from 'react';
import api from '@/util/api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import TimeRangePicker from "@/components/ui/time-range-picker";
import TimePicker from "@/components/ui/time-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfirmationModal from "@/components/ConfirmationModal"; 
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { Copy } from "lucide-react";
import { 
  Plus, 
  MapPin, 
  Store, 
  Pencil, 
  Send, 
  Loader2, 
  Clock, 
  Users, 
  Hash, 
  Mail, 
  Phone,
  Globe,
  Settings,
  Image,
  Bell,
  Shield,
  Building2,
  Calendar,
  QrCode, 
  Percent,
  MoreVertical,
  Trash2,
  CircleCheckBig,
  X
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import OwnerBranchAppearance from './BranchAppearance';
import ImagePicker from "@/components/ImagePicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PaintBucket, ImageIcon } from "lucide-react";



const OwnerBranches = () => {
  const { toast } = useToast();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [testingToken, setTestingToken] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // Add these new states
const [openAppearanceDialog, setOpenAppearanceDialog] = useState(false);
const [branchForAppearance, setBranchForAppearance] = useState<any>(null);
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [branchToClone, setBranchToClone] = useState<any>(null);
  const [isCloning, setIsCloning] = useState(false);

  // Delete States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

// Add this function
const handleOpenAppearance = (branch: any) => {
  setBranchForAppearance(branch);
  setOpenAppearanceDialog(true);
};
  
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ 
    branch_name: '', 
    location: '', 
    is_active: true, 
    requires_cancel_note: true,
    telegram_bot_token: '', 
    telegram_chat_id: '', 
    telegram_topic_id: '',
    telegram_bot_name: '', 
    opening_days: '', 
    opening_time: '', 
    closing_time: '',
    contact_phone: '', 
    contact_email: '', 
    qr_payment_path: '', 
    qr_payment_file: null
  });

  useEffect(() => { 
    fetchBranches(); 
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/branches');
      setBranches(res.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to load branches",
        description: "Please try again later"
      });
    } finally { 
      setLoading(false); 
    }
  };

  const handleOpenModal = (branch: any = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({ 
        branch_name: branch.branch_name, 
        location: branch.location || '', 
        is_active: branch.is_active == 1, 
        requires_cancel_note: branch.requires_cancel_note == 1,
        telegram_bot_token: branch.telegram_bot_token || '',
        telegram_chat_id: branch.telegram_chat_id || '',
        telegram_topic_id: branch.telegram_topic_id || '',
        telegram_bot_name: branch.telegram_bot_name || '',
        opening_days: branch.opening_days || '',
        opening_time: branch.opening_time || '',
        closing_time: branch.closing_time || '',
        contact_phone: branch.contact_phone || '',
        contact_email: branch.contact_email || '',
        qr_payment_path: branch.qr_payment_path || '',
        qr_payment_file: null,
        tax_is_active: branch.tax_is_active == 1, 
        tax_name: branch.tax_name,
        tax_rate: branch.tax_rate || '',
      });
    } else {
      setEditingBranch(null);
      setFormData({ 
        branch_name: '', 
        location: '', 
        is_active: true, 
        requires_cancel_note: true,
        telegram_bot_token: '', 
        telegram_chat_id: '', 
        telegram_topic_id: '',
        telegram_bot_name: '', 
        opening_days: '', 
        opening_time: '', 
        closing_time: '',
        contact_phone: '', 
        contact_email: '', 
        qr_payment_path: '', 
        qr_payment_file: null,
        tax_is_active: true,
        tax_name: '',
        tax_rate: '',
      });
    }
    setActiveTab("general");
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'qr_payment_file') {
        if (formData[key]) data.append(key, formData[key]);
      } else if (key !== 'qr_payment_path') {
        if (typeof formData[key] === 'boolean') {
          data.append(key, formData[key] ? '1' : '0');
        } else if (formData[key] !== null) {
          data.append(key, formData[key]);
        }
      }
    });

    try {
      if (editingBranch) {
        data.append('_method', 'PUT');
        await api.post(`/admin/branches/${editingBranch.id}`, data);
        toast({ 
          title: "Branch Updated",
          description: `${formData.branch_name} has been updated successfully`
        });
      } else {
        await api.post('/admin/branches', data);
        toast({ 
          title: "Branch Created",
          description: `${formData.branch_name} has been added successfully`
        });
      }
      setOpenDialog(false);
      fetchBranches();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Operation Failed",
        description: error.response?.data?.message || "Please check your input and try again"
      });
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleTestTelegram = async () => {
    if (!editingBranch?.id) {
      toast({
        variant: "destructive",
        title: "No branch selected",
        description: "Please save the branch first before testing Telegram"
      });
      return;
    }
    
    if (!formData.telegram_bot_token) {
      toast({
        variant: "destructive",
        title: "Bot token required",
        description: "Please enter a Telegram bot token"
      });
      return;
    }
    
    setTestingToken(true);
    try {
      const res = await api.post(`/admin/branches/${editingBranch.id}/test-telegram`, {
        telegram_bot_token: formData.telegram_bot_token
      });
      toast({ 
        title: "Connection Successful!", 
        description: res.data.message 
      });
      if (res.data.bot_name) {
        setFormData((p: any) => ({ ...p, telegram_bot_name: res.data.bot_name }));
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Connection Failed",
        description: error.response?.data?.message || "Could not connect to Telegram"
      });
    } finally { 
      setTestingToken(false); 
    }
  };

  const generateTelegramLink = () => {
    if (!formData.telegram_bot_token) return '#';
    const botToken = formData.telegram_bot_token;
    const botId = botToken.split(':')[0];
    return `https://t.me/${botId}_bot`;
  };


  const handleOpenClone = (branch: any) => {
    setBranchToClone(branch);
    setIsCloneModalOpen(true);
  };

  const onConfirmClone = async () => {
    if (!branchToClone) return;
    setIsCloning(true);
    try {
      await api.post(`/admin/branches/${branchToClone.id}/clone`);
      toast({ title: "Success", description: "Branch cloned successfully" });
      fetchBranches();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Failed to clone branch" });
    } finally {
      setIsCloning(false);
      setIsCloneModalOpen(false);
    }
  };




  const handleOpenDelete = (branch: any) => {
    setBranchToDelete(branch);
    setIsDeleteModalOpen(true);
  };

  const onConfirmDelete = async () => {
    if (!branchToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/branches/${branchToDelete.id}`);
      toast({ title: "Deleted", description: "Branch removed successfully" });
      fetchBranches();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to delete" });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Branch Management
          </h1>
          <p className="text-muted-foreground">
            Manage your restaurant locations and their configurations
          </p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Branch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))
        ) : branches.length === 0 ? (
          <div className="col-span-full text-center py-12 border rounded-lg">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No branches yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by adding your first restaurant location
            </p>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Branch
            </Button>
          </div>
        ) : (
          branches.map((branch: any) => (
          <Card key={branch.id} className="overflow-hidden hover:shadow-lg transition-shadow">
  <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{branch.branch_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      {branch.location || "No address"}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-1">
              <Badge variant={branch.is_active == 1 ? "default" : "secondary"}>
                {branch.is_active == 1 ? (
                  <span className="flex items-center gap-1">
                    <CircleCheckBig className="w-4 h-4" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <X className="w-4 h-4" />
                    Inactive
                  </span>
                )}
              </Badge>

                  
                  {/* Three-Dot Menu for Clone and Delete */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenClone(branch)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Clone Branch
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive" 
                        onClick={() => handleOpenDelete(branch)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Branch
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
  <CardContent className="space-y-3">
    {branch.telegram_bot_name && (
      <div className="flex items-center gap-2 text-sm">
        <Bell className="h-3 w-3 text-green-500" />
        <span className="text-muted-foreground">
          Telegram: @{branch.telegram_bot_name}
        </span>
      </div>
    )}
    {(branch.opening_time || branch.closing_time) && (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="h-3 w-3 text-blue-500" />
        <span className="text-muted-foreground">
          {branch.opening_time} - {branch.closing_time}
        </span>
      </div>
    )}
    {branch.contact_phone && (
      <div className="flex items-center gap-2 text-sm">
        <Phone className="h-3 w-3 text-purple-500" />
        <span className="text-muted-foreground">
          {branch.contact_phone}
        </span>
      </div>
    )}
    
    {/* Branch Appearance Preview */}
    {(branch.primary_color || branch.logo_url) && (
      <div className="pt-2 border-t">
        <div className="flex items-center gap-2 mb-2">
          <PaintBucket className="h-3 w-3 text-amber-500" />
          <span className="text-xs text-muted-foreground">Custom Appearance</span>
        </div>
        <div className="flex items-center gap-2">
          {branch.primary_color && (
            <div className="flex items-center gap-1">
              <div 
                className="h-4 w-4 rounded-sm border" 
                style={{ backgroundColor: branch.primary_color }}
              />
              <span className="text-xs text-muted-foreground">Primary Color</span>
            </div>
          )}
          {branch.primary_color && (
            <div className="flex items-center gap-1">
              <div 
                className="h-4 w-4 rounded-sm border" 
                style={{ backgroundColor: branch.secondary_color }}
              />
              <span className="text-xs text-muted-foreground">Secondary Color</span>
            </div>
          )}
        </div>
      </div>
    )}
  </CardContent>



<CardFooter className="border-t pt-4">
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => handleOpenModal(branch)}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => handleOpenAppearance(branch)}
                >
                  <PaintBucket className="h-4 w-4" />
                  Appearance
                </Button>
              </div>
            </CardFooter>
</Card>
          ))
        )}
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              {editingBranch ? 'Edit Branch' : 'Add New Branch'}
            </DialogTitle>
            <DialogDescription>
              {editingBranch 
                ? 'Update branch information and settings'
                : 'Configure a new restaurant location'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
            <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="gap-1">
                <Settings className="h-3 w-3 mr-2" />
                General
            </TabsTrigger>
              <TabsTrigger value="business-hour" className="gap-1">
                <Clock className="h-3 w-3 mr-2" />
                Business Hour
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1">
                <Bell className="h-3 w-3 mr-2" />
                Notifications
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-1">
                <QrCode className="h-3 w-3 mr-2" />
                Payment
            </TabsTrigger>
            {/* Remove the Appearance tab from here */}
            </TabsList>

              <TabsContent value="general" className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch_name">Branch Name *</Label>
                    <Input
                      id="branch_name"
                      value={formData.branch_name}
                      onChange={e => setFormData({...formData, branch_name: e.target.value})}
                      placeholder="Main Restaurant"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      placeholder="123 Street, City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Phone Number</Label>
                    <Input
                      id="contact_phone"
                      value={formData.contact_phone}
                      onChange={e => setFormData({...formData, contact_phone: e.target.value})}
                      placeholder="+855 123 456 789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email Address</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={e => setFormData({...formData, contact_email: e.target.value})}
                      placeholder="contact@restaurant.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" >
                  <div className="space-y-2">
                    <Label htmlFor="tax_name">Tax Name</Label>
                    <Input
                      id="tax_name"
                      value={formData.tax_name}
                      onChange={e => setFormData({...formData, tax_name: e.target.value})}
                      placeholder="VAT"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_name">Tax Rate(%)</Label>
                    <div className="relative">
                      <Input 
                          id="tax_rate"
                          type="number" 
                          min="0"
                          max="100"
                          step="0.01" 
                          required 
                          value={formData.tax_rate} 
                          onChange={e => setFormData({...formData, tax_rate: e.target.value})}
                          placeholder="0.00"
                          className="pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Percent className="h-4 w-4" />
                      </div>
                      </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax_name">Tax Status</Label>
                      <Switch
                        checked={formData.tax_is_active}
                        onCheckedChange={v => setFormData({...formData, tax_is_active: v})}
                      />
                  </div>
                </div>


                <Separator />
                

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Branch Settings
                    </Label>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="space-y-0.5">
                        <Label className="font-medium">Branch Status</Label>
                        <p className="text-sm text-muted-foreground">
                          Make this branch active in the system
                        </p>
                      </div>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={v => setFormData({...formData, is_active: v})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="space-y-0.5">
                        <Label className="font-medium">Require Cancellation Notes</Label>
                        <p className="text-sm text-muted-foreground">
                          Staff must provide a reason when cancelling orders
                        </p>
                      </div>
                      <Switch
                        checked={formData.requires_cancel_note}
                        onCheckedChange={v => setFormData({...formData, requires_cancel_note: v})}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6 pt-4">
                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Telegram Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Configure Telegram bot for order notifications and updates
                  </p>
                </div>

                <div className="space-y-4 p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="space-y-0.5">
                      <Label className="font-medium">Bot Configuration</Label>
                      {formData.telegram_bot_name && (
                        <Badge variant="secondary" className="mt-1 gap-1">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          Connected to @{formData.telegram_bot_name}
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleTestTelegram}
                      disabled={testingToken || !formData.telegram_bot_token}
                      className="gap-2"
                    >
                      {testingToken ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Send className="h-3 w-3" />
                      )}
                      Test Connection
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="telegram_bot_token">Bot Token *</Label>
                      <Input
                        id="telegram_bot_token"
                        type="password"
                        value={formData.telegram_bot_token}
                        onChange={e => setFormData({...formData, telegram_bot_token: e.target.value})}
                        placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                        className="font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="telegram_chat_id">Chat ID</Label>
                        <Input
                          id="telegram_chat_id"
                          value={formData.telegram_chat_id}
                          onChange={e => setFormData({...formData, telegram_chat_id: e.target.value})}
                          placeholder="-1001234567890"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telegram_topic_id">Topic ID</Label>
                        <Input
                          id="telegram_topic_id"
                          value={formData.telegram_topic_id}
                          onChange={e => setFormData({...formData, telegram_topic_id: e.target.value})}
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>

                  {formData.telegram_bot_token && (
                    <div className="mt-4 p-3 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">
                        Bot Link:{' '}
                        <a 
                          href={generateTelegramLink()} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {generateTelegramLink()}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

<TabsContent value="payment" className="space-y-6 pt-4">
  <div className="space-y-4 items-center">
    <Label className="text-base font-medium flex items-center gap-2">
      <QrCode className="h-4 w-4" />
      Payment QR Code
    </Label>
    <p className="text-sm text-muted-foreground">
      Upload KHQR/ABA QR code for easy payment scanning
    </p>
  </div>

  <div className="space-y-4 flex justify-center">
    <ImagePicker 
      onImageSelect={f => setFormData({...formData, qr_payment_file: f})}
      currentImage={formData.qr_payment_path ? 
        `${import.meta.env.VITE_API_URL}/storage/${formData.qr_payment_path}` : 
        undefined
      }
      label="QR Code Image"
      description="Recommended size: 500x500px, PNG or JPG format"
      boxClassName="max-h-25 max-w-25"
    />
  </div>
</TabsContent>

<TabsContent value="business-hour" className="space-y-6 pt-4"  >

  <div className="space-y-4">
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="space-y-2">
        <Label htmlFor="opening_days" className='flex gap-2' >
        <Calendar className='h-4 w-4' />  Days Open</Label>
        <Input
          id="opening_days"
          value={formData.opening_days}
          onChange={e => setFormData({...formData, opening_days: e.target.value})}
          placeholder="Monday - Sunday"
        />
      </div>
    </div>

    <div className='col-span-2' >
        <TimeRangePicker
          startTime={formData.opening_time}
          endTime={formData.closing_time}
          onStartTimeChange={(value) => setFormData({...formData, opening_time: value})}
          onEndTimeChange={(value) => setFormData({...formData, closing_time: value})}
          label="Business Hours"
          interval={15}
          hourFormat="auto"
          required
          
        />
      </div> 

  </div>


</TabsContent>

            </Tabs>

            <DialogFooter className="mt-6 pt-6 border-t">
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
                    {editingBranch ? 'Saving...' : 'Creating...'}
                  </>
                ) : editingBranch ? (
                  'Save Changes'
                ) : (
                  'Create Branch'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

<Dialog open={openAppearanceDialog} onOpenChange={setOpenAppearanceDialog}>
  <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
    
    {branchForAppearance && (
      <OwnerBranchAppearance 
        branch={branchForAppearance} 
        onUpdate={() => {
          fetchBranches();
          setOpenAppearanceDialog(false);
        }} 
      />
    )}
  </DialogContent>
</Dialog>

<ConfirmationModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onConfirm={onConfirmClone}
        isLoading={isCloning}
        title="Clone Branch?"
        description={`This will duplicate all settings from "${branchToClone?.branch_name}". The clone will be inactive by default.`}
        confirmText="Clone Now"
      />


<DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onConfirmDelete}
        loading={isDeleting}
        title="Delete Branch?"
        description={
            <span>
                Are you sure? This will permanently delete <strong>{branchToDelete?.branch_name}</strong> and all its configurations.
            </span>
        }
      />

    </div>
  );
};

export default OwnerBranches;