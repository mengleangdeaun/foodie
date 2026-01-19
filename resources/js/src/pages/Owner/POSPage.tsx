import { useState, useEffect, useMemo, useRef } from 'react';
import api from '@/util/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    ShoppingCart, User, Bike, Trash2, Search, Loader2, 
    CreditCard, Filter, Star, Award, ChefHat, X, Plus,
    Minus, MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

// Import components
import { ProductCard } from './components/pos/ProductCard';
import { CartItem } from './components/pos/CartItem';
import { ProductConfigModal } from './components/pos/ProductConfigModal';

// Types
interface Modifier {
    id: number;
    name: string;
    price: number;
    is_available: boolean;
}

interface ModifierGroup {
    id: number;
    name: string;
    selection_type: 'single' | 'multiple';
    min_selection: number;
    max_selection: number | null;
    modifiers: Modifier[];
}

interface Size {
    id: number;
    name: string;
    base_price: number;
    final_price: number;
    discount_percentage: number;
    has_active_discount: boolean;
    is_available: boolean;
    price_source: string;
    discount_source: string;
}

interface RemarkPresetOption {
    id: number;
    name: string;
    content: string;
    is_default?: boolean;
}

interface RemarkPreset {
    id: number;
    name: string;
    input_type: 'radio' | 'checkbox' | 'text';
    is_required: boolean;
    options?: RemarkPresetOption[];
    content?: string;
}

interface Product {
    id: number;
    name: string;
    description?: string;
    short_description?: string;
    category_id: number;
    final_price: number;
    original_price: number;
    has_discount: boolean;
    discount_percentage: number;
    image_path?: string;
    category?: {
        id: number;
        name: string;
    };
    sizes: Size[];
    modifier_groups: ModifierGroup[];
    tags?: any[];
    is_popular: boolean;
    is_signature: boolean;
    is_chef_recommendation: boolean;
    branch_specific?: boolean;
    pricing: {
        product_base_price: number;
        branch_product_price: number | null;
        is_available: boolean;
        discount_percentage: number;
        has_active_discount: boolean;
        effective_price: number;
        is_popular: boolean;
        is_signature: boolean;
        is_chef_recommendation: boolean;
    };
}

interface Category {
    id: number;
    name: string;
    remark_presets?: RemarkPreset[];
}

interface SelectedPreset {
  presetId: number;
  name: string;
  selectedOptions?: string[];
  selectedOption?: string;
  customText?: string;
}

interface CartItemType {
  id: number;
  name: string;
  quantity: number;
  price: number;
  original_price: number;
  has_discount: boolean;
  discount_percentage: number;
  remark: string;
  image_path?: string;
  selected_size?: Size | null;
  selected_modifiers: {
    [groupId: number]: Modifier[];
  };
  selected_presets: SelectedPreset[]; // Updated to use new interface
  modifier_groups?: ModifierGroup[];
  sizes?: Size[];
  is_popular?: boolean;
  is_signature?: boolean;
  is_chef_recommendation?: boolean;
}

const POSPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const lastLoadedBranchId = useRef<number | null>(null);
    
    // Data States
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [tables, setTables] = useState<any[]>([]); 
    const [cart, setCart] = useState<CartItemType[]>([]);
    const [manualDiscountAmount, setManualDiscountAmount] = useState('0');
    const [manualDiscountPercentage, setManualDiscountPercentage] = useState('0');
    
    // UI & Filter States
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [orderType, setOrderType] = useState<'walk_in' | 'delivery'>('walk_in');
    const [selectedPartner, setSelectedPartner] = useState<any>(null);
    const [selectedTable, setSelectedTable] = useState<string>('');
    
    // Flag Filters
    const [showPopular, setShowPopular] = useState(false);
    const [showSignature, setShowSignature] = useState(false);
    const [showChefPick, setShowChefPick] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    
    // Product Configuration Modal
    const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null);
    const [selectedSize, setSelectedSize] = useState<Size | null>(null);
    const [selectedModifiers, setSelectedModifiers] = useState<{[groupId: number]: Modifier[]}>({});
    const [selectedPresets, setSelectedPresets] = useState<SelectedPreset[]>([]);
    const [remark, setRemark] = useState('');

    useEffect(() => { 
        if (user?.branch_id && lastLoadedBranchId.current !== user.branch_id) {
            lastLoadedBranchId.current = user.branch_id;
            fetchInitialData(); 
        }
    }, [user?.branch_id]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                api.get('/admin/pos-products', { params: { branch_id: user?.branch_id } }),
                api.get('/admin/pos_delivery-partners'),
                api.get('/admin/tables', { params: { branch_id: user?.branch_id } }),
                // api.get('/branch/tax')
            ]);
            
            const [posRes, partnerRes, tableRes] = results;

            if (posRes.status === 'fulfilled') {
                const data = posRes.value.data.data || posRes.value.data;
                setCategories(data.categories || []);
                setProducts(data.products || []);
            }
            if (partnerRes.status === 'fulfilled') {
                setPartners(partnerRes.value.data.data || partnerRes.value.data);
            }
            if (tableRes.status === 'fulfilled') {
                setTables(tableRes.value.data.data || tableRes.value.data);
            }
        } catch (error) {
            toast({ 
                variant: "destructive", 
                title: "Sync Error",
                description: "Failed to load POS data" 
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 product.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'all' || product.category_id?.toString() === activeCategory;
            
            // Apply flag filters
            let matchesFlags = true;
            if (showPopular && !product.is_popular) matchesFlags = false;
            if (showSignature && !product.is_signature) matchesFlags = false;
            if (showChefPick && !product.is_chef_recommendation) matchesFlags = false;
            
            return matchesSearch && matchesCategory && matchesFlags;
        });
    }, [products, searchQuery, activeCategory, showPopular, showSignature, showChefPick]);

    const openProductConfig = (product: Product) => {
        setConfiguringProduct(product);
        setSelectedSize(null);
        setSelectedModifiers({});
        setSelectedPresets([]);
        setRemark('');
    };

const handlePresetChange = (
  presetId: number, 
  selectedOptions?: string[], 
  selectedOption?: string, 
  customText?: string,
  name?: string // <--- Add this parameter
) => {
  setSelectedPresets(prev => {
    const existingIndex = prev.findIndex(p => p.presetId === presetId);
    
    if (existingIndex !== -1) {
      const updated = [...prev];
      if ((!selectedOptions || selectedOptions.length === 0) && !selectedOption && !customText) {
        updated.splice(existingIndex, 1);
      } else {
        updated[existingIndex] = { 
          presetId, 
          name: name || updated[existingIndex].name, // Keep existing name if not provided
          selectedOptions, 
          selectedOption, 
          customText 
        };
      }
      return updated;
    } else {
      if ((selectedOptions && selectedOptions.length > 0) || selectedOption || (customText && customText.trim() !== '')) {
        return [...prev, { 
          presetId, 
          name: name || `Option ${presetId}`, // Store the readable name
          selectedOptions, 
          selectedOption, 
          customText 
        }];
      }
      return prev;
    }
  });
};

const addToCart = () => {
  if (!configuringProduct) return;

  // Calculate final price with modifiers
  let basePrice = configuringProduct.final_price;
  let originalPrice = configuringProduct.original_price;
  let modifiersTotal = 0;

  // If size is selected, use size price
  if (selectedSize) {
    basePrice = selectedSize.final_price;
    originalPrice = selectedSize.base_price;
  }

  // Add selected modifiers prices
  Object.values(selectedModifiers).forEach(modifierList => {
    modifierList.forEach(modifier => {
      modifiersTotal += modifier.price;
    });
  });

  const finalItemPrice = basePrice + modifiersTotal;

  const cartItem: CartItemType = {
    id: configuringProduct.id,
    name: configuringProduct.name,
    quantity: 1,
    price: finalItemPrice,
    original_price: originalPrice,
    has_discount: selectedSize ? selectedSize.has_active_discount : configuringProduct.has_discount,
    discount_percentage: selectedSize ? selectedSize.discount_percentage : configuringProduct.discount_percentage,
    remark: remark,
    image_path: configuringProduct.image_path,
    selected_size: selectedSize,
    selected_modifiers: selectedModifiers,
    selected_presets: selectedPresets, // Now using the new structure
    modifier_groups: configuringProduct.modifier_groups,
    sizes: configuringProduct.sizes,
    is_popular: configuringProduct.is_popular,
    is_signature: configuringProduct.is_signature,
    is_chef_recommendation: configuringProduct.is_chef_recommendation
  };

  setCart(prev => {
    // Check if same item with same configuration exists
    const existingIndex = prev.findIndex(item => 
      item.id === cartItem.id &&
      item.selected_size?.id === cartItem.selected_size?.id &&
      JSON.stringify(item.selected_modifiers) === JSON.stringify(cartItem.selected_modifiers) &&
      JSON.stringify(item.selected_presets) === JSON.stringify(cartItem.selected_presets)
    );

    if (existingIndex !== -1) {
      const updated = [...prev];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].remark = cartItem.remark;
      return updated;
    }

    return [...prev, cartItem];
  });

  // Reset configuration modal
  setConfiguringProduct(null);
  setSelectedSize(null);
  setSelectedModifiers({});
  setSelectedPresets([]);
  setRemark('');
  
  toast({
    title: "Added to Cart",
    description: `${configuringProduct.name} has been added to your cart.`
  });
};

const updateQty = (productId: number, sizeId: number | null, modifiers: any, change: number) => {
  setCart(prev => prev.map(item => {
    if (item.id === productId && 
        item.selected_size?.id === sizeId &&
        JSON.stringify(item.selected_modifiers) === JSON.stringify(modifiers)) {
      const newQty = item.quantity + change;
      if (newQty < 1) return null;
      return { ...item, quantity: newQty };
    }
    return item;
  }).filter(Boolean) as CartItemType[]);
};

const removeFromCart = (productId: number, sizeId: number | null, modifiers: any) => {
  setCart(prev => prev.filter(item => 
    !(item.id === productId && 
      item.selected_size?.id === sizeId &&
      JSON.stringify(item.selected_modifiers) === JSON.stringify(modifiers))
  ));
};

const updateCartItemRemark = (index: number, newRemark: string) => {
  setCart(prev => prev.map((item, idx) => 
    idx === index ? { ...item, remark: newRemark } : item
  ));
};

    const toggleModifier = (groupId: number, modifier: Modifier) => {
        const group = configuringProduct?.modifier_groups?.find(g => g.id === groupId);
        if (!group) return;

        setSelectedModifiers(prev => {
            const current = prev[groupId] || [];
            const isSelected = current.some(m => m.id === modifier.id);

            if (group.selection_type === 'single') {
                return { ...prev, [groupId]: isSelected ? [] : [modifier] };
            } else {
                if (isSelected) {
                    // Remove modifier
                    return { 
                        ...prev, 
                        [groupId]: current.filter(m => m.id !== modifier.id) 
                    };
                } else {
                    // Check max selection
                    if (group.max_selection && current.length >= group.max_selection) {
                        toast({
                            variant: "destructive",
                            title: "Selection Limit",
                            description: `Maximum ${group.max_selection} selections allowed for ${group.name}`
                        });
                        return prev;
                    }
                    return { 
                        ...prev, 
                        [groupId]: [...current, modifier] 
                    };
                }
            }
        });
    };

    const subtotal = useMemo(() => 
        cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), 
        [cart]
    );

    // Calculate delivery partner discount
    const deliveryPartnerDiscount = useMemo(() => {
        if (orderType === 'delivery' && selectedPartner && Number(selectedPartner.is_discount_active) === 1) {
            const discountPercentage = parseFloat(selectedPartner.discount_percentage) || 0;
            if (discountPercentage > 0) {
                return subtotal * (discountPercentage / 100);
            }
        }
        return 0;
    }, [orderType, selectedPartner, subtotal]);

    // Calculate order level discount
    const orderLevelDiscount = useMemo(() => {
        if (manualDiscountAmount && parseFloat(manualDiscountAmount) > 0) {
            return parseFloat(manualDiscountAmount);
        } else if (manualDiscountPercentage && parseFloat(manualDiscountPercentage) > 0) {
            return subtotal * (parseFloat(manualDiscountPercentage) / 100);
        }
        return 0;
    }, [manualDiscountAmount, manualDiscountPercentage, subtotal]);

    // Calculate item discount total
    const itemDiscountTotal = useMemo(() => {
        return cart.reduce((total, item) => {
            if (item.has_discount && item.discount_percentage > 0) {
                const originalPrice = item.selected_size?.base_price || item.original_price;
                return total + (originalPrice * (item.discount_percentage / 100) * item.quantity);
            }
            return total;
        }, 0);
    }, [cart]);

    const totalDiscount = useMemo(() => 
        itemDiscountTotal + orderLevelDiscount + deliveryPartnerDiscount, 
        [itemDiscountTotal, orderLevelDiscount, deliveryPartnerDiscount]
    );

    const taxableAmount = useMemo(() => 
        Math.max(0, subtotal - totalDiscount), 
        [subtotal, totalDiscount]
    );

const handleCheckout = async () => {
  if (cart.length === 0 || checkoutLoading) return;
  setCheckoutLoading(true);
  
  try {
    // Prepare items with correct data structure for backend
    const items = cart.map(item => {
      const modifiersArray: number[] = [];
      Object.values(item.selected_modifiers).forEach(modifierList => {
        modifierList.forEach(modifier => {
          modifiersArray.push(modifier.id);
        });
      });

      // Format presets for backend (as simple remark string)
// Build professional remarks [Label: Value]
const presetRemark = item.selected_presets.map(preset => {
    // If 'name' is missing, it will show "Option ID", but now it prioritizes the Name
    const label = (preset as any).name || (preset as any).label || `Option ${preset.presetId}`;
    
    let value = '';
    if (preset.selectedOptions && preset.selectedOptions.length > 0) {
      value = preset.selectedOptions.join(', ');
    } else if (preset.selectedOption) {
      value = preset.selectedOption;
    } else if (preset.customText) {
      value = preset.customText;
    }

    // Wrap in brackets [Name: Value]
    return value ? `[${label}: ${value}]` : '';
  }).filter(Boolean).join(' ');

  // 2. Combine with user's manual remark
  const finalRemark = `${presetRemark} ${item.remark || ''}`.trim();


      return {
        product_id: item.id,
        quantity: item.quantity,
        remark: finalRemark, // Send the clean string to DB
        selected_size: item.selected_size ? {
          id: item.selected_size.id,
          name: item.selected_size.name
        } : null,
        selected_modifiers: modifiersArray
      };
    });

    // Prepare request data
    const requestData: any = {
      branch_id: user?.branch_id,
      order_type: orderType,
      delivery_partner_id: selectedPartner?.id || null,
      table_id: selectedTable !== 'none' ? selectedTable : null,
      items,
      order_discount_amount: orderLevelDiscount > 0 ? orderLevelDiscount : null,
      order_discount_percentage: manualDiscountPercentage && parseFloat(manualDiscountPercentage) > 0 ? 
        parseFloat(manualDiscountPercentage) : null,
      delivery_partner_discount: deliveryPartnerDiscount
    };

    const response = await api.post('/admin/pos/order', requestData);

    // Reset everything
    setManualDiscountAmount('0');
    setManualDiscountPercentage('0');
    setCart([]);
    setSelectedTable('none');
    setSelectedPartner(null);
    
    toast({ 
      title: "Order Successful!", 
      description: `Order #${response.data.order_number} has been placed. Total: $${response.data.total}`,
      duration: 5000
    });
  } catch (error: any) {
    console.error('Order submission error:', error);
    toast({ 
      variant: "destructive", 
      title: "Order Failed", 
      description: error.response?.data?.message || "Please try again" 
    });
  } finally { 
    setCheckoutLoading(false); 
  }
};

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden gap-4 ">
            {/* LEFT: Menu Selection */}
            <div className="flex-1 flex flex-col gap-4">
                <Card className="p-4 border-none shadow-sm flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input 
                                    placeholder="Search Menu..." 
                                    className="pl-10 h-11 bg-slate-100 border-none" 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                />
                            </div>
                            <Button 
                                variant={showFilters ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="gap-2"
                            >
                                <Filter size={16} />
                                Filters
                                {(showPopular || showSignature || showChefPick) && (
                                    <Badge className="ml-1 h-5 w-5 p-0 bg-primary">
                                        {(showPopular ? 1 : 0) + (showSignature ? 1 : 0) + (showChefPick ? 1 : 0)}
                                    </Badge>
                                )}
                            </Button>
                        </div>
                        {orderType === 'walk_in' && tables.length > 0 && (
                            <Select onValueChange={setSelectedTable} value={selectedTable}>
                                <SelectTrigger className="w-[160px] h-11 font-bold tracking-tighter uppercase">
                                    <SelectValue placeholder="Select Table" />
                                </SelectTrigger>
                                <SelectContent>
                                    {/* <SelectItem value="">No Table</SelectItem> */}
                                    {tables.map(t => (
                                        <SelectItem key={t.id} value={t.id.toString()}>
                                            Table {t.table_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Flag Filters */}
                    {showFilters && (
                        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border">
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={showPopular} 
                                    onCheckedChange={(checked) => setShowPopular(checked as boolean)}
                                    id="popular-filter"
                                    className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                                />
                                <Label htmlFor="popular-filter" className="flex items-center gap-1 cursor-pointer">
                                    <Star size={14} className="text-yellow-500" />
                                    <span className="text-sm font-medium">Popular</span>
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={showSignature} 
                                    onCheckedChange={(checked) => setShowSignature(checked as boolean)}
                                    id="signature-filter"
                                    className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                                />
                                <Label htmlFor="signature-filter" className="flex items-center gap-1 cursor-pointer">
                                    <Award size={14} className="text-red-500" />
                                    <span className="text-sm font-medium">Signature</span>
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={showChefPick} 
                                    onCheckedChange={(checked) => setShowChefPick(checked as boolean)}
                                    id="chef-filter"
                                    className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                />
                                <Label htmlFor="chef-filter" className="flex items-center gap-1 cursor-pointer">
                                    <ChefHat size={14} className="text-green-500" />
                                    <span className="text-sm font-medium">Chef's Pick</span>
                                </Label>
                            </div>
                            {(showPopular || showSignature || showChefPick) && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                        setShowPopular(false);
                                        setShowSignature(false);
                                        setShowChefPick(false);
                                    }}
                                    className="ml-auto"
                                >
                                    <X size={14} className="mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    )}

                    <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                        <TabsList className="bg-transparent h-10 justify-start overflow-x-auto no-scrollbar">
                            <TabsTrigger 
                                value="all" 
                                className="font-bold uppercase tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                            >
                                ALL
                            </TabsTrigger>
                            {categories.map(cat => (
                                <TabsTrigger 
                                    key={cat.id} 
                                    value={cat.id.toString()} 
                                    className="font-bold uppercase tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >
                                    {cat.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </Card>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-10">
                    {loading ? (
                         Array(8).fill(0).map((_, i) => (
                            <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-xl" />
                         ))
                    ) : filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onConfigure={openProductConfig}
                            />
                        ))
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                            <Search size={48} />
                            <p className="mt-4 font-bold">No products found</p>
                            <p className="text-sm">Try changing your filters or search term</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cart Sidebar */}
            <div className="w-[450px] flex flex-col gap-4">
                <Card className="flex-1 flex flex-col border-none shadow-xl overflow-hidden bg-white">
                    <div className="p-4 border-b flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black flex items-center gap-2 tracking-tighter uppercase">
                            <ShoppingCart size={20}/> Cart ({cart.length})
                        </h3>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                if (cart.length > 0) {
                                    setCart([]);
                                    toast({
                                        title: "Cart Cleared",
                                        description: "All items have been removed from cart."
                                    });
                                }
                            }} 
                            className="text-slate-400 hover:text-red-500"
                            disabled={cart.length === 0}
                        >
                            <Trash2 size={16}/>
                        </Button>
                    </div>
                    
                    <div className="p-3 grid grid-cols-2 gap-2">
                        <Button 
                            variant={orderType === 'walk_in' ? 'default' : 'outline'} 
                            className="font-bold uppercase tracking-tighter h-11" 
                            onClick={() => {
                                setOrderType('walk_in'); 
                                setSelectedPartner(null);
                            }}
                        >
                            <User className="mr-2 h-4 w-4" /> Walk-in
                        </Button>
                        <Button 
                            variant={orderType === 'delivery' ? 'default' : 'outline'} 
                            className="font-bold uppercase tracking-tighter h-11" 
                            onClick={() => setOrderType('delivery')}
                        >
                            <Bike className="mr-2 h-4 w-4" /> Delivery
                        </Button>
                    </div>

                    {orderType === 'delivery' && (
                        <div className="p-4 border-y bg-primary/5">
                            <Label className="text-[10px] font-black uppercase text-primary mb-2 block">
                                Delivery Partner
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {partners.map(p => (
                                    <Badge 
                                        key={p.id} 
                                        variant={selectedPartner?.id === p.id ? "default" : "outline"}
                                        className="cursor-pointer px-3 py-1 font-bold uppercase tracking-tighter"
                                        onClick={() => setSelectedPartner(p)}
                                    >
                                        {p.name} {Number(p.is_discount_active) === 1 ? ` (-${p.discount_percentage}%)` : ''}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 text-slate-400 py-20">
                                <ShoppingCart size={48} />
                                <p className="font-black uppercase text-xs mt-2">Empty Cart</p>
                                <p className="text-xs mt-1 text-slate-300">Add items from the menu</p>
                            </div>
                        ) : cart.map((item, index) => (
                            <CartItem
                                key={index}
                                item={item}
                                index={index}
                                onUpdateQuantity={(id, sizeId, modifiers, change) => 
                                    updateQty(id, sizeId, modifiers, change)
                                }
                                onRemove={(id, sizeId, modifiers) => 
                                    removeFromCart(id, sizeId, modifiers)
                                }
                                onUpdateRemark={updateCartItemRemark}
                            />
                        ))}
                    </div>

                    <div className="p-4 border-t bg-slate-50/50 space-y-4">
                        <div>
                            <Label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">
                                Manual Discount
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-400">Amount ($)</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-400">$</span>
                                        <Input 
                                            type="number" 
                                            min="0" 
                                            step="0.01"
                                            className="h-8 text-right font-bold" 
                                            value={manualDiscountAmount} 
                                            onChange={(e) => {
                                                setManualDiscountAmount(e.target.value);
                                                if (e.target.value) setManualDiscountPercentage('0');
                                            }} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[9px] text-slate-400">Percentage (%)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input 
                                            type="number" 
                                            min="0" 
                                            max="100" 
                                            step="0.1"
                                            className="h-8 text-right font-bold" 
                                            value={manualDiscountPercentage} 
                                            onChange={(e) => {
                                                setManualDiscountPercentage(e.target.value);
                                                if (e.target.value) setManualDiscountAmount('0');
                                            }} 
                                        />
                                        <span className="font-bold text-slate-400">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900 text-white rounded-t-3xl space-y-3 shadow-2xl">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            
                            {itemDiscountTotal > 0 && (
                                <div className="flex justify-between text-[10px] font-bold text-green-400">
                                    <span>Item Discount</span>
                                    <span>-${itemDiscountTotal.toFixed(2)}</span>
                                </div>
                            )}
                            
                            {orderLevelDiscount > 0 && (
                                <div className="flex justify-between text-[10px] font-bold text-blue-400">
                                    <span>Order Discount</span>
                                    <span>-${orderLevelDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            
                            {deliveryPartnerDiscount > 0 && (
                                <div className="flex justify-between text-[10px] font-bold text-yellow-400">
                                    <span>Partner Discount</span>
                                    <span>-${deliveryPartnerDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-800">
                                <span>Total Discount</span>
                                <span className="text-red-400">-${totalDiscount.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex justify-between text-lg font-black pt-2 border-t border-slate-800">
                                <span>TOTAL</span>
                                <span className="text-primary underline decoration-primary decoration-4 underline-offset-4">
                                    ${(subtotal - totalDiscount).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        
                        <p className="text-[10px] text-slate-400 text-center pt-2">
                            Tax will be calculated on final amount
                        </p>
                        
                        <Button 
                            className="w-full h-14 text-lg font-black mt-4 uppercase tracking-tighter shadow-lg hover:shadow-xl transition-all" 
                            disabled={cart.length === 0 || checkoutLoading} 
                            onClick={handleCheckout}
                        >
                            {checkoutLoading ? (
                                <>
                                    <Loader2 className="mr-2 animate-spin" /> PROCESSING...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-2" /> COMPLETE ORDER
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Product Configuration Modal */}
            <ProductConfigModal
                product={configuringProduct}
                categories={categories}
                onPresetChange={handlePresetChange}
                selectedSize={selectedSize}
                selectedModifiers={selectedModifiers}
                selectedPresets={selectedPresets}
                remark={remark}
                onClose={() => {
                    setConfiguringProduct(null);
                    setSelectedSize(null);
                    setSelectedModifiers({});
                    setSelectedPresets([]);
                    setRemark('');
                }}
                onSizeChange={setSelectedSize}
                onModifierToggle={toggleModifier}
                onRemarkChange={setRemark}
                onAddToCart={addToCart}
            />
        </div>
    );
};

export default POSPage;