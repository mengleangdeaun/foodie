import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, ArrowLeft, DollarSign, Percent, CheckCircle2, XCircle, 
  AlertCircle, Home, ChevronDown, Tag, CheckSquare, Square, Filter,
  Save, Trash2, RefreshCw, Layers, Package, Eye, EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/util/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";

interface SizeData {
  size_id: number;
  size_name: string;
  product_base_price: number;
  branch_product_price: number | null;
  branch_size_price: number | null;
  effective_base_price: number;
  price_source: 'product_base' | 'branch_product' | 'branch_size';
  discount_percentage: number;
  is_discount_active: boolean;
  discount_source: 'none' | 'branch_product' | 'branch_size';
  final_price: number;
  is_available: boolean;
}



const BranchProductSizes = () => {
  const { branchId, productId } = useParams<{ branchId: string; productId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [sizes, setSizes] = useState<SizeData[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Bulk Update States
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<string>('available');
  const [bulkDiscount, setBulkDiscount] = useState<string>('0');
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Filter State
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  useEffect(() => {
    if (branchId && productId) {
      fetchSizes();
    } else {
      setError('Missing branch ID or product ID');
      setLoading(false);
    }
  }, [branchId, productId]);

  const formatPrice = (price) =>
  Number(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });


  const fetchSizes = async () => {
    if (!branchId || !productId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/price-size/${branchId}/products/${productId}/sizes`);
      
      if (response.data.success === false) {
        setError(response.data.error || 'Failed to load sizes');
        return;
      }
      
      setProduct(response.data.product);
      setSizes(response.data.sizes || []);
      setSelectedSizes([]); // Clear selection on refresh
      
      if (!response.data.product || !response.data.sizes) {
        setError('Invalid response format from server');
      }
      
    } catch (error: any) {
      console.error('Error fetching sizes:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Please check your connection and try again.';
      
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Failed to load sizes",
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSizeUpdate = (index: number, field: keyof SizeData, value: any) => {
    const updatedSizes = [...sizes];
    updatedSizes[index] = { ...updatedSizes[index], [field]: value };
    
    // Recalculate price if needed
    if (field === 'branch_size_price' || field === 'discount_percentage' || field === 'is_discount_active') {
      const effectivePrice = value !== null && field === 'branch_size_price' 
        ? value 
        : updatedSizes[index].effective_base_price;
      
      const discount = updatedSizes[index].is_discount_active ? updatedSizes[index].discount_percentage : 0;
      const finalPrice = effectivePrice * (1 - discount / 100);
      updatedSizes[index].final_price = Math.round(finalPrice * 100) / 100;
      
      // Update price source
      if (field === 'branch_size_price') {
        updatedSizes[index].price_source = value !== null ? 'branch_size' : 
          updatedSizes[index].branch_product_price !== null ? 'branch_product' : 'product_base';
        updatedSizes[index].effective_base_price = value !== null ? value : 
          updatedSizes[index].branch_product_price || updatedSizes[index].product_base_price;
      }
    }
    
    setSizes(updatedSizes);
  };

  const handleSave = async () => {
    if (!branchId || !productId) return;
    
    try {
      setSaving(true);
      const response = await api.put(`/admin/price-size/${branchId}/products/${productId}/sizes`, {
        sizes: sizes.map(size => ({
          size_id: size.size_id,
          branch_size_price: size.branch_size_price !== null ? size.branch_size_price : null,
          discount_percentage: size.discount_percentage,
          is_discount_active: size.is_discount_active,
          is_available: size.is_available
        }))
      });
      
      if (response.data.success === false) {
        throw new Error(response.data.error || 'Update failed');
      }
      
      toast({
        title: "Success",
        description: response.data.message || "Size prices updated successfully.",
        variant: "default"
      });
      
      fetchSizes(); // Refresh data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || error.message 
        || 'Update failed. Please try again.';
      
      toast({
        variant: "destructive",
        title: "Update failed",
        description: errorMessage
      });
    } finally {
      setSaving(false);
    }
  };

  // Bulk Update Functions
const handleBulkUpdate = async () => {
  if (!branchId || !productId || selectedSizes.length === 0) {
    toast({
      variant: "destructive",
      title: "No sizes selected",
      description: "Please select at least one size to update."
    });
    return;
  }

  setBulkLoading(true);
  
  try {
    let updateData: any = {};
    
    switch (bulkAction) {
      case 'available':
        updateData.is_available = true;
        break;
      case 'unavailable':
        updateData.is_available = false;
        break;
      case 'discount_enable':
        updateData.is_discount_active = true;
        if (bulkDiscount) {
          updateData.discount_percentage = parseFloat(bulkDiscount);
        }
        break;
      case 'discount_disable':
        // FIX: Set discount active to false AND reset discount percentage to 0
        updateData.is_discount_active = false;
        updateData.discount_percentage = 0;
        break;
      case 'set_price':
        if (!bulkPrice) {
          toast({
            variant: "destructive",
            title: "Price required",
            description: "Please enter a price for bulk update."
          });
          setBulkLoading(false);
          return;
        }
        updateData.branch_size_price = parseFloat(bulkPrice);
        break;
      case 'clear_price':
        updateData.branch_size_price = null;
        break;
    }
    
    // Make sure we're sending the correct data
    const response = await api.post(`/admin/price-size/${branchId}/products/${productId}/sizes/bulk`, {
      size_ids: selectedSizes,
      ...updateData
    });
    
    if (response.data.success === false) {
      throw new Error(response.data.error || 'Bulk update failed');
    }
    
    toast({
      title: "Bulk Update Successful",
      description: `Updated ${selectedSizes.length} size(s).`,
      variant: "default"
    });
    
    // Refresh the data to ensure UI matches database
    await fetchSizes();
    
    setBulkUpdateOpen(false);
    setSelectedSizes([]);
    setBulkDiscount('0');
    setBulkPrice('');
    
  } catch (error: any) {
    const errorMessage = error.response?.data?.error 
      || error.response?.data?.message 
      || error.message 
      || 'Bulk update failed';
    
    toast({
      variant: "destructive",
      title: "Bulk Update Failed",
      description: errorMessage
    });
  } finally {
    setBulkLoading(false);
  }
};

  const handleSelectAll = () => {
    const filteredSizes = showAvailableOnly 
      ? sizes.filter(size => size.is_available)
      : sizes;
      
    if (selectedSizes.length === filteredSizes.length) {
      setSelectedSizes([]);
    } else {
      setSelectedSizes(filteredSizes.map(s => s.size_id));
    }
  };

const handleBulkActionChange = (value: string) => {
  setBulkAction(value);
  
  // Reset related fields when action changes
  if (value !== 'discount_enable') {
    setBulkDiscount('0');
  }
  if (value !== 'set_price') {
    setBulkPrice('');
  }
};

const getBulkActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    'available': 'Set Available',
    'unavailable': 'Set Unavailable',
    'discount_enable': 'Enable Discount',
    'discount_disable': 'Disable Discount',
    'set_price': 'Set Custom Price',
    'clear_price': 'Clear Custom Price',
  };
  return labels[action] || action.replace('_', ' ');
};

  const filteredSizes = showAvailableOnly 
    ? sizes.filter(size => size.is_available)
    : sizes;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Loading size information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Size Pricing</h1>
              <p className="text-muted-foreground">
                Error loading size information
              </p>
            </div>
          </div>
          
          <Button onClick={() => navigate('/admin/inventory')} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={fetchSizes} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button onClick={() => navigate('/admin/inventory')}>
            Go to Inventory
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Product Not Found</AlertTitle>
          <AlertDescription>
            The product you're trying to manage sizes for could not be found.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/admin/inventory')}>
          Back to Inventory
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product?.name} Size Pricing </h1>
            <p className="text-muted-foreground">
              • Base Price: ${product?.base_price?.toFixed(2)}
              {product?.category_name && ` • Category: ${product.category_name}`}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={() => fetchSizes()} 
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving || sizes.length === 0}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sizes</p>
                <p className="text-2xl font-bold">{sizes.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {sizes.filter(s => s.is_available).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Discount</p>
                <p className="text-2xl font-bold text-blue-600">
                  {sizes.filter(s => s.is_discount_active).length}
                </p>
              </div>
              <Tag className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Custom Prices</p>
                <p className="text-2xl font-bold text-purple-600">
                  {sizes.filter(s => s.branch_size_price !== null).length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center  gap-2">
                <Checkbox
                  checked={selectedSizes.length > 0 && selectedSizes.length === filteredSizes.length}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <Label htmlFor="select-all" className="text-sm cursor-pointer">
                  {selectedSizes.length > 0 
                    ? `${selectedSizes.length} selected` 
                    : 'Select all'}
                </Label>
              </div>
              
              <div className="flex items-center gap-2 p-2 rounded-md border">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="filter-available" className="text-sm cursor-pointer">
                  Available Only
                </Label>
                <Switch
                  id="filter-available"
                  checked={showAvailableOnly}
                  onCheckedChange={setShowAvailableOnly}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedSizes.length > 0 && (
                <>
                <Dialog open={bulkUpdateOpen} onOpenChange={setBulkUpdateOpen}>
  <DialogTrigger asChild>
    <Button variant="default">
      <Layers className="h-4 w-4 mr-2" />
      Bulk Update ({selectedSizes.length})
    </Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Bulk Update Sizes</DialogTitle>
      <DialogDescription>
        Apply changes to {selectedSizes.length} selected size(s)
      </DialogDescription>
    </DialogHeader>
    
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="bulk-action">Action</Label>
        <Select value={bulkAction} onValueChange={handleBulkActionChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an action" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Availability</SelectLabel>
              <SelectItem value="available">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Set Available</span>
                </div>
              </SelectItem>
              <SelectItem value="unavailable">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  <span>Set Unavailable</span>
                </div>
              </SelectItem>
            </SelectGroup>
            
            <SelectSeparator />
            
            <SelectGroup>
              <SelectLabel>Discount</SelectLabel>
              <SelectItem value="discount_enable">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span>Enable Discount</span>
                </div>
              </SelectItem>
              <SelectItem value="discount_disable">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 opacity-50" />
                  <span>Disable Discount</span>
                </div>
              </SelectItem>
            </SelectGroup>
            
            <SelectSeparator />
            
            <SelectGroup>
              <SelectLabel>Pricing</SelectLabel>
              <SelectItem value="set_price">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Set Custom Price</span>
                </div>
              </SelectItem>
              <SelectItem value="clear_price">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 opacity-50" />
                  <span>Clear Custom Price</span>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {bulkAction === 'discount_enable' && (
        <div className="grid gap-2">
          <Label htmlFor="bulk-discount">Discount Percentage</Label>
          <div className="flex items-center gap-2">
            <Input
              id="bulk-discount"
              type="number"
              min="0"
              max="100"
              value={bulkDiscount}
              onChange={(e) => setBulkDiscount(e.target.value)}
              className="flex-1"
            />
            <span className="text-muted-foreground">%</span>
          </div>
        </div>
      )}
      
      {bulkAction === 'set_price' && (
        <div className="grid gap-2">
          <Label htmlFor="bulk-price">Custom Price ($)</Label>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Input
              id="bulk-price"
              type="number"
              step="0.01"
              min="0"
              value={bulkPrice}
              onChange={(e) => setBulkPrice(e.target.value)}
              placeholder="Enter price"
            />
          </div>
        </div>
      )}
      
      <div className="bg-muted p-3 rounded-md">
        <h4 className="font-semibold text-sm mb-1">Summary</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Affecting {selectedSizes.length} size(s)</li>
          <li>• Action: {getBulkActionLabel(bulkAction)}</li>
          {bulkAction === 'discount_enable' && bulkDiscount && (
            <li>• Discount: {bulkDiscount}%</li>
          )}
          {bulkAction === 'set_price' && bulkPrice && (
            <li>• Price: ${parseFloat(bulkPrice).toFixed(2)}</li>
          )}
        </ul>
      </div>
    </div>
    
    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setBulkUpdateOpen(false)}
        disabled={bulkLoading}
      >
        Cancel
      </Button>
      <Button
        onClick={handleBulkUpdate}
        disabled={bulkLoading || selectedSizes.length === 0}
      >
        {bulkLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Apply Bulk Update
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
                  
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSizes([])}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                </>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Quick Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Quick Size Updates</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    const updatedSizes = sizes.map(size => ({
                      ...size,
                      is_available: true
                    }));
                    setSizes(updatedSizes);
                  }}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Make All Available
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const updatedSizes = sizes.map(size => ({
                      ...size,
                      is_available: false
                    }));
                    setSizes(updatedSizes);
                  }}>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Make All Unavailable
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const updatedSizes = sizes.map(size => ({
                      ...size,
                      branch_size_price: null
                    }));
                    setSizes(updatedSizes);
                  }}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Clear All Custom Prices
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {sizes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Sizes Configured</h3>
            <p className="text-muted-foreground mb-4">
              This product doesn't have any sizes defined. Please add sizes to the master product first.
            </p>
            <Button variant="outline" onClick={() => navigate(`/admin/products/${productId}/edit`)}>
              Edit Product
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Size Pricing Table */
        <Card>
          <CardHeader>
            <CardTitle>Size-Specific Pricing</CardTitle>
            <CardDescription>
              Manage branch-specific pricing for each size. Leave "Custom Price" empty to use branch product price.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedSizes.length > 0 && selectedSizes.length === filteredSizes.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-center">Base Price</TableHead>
                    <TableHead className="text-center">Custom Price</TableHead>
                    <TableHead className="text-center">Discount</TableHead>
                    <TableHead className="text-center">Final Price</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSizes.map((size, index) => (
                    <TableRow key={size.size_id} className={!size.is_available ? 'bg-muted/30' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSizes.includes(size.size_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSizes([...selectedSizes, size.size_id]);
                            } else {
                              setSelectedSizes(selectedSizes.filter(id => id !== size.size_id));
                            }
                          }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div className="font-medium">{size.size_name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID: {size.size_id}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                      <span className="font-medium">
                        ${formatPrice(size.product_base_price)}
                      </span>

                      {size.branch_product_price !== null && (
                        <span className="text-xs text-blue-600">
                          Branch: ${formatPrice(size.branch_product_price)}
                        </span>
                      )}

                        </div>
                      </TableCell>

                      
                      <TableCell>
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={size.branch_size_price === null ? '' : size.branch_size_price}
                              onChange={(e) => handleSizeUpdate(index, 'branch_size_price', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-32 text-center"
                              placeholder={formatPrice(size.effective_base_price)}
                            />
                          </div>
                          
                          <Badge 
                            variant={size.price_source === 'branch_size' ? "default" : "outline"} 
                            className="text-xs"
                          >
                            {size.price_source === 'branch_size' ? (
                              <span className="flex items-center gap-1">
                                <CheckSquare className="h-3 w-3" />
                                Custom Price
                              </span>
                            ) : size.price_source === 'branch_product' ? (
                              <span>Using Branch Price</span>
                            ) : (
                              <span>Using Base Price</span>
                            )}
                          </Badge>
                          
                          {size.branch_size_price !== null && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs"
                              onClick={() => handleSizeUpdate(index, 'branch_size_price', null)}
                            >
                              Reset to Default
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={size.discount_percentage}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  if (value === '') {
                                    handleSizeUpdate(index, 'discount_percentage', '');
                                    return;
                                  }

                                  const num = Number(value);

                                  if (num >= 0 && num <= 100) {
                                    handleSizeUpdate(index, 'discount_percentage', num);
                                  }
                                }}
                                className="w-20 text-center"
                              />

                              <Percent className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <Switch
                              checked={size.is_discount_active}
                              onCheckedChange={(checked) => handleSizeUpdate(index, 'is_discount_active', checked)}
                            />
                          </div>
                          
                          {size.is_discount_active && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              {size.discount_source === 'branch_size' ? 'Size Discount' : 'Product Discount'}: {size.discount_percentage}%
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className={`font-bold ${size.is_discount_active ? 'text-green-600' : ''}`}>
                          ${size.final_price}
                          {size.is_discount_active && size.discount_percentage > 0 && (
                            <div className="text-xs text-green-500">
                              Save {((size.effective_base_price - size.final_price) / size.effective_base_price * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>
                        {size.effective_base_price !== size.final_price && (
                          <div className="text-xs text-gray-500 line-through">
                            ${formatPrice(size.effective_base_price)}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Switch
                            checked={size.is_available}
                            onCheckedChange={(checked) => handleSizeUpdate(index, 'is_available', checked)}
                          />
                          <Badge 
                            variant={size.is_available ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            {size.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Legend */}
            <div className="mt-6 p-4 border rounded-md bg-muted/20">
              <h4 className="font-semibold mb-2">Price Source Legend</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">Custom Price</Badge>
                  <span className="text-sm">Size has specific branch price</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Branch Price</Badge>
                  <span className="text-sm">Using branch product price</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Base Price</Badge>
                  <span className="text-sm">Using product base price</span>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              {selectedSizes.length > 0 && (
                <span>{selectedSizes.length} size(s) selected • </span>
              )}
              Showing {filteredSizes.length} of {sizes.length} sizes
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save All Changes
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default BranchProductSizes;