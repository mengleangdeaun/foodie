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
    Minus, MessageSquare, ChevronLeft, ChevronRight, Hash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// Import components
import { ProductCard } from './components/pos/ProductCard';
import { CartItem } from './components/pos/CartItem';
import { ProductConfigModal } from './components/pos/ProductConfigModal';
import { motion } from "framer-motion";

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
  selected_presets: SelectedPreset[];
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
    const tabsRef = useRef<HTMLDivElement>(null);
    const [tabsScrollPosition, setTabsScrollPosition] = useState(0);
    
    // Data States
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [partners, setPartners] = useState<any[]>([]);
    const [branchInfo, setBranchInfo] = useState<any>(null);
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
            ]);
            
            const [posRes, partnerRes, tableRes] = results;

            if (posRes.status === 'fulfilled') {
                const data = posRes.value.data.data || posRes.value.data;
                setCategories(data.categories || []);
                setProducts(data.products || []);
                setBranchInfo(data.branch || null);
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

    useEffect(() => {
    if (tabsRef.current && activeCategory) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
            const activeElement = document.querySelector(`[data-value="${activeCategory}"]`);
            if (activeElement && tabsRef.current) {
                const container = tabsRef.current;
                const element = activeElement as HTMLElement;
                const containerRect = container.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                
                if (elementRect.left < containerRect.left || elementRect.right > containerRect.right) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center'
                    });
                }
            }
        }, 50);
    }
}, [activeCategory]);

    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                 product.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'all' || product.category_id?.toString() === activeCategory;
            
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
        name?: string
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
                        name: name || updated[existingIndex].name,
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
                        name: name || `Option ${presetId}`,
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

        let basePrice = configuringProduct.final_price;
        let originalPrice = configuringProduct.original_price;
        let modifiersTotal = 0;

        if (selectedSize) {
            basePrice = selectedSize.final_price;
            originalPrice = selectedSize.base_price;
        }

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
            selected_presets: selectedPresets,
            modifier_groups: configuringProduct.modifier_groups,
            sizes: configuringProduct.sizes,
            is_popular: configuringProduct.is_popular,
            is_signature: configuringProduct.is_signature,
            is_chef_recommendation: configuringProduct.is_chef_recommendation
        };

        setCart(prev => {
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
                    return { 
                        ...prev, 
                        [groupId]: current.filter(m => m.id !== modifier.id) 
                    };
                } else {
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

    const round2 = (value: number) =>
        Math.round((value + Number.EPSILON) * 100) / 100;

    const subtotal = useMemo(() => {
        const value = cart.reduce(
            (acc, item) => acc + item.original_price * item.quantity,
            0
        );
        return round2(value);
    }, [cart]);

    const modifiersTotal = useMemo(() => {
        const value = cart.reduce((total, item) => {
            const itemModifiers = Object.values(item.selected_modifiers || {})
                .flat()
                .reduce((sum, mod) => sum + mod.price, 0);

            return total + itemModifiers * item.quantity;
        }, 0);

        return round2(value);
    }, [cart]);

    const deliveryPartnerDiscount = useMemo(() => {
        if (
            orderType === 'delivery' &&
            selectedPartner &&
            Number(selectedPartner.is_discount_active) === 1
        ) {
            const percent = parseFloat(selectedPartner.discount_percentage) || 0;
            return percent > 0
                ? round2(subtotal * (percent / 100))
                : 0;
        }

        return 0;
    }, [orderType, selectedPartner, subtotal]);

    const orderLevelDiscount = useMemo(() => {
        if (manualDiscountAmount && parseFloat(manualDiscountAmount) > 0) {
            return round2(parseFloat(manualDiscountAmount));
        }

        if (manualDiscountPercentage && parseFloat(manualDiscountPercentage) > 0) {
            return round2(
                subtotal * (parseFloat(manualDiscountPercentage) / 100)
            );
        }

        return 0;
    }, [manualDiscountAmount, manualDiscountPercentage, subtotal]);

    const itemDiscountTotal = useMemo(() => {
        const value = cart.reduce((total, item) => {
            if (!item.has_discount || item.discount_percentage <= 0) return total;

            const price = item.selected_size?.base_price ?? item.original_price;

            return (
                total +
                price * (item.discount_percentage / 100) * item.quantity
            );
        }, 0);

        return round2(value);
    }, [cart]);

    const totalDiscount = useMemo(() => {
        return round2(
            itemDiscountTotal + orderLevelDiscount + deliveryPartnerDiscount
        );
    }, [itemDiscountTotal, orderLevelDiscount, deliveryPartnerDiscount]);

    const taxableAmount = useMemo(() => {
        return round2(
            Math.max(0, subtotal + modifiersTotal - totalDiscount)
        );
    }, [subtotal, modifiersTotal, totalDiscount]);

    const taxName = useMemo(() => branchInfo?.tax_name || 'Tax', [branchInfo]);
    const taxRate = useMemo(() => parseFloat(branchInfo?.tax_rate || 0), [branchInfo]);
    const taxIsActive = useMemo(() => !!branchInfo?.tax_is_active, [branchInfo]);

    const taxAmount = useMemo(() => {
        if (!taxIsActive || taxRate <= 0) return 0;
        return round2(taxableAmount * (taxRate / 100));
    }, [taxableAmount, taxRate, taxIsActive]);

    const finalTotal = useMemo(() => {
        return round2(taxableAmount + taxAmount);
    }, [taxableAmount, taxAmount]);

const scrollTabs = (direction: 'left' | 'right') => {
    if (!tabsRef.current) return;
    
    const scrollAmount = 150; // Reduced for smoother scrolling
    const container = tabsRef.current;
    const newPosition = direction === 'left' 
        ? Math.max(0, container.scrollLeft - scrollAmount)
        : container.scrollLeft + scrollAmount;
    
    container.scrollTo({ 
        left: newPosition, 
        behavior: 'smooth' 
    });
};

    const handleCheckout = async () => {
        if (cart.length === 0 || checkoutLoading) return;
        setCheckoutLoading(true);
        
        try {
            const items = cart.map(item => {
                const modifiersArray: number[] = [];
                Object.values(item.selected_modifiers).forEach(modifierList => {
                    modifierList.forEach(modifier => {
                        modifiersArray.push(modifier.id);
                    });
                });

                const presetRemark = item.selected_presets.map(preset => {
                    const label = (preset as any).name || (preset as any).label || `Option ${preset.presetId}`;
                    
                    let value = '';
                    if (preset.selectedOptions && preset.selectedOptions.length > 0) {
                        value = preset.selectedOptions.join(', ');
                    } else if (preset.selectedOption) {
                        value = preset.selectedOption;
                    } else if (preset.customText) {
                        value = preset.customText;
                    }

                    return value ? `[${label}: ${value}]` : '';
                }).filter(Boolean).join(' ');

                const finalRemark = `${presetRemark} ${item.remark || ''}`.trim();

                return {
                    product_id: item.id,
                    quantity: item.quantity,
                    remark: finalRemark,
                    selected_size: item.selected_size ? {
                        id: item.selected_size.id,
                        name: item.selected_size.name
                    } : null,
                    selected_modifiers: modifiersArray
                };
            });

            const orderTypeForBackend = orderType === 'walk_in' && (!selectedTable || selectedTable === 'none')
                ? 'takeaway'
                : orderType;

            const requestData: any = {
                branch_id: user?.branch_id,
                order_type: orderTypeForBackend,
                delivery_partner_id: selectedPartner?.id || null,
                table_id: selectedTable !== 'none' ? selectedTable : null,
                items,
                order_discount_amount: orderLevelDiscount > 0 ? orderLevelDiscount : null,
                order_discount_percentage: manualDiscountPercentage && parseFloat(manualDiscountPercentage) > 0 ? 
                    parseFloat(manualDiscountPercentage) : null,
                delivery_partner_discount: deliveryPartnerDiscount
            };

            const response = await api.post('/admin/pos/order', requestData);

            setManualDiscountAmount('0');
            setManualDiscountPercentage('0');
            setCart([]);
            setSelectedTable('none');
            setSelectedPartner(null);
            
            toast({ 
                title: "Order Successful!", 
                description: `Order #${response.data.order_code} has been placed. Total: $${response.data.total}`,
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
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-background/50">
            {/* LEFT: Menu Selection */}
            <div className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
                {/* Header Card */}
<Card className="p-4 border-border/50 shadow-sm dark:shadow-md dark:bg-card/95">
    {/* Header Section */}
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Left Section: Search and Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md w-full">
                <Search 
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" 
                    size={18} 
                    strokeWidth={1.5}
                />
                <Input 
                    placeholder="Search menu items..." 
                    className="pl-10 h-11 border-border/60 dark:border-border/80 bg-background focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Filters Button */}
            <Button 
                variant={showFilters ? "default" : "outline"}
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 border-border/60 dark:border-border/80 hover:border-primary/50 transition-colors"
            >
                <Filter size={16} />
                Filters
                {(showPopular || showSignature || showChefPick) && (
                    <Badge 
                        variant="secondary" 
                        className="ml-1 h-5 w-5 p-0 bg-primary text-primary-foreground flex items-center justify-center"
                    >
                        {(showPopular ? 1 : 0) + (showSignature ? 1 : 0) + (showChefPick ? 1 : 0)}
                    </Badge>
                )}
            </Button>
        </div>

        {/* Table Selector - FIXED: Removed empty string value */}
        {orderType === 'walk_in' && tables.length > 0 && (
            <div className="w-full md:w-auto">
                <Select onValueChange={setSelectedTable} value={selectedTable || "none"}>
                    <SelectTrigger className="w-full md:w-[180px] h-11 border-border/60 dark:border-border/80 font-semibold bg-background">
                        <SelectValue placeholder="Select Table" />
                    </SelectTrigger>
                    <SelectContent className="border-border/60 dark:border-border/80">
                        <SelectItem value="none">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-2 h-2 rounded-full bg-muted" />
                                <span>No Table</span>
                            </div>
                        </SelectItem>
                        {tables.map(t => (
                            <SelectItem 
                                key={t.id} 
                                value={t.id.toString()}
                                className="focus:bg-accent focus:text-accent-foreground"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <span>Table {t.table_number}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
    </div>

    {/* Filters Panel */}
    {showFilters && (
        <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
        >
            <div className="mt-4 p-3 bg-accent/50 dark:bg-accent/30 rounded-lg border border-border/40 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <Checkbox 
                        checked={showPopular} 
                        onCheckedChange={(checked) => setShowPopular(checked as boolean)}
                        id="popular-filter"
                        className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 dark:data-[state=checked]:bg-amber-600"
                    />
                    <Label htmlFor="popular-filter" className="flex items-center gap-2 cursor-pointer hover:text-foreground/80 transition-colors">
                        <Star size={14} className="text-amber-500 dark:text-amber-400" fill="currentColor" />
                        <span className="text-sm font-medium">Popular</span>
                    </Label>
                </div>
                
                <div className="flex items-center gap-2">
                    <Checkbox 
                        checked={showSignature} 
                        onCheckedChange={(checked) => setShowSignature(checked as boolean)}
                        id="signature-filter"
                        className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600 dark:data-[state=checked]:bg-rose-700"
                    />
                    <Label htmlFor="signature-filter" className="flex items-center gap-2 cursor-pointer hover:text-foreground/80 transition-colors">
                        <Award size={14} className="text-rose-600 dark:text-rose-400" />
                        <span className="text-sm font-medium">Signature</span>
                    </Label>
                </div>
                
                <div className="flex items-center gap-2">
                    <Checkbox 
                        checked={showChefPick} 
                        onCheckedChange={(checked) => setShowChefPick(checked as boolean)}
                        id="chef-filter"
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 dark:data-[state=checked]:bg-emerald-700"
                    />
                    <Label htmlFor="chef-filter" className="flex items-center gap-2 cursor-pointer hover:text-foreground/80 transition-colors">
                        <ChefHat size={14} className="text-emerald-600 dark:text-emerald-400" />
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
                        className="ml-auto text-muted-foreground hover:text-foreground hover:bg-transparent"
                    >
                        <X size={14} className="mr-1.5" />
                        Clear filters
                    </Button>
                )}
            </div>
        </motion.div>
    )}
</Card>

                
{/* Category Tabs - Enhanced Scrollable Version */}
<Card className="p-2 border-border/50 shadow-sm dark:shadow-md">
    <div className="flex items-center gap-1">
        {/* Left Scroll Button */}
        <Button
            variant="ghost"
            size="icon"
            onClick={() => scrollTabs('left')}
            className="h-8 w-8 shrink-0 hover:bg-accent/50"
            disabled={tabsScrollPosition === 0}
        >
            <ChevronLeft size={16} />
        </Button>
        
        {/* Scrollable Tabs Area */}
        <div className="flex-1 overflow-hidden">
            <Tabs 
                value={activeCategory} 
                onValueChange={setActiveCategory} 
                className="w-full"
            >
                <ScrollArea 
                    className="w-full whitespace-nowrap"
                    viewportRef={tabsRef}
                    onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        setTabsScrollPosition(target.scrollLeft);
                    }}
                >
                    <TabsList 
                        className="bg-accent/30 dark:bg-accent/20 h-9 inline-flex p-1 gap-1"
                    >
                        <TabsTrigger 
                            value="all" 
                            className="h-7 px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:shadow data-[state=active]:text-foreground font-medium text-xs rounded-sm flex-shrink-0 transition-all hover:bg-accent/50"
                        >
                            All Items
                            {activeCategory === 'all' && cart.length > 0 && (
                                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-[10px]">
                                    {filteredProducts.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        {categories.map(cat => {
                            const categoryProductCount = filteredProducts.filter(p => 
                                p.category_id === cat.id
                            ).length;
                            
                            return (
                                <TabsTrigger 
                                    key={cat.id} 
                                    value={cat.id.toString()} 
                                    className=" px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm dark:data-[state=active]:shadow data-[state=active]:text-foreground font-medium text-xs rounded-sm flex-shrink-0 transition-all hover:bg-accent/50"
                                >
                                    {cat.name}
                                    {activeCategory === cat.id.toString() && categoryProductCount > 0 && (
                                        <Badge variant="secondary" className="ml-1 flex items-center justify-center h-4 w-4 p-0 text-[10px]">
                                            {categoryProductCount}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </ScrollArea>
            </Tabs>
        </div>
        
        {/* Right Scroll Button */}
        <Button
            variant="ghost"
            size="icon"
            onClick={() => scrollTabs('right')}
            className="h-8 w-8 shrink-0 hover:bg-accent/50"
        >
            <ChevronRight size={16} />
        </Button>
    </div>
    
    {/* Category Stats */}
    <div className="flex items-center justify-between mt-2 px-1">
        <div className="text-xs text-muted-foreground">
            {activeCategory === 'all' ? (
                <>
                    <span className="font-medium">{filteredProducts.length}</span> of <span className="font-medium">{products.length}</span> items
                </>
            ) : (
                <>
                    <span className="font-medium">
                        {filteredProducts.filter(p => p.category_id.toString() === activeCategory).length}
                    </span> items in this category
                </>
            )}
        </div>
        <Button
            variant="ghost"
            size="sm"
            onClick={() => {
                const currentIndex = categories.findIndex(cat => cat.id.toString() === activeCategory);
                if (currentIndex !== -1 && currentIndex < categories.length - 1) {
                    const nextCategory = categories[currentIndex + 1].id.toString();
                    setActiveCategory(nextCategory);
                    
                    // Scroll to show the active tab
                    setTimeout(() => {
                        const activeElement = document.querySelector(`[data-value="${nextCategory}"]`);
                        if (activeElement && tabsRef.current) {
                            activeElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'nearest',
                                inline: 'center'
                            });
                        }
                    }, 100);
                } else if (activeCategory !== 'all') {
                    setActiveCategory('all');
                }
            }}
            className="text-xs h-6 text-muted-foreground hover:text-foreground"
        >
            Next Category
            <ChevronRight size={12} className="ml-1" />
        </Button>
    </div>
</Card>

                {/* Product Grid */}
                <div className="flex-1 overflow-hidden">
                    <div className="h-full overflow-y-auto pr-2 pb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                            {loading ? (
                                Array.from({ length: 12 }).map((_, i) => (
                                    <Card key={i} className="overflow-hidden border-border/40 animate-pulse">
                                        <div className="aspect-square bg-muted dark:bg-muted/60" />
                                        <div className="p-3 space-y-2">
                                            <div className="h-4 bg-muted dark:bg-muted/60 rounded w-3/4" />
                                            <div className="h-3 bg-muted dark:bg-muted/60 rounded w-1/2" />
                                            <div className="h-6 bg-muted dark:bg-muted/60 rounded w-1/3" />
                                        </div>
                                    </Card>
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
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center bg-background/50 dark:bg-background/30 rounded-xl border border-dashed border-border">
                                    <div className="w-16 h-16 rounded-full bg-accent dark:bg-accent/40 flex items-center justify-center mb-4">
                                        <Search size={32} className="text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No products found</h3>
                                    <p className="text-muted-foreground max-w-md mb-4">
                                        Try adjusting your search term or filters to find what you're looking for.
                                    </p>
                                    <Button 
                                        variant="outline" 
                                        className="border-border/60"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setShowPopular(false);
                                            setShowSignature(false);
                                            setShowChefPick(false);
                                        }}
                                    >
                                        Clear all filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: Cart Sidebar */}
            <div className="w-[420px] xl:w-[480px] flex flex-col gap-4 p-4 border-l border-border/40 bg-background">
                <Card className="flex-1 flex flex-col border-border/50 shadow-sm dark:shadow-md overflow-hidden">
                    {/* Cart Header */}
                    <div className="p-4 border-b border-border/40 flex justify-between items-center bg-card">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <ShoppingCart size={20} className="text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold">Order Cart</h3>
                                <p className="text-sm text-muted-foreground">{cart.length} item{cart.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
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
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            disabled={cart.length === 0}
                        >
                            <Trash2 size={16} />
                            <span className="ml-2 hidden sm:inline">Clear</span>
                        </Button>
                    </div>
                    
                    {/* Order Type */}
                    <div className="p-3 grid grid-cols-2 gap-2">
                        <Button 
                            variant={orderType === 'walk_in' ? 'default' : 'outline'} 
                            className="h-11 font-medium" 
                            onClick={() => {
                                setOrderType('walk_in'); 
                                setSelectedPartner(null);
                            }}
                        >
                            <User className="mr-2 h-4 w-4" /> Walk-in
                        </Button>
                        <Button 
                            variant={orderType === 'delivery' ? 'default' : 'outline'} 
                            className="h-11 font-medium" 
                            onClick={() => setOrderType('delivery')}
                        >
                            <Bike className="mr-2 h-4 w-4" /> Delivery
                        </Button>
                    </div>

                    {/* Delivery Partners */}
                    {orderType === 'delivery' && (
                        <div className="px-4 pb-3">
                            <Label className="text-sm font-medium mb-2 block">
                               Select a Delivery
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {partners.map(p => (
                                    <Badge 
                                        key={p.id} 
                                        variant={selectedPartner?.id === p.id ? "default" : "outline"}
                                        className="cursor-pointer px-3 py-1.5 font-medium hover:bg-primary/10 transition-colors"
                                        onClick={() => setSelectedPartner(p)}
                                    >
                                        {p.name}
                                        {Number(p.is_discount_active) === 1 && (
                                            <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded">
                                                -{p.discount_percentage}%
                                            </span>
                                        )}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                                <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                                    <ShoppingCart size={32} className="opacity-40" />
                                </div>
                                <p className="font-medium mb-1">Your cart is empty</p>
                                <p className="text-sm">Add items from the menu to get started</p>
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

                    {/* Discount Inputs */}
                    <div className="p-4 border-t border-border/40 space-y-4">
                        <div>
                            <Label className="text-sm font-medium mb-3 block">Order Discount</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Amount ($)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                        <Input 
                                            type="number" 
                                            min="0" 
                                            step="0.01"
                                            className="pl-8 h-10" 
                                            value={manualDiscountAmount} 
                                            onChange={(e) => {
                                                setManualDiscountAmount(e.target.value);
                                                if (e.target.value) setManualDiscountPercentage('0');
                                            }} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Percentage (%)</Label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            min="0" 
                                            max="100" 
                                            step="0.1"
                                            className="pr-8 h-10 text-right" 
                                            value={manualDiscountPercentage} 
                                            onChange={(e) => {
                                                setManualDiscountPercentage(e.target.value);
                                                if (e.target.value) setManualDiscountAmount('0');
                                            }} 
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="p-6 bg-primary/5 dark:bg-primary/10 border-t border-border/40 space-y-3">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">${subtotal.toFixed(2)}</span>
                            </div>
                            
                            {modifiersTotal > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Add-ons</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">+${modifiersTotal.toFixed(2)}</span>
                                </div>
                            )}

                            {itemDiscountTotal > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Item Discount</span>
                                    <span className="font-medium text-green-600 dark:text-green-400">-${itemDiscountTotal.toFixed(2)}</span>
                                </div>
                            )}
                            
                            {orderLevelDiscount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Order Discount</span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">-${orderLevelDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            
                            {deliveryPartnerDiscount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Partner Discount</span>
                                    <span className="font-medium text-amber-600 dark:text-amber-400">-${deliveryPartnerDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-sm font-medium pt-2 border-t border-border/40">
                                <span>Total Discount</span>
                                <span className="text-red-600 dark:text-red-400">-${totalDiscount.toFixed(2)}</span>
                            </div>

                            {taxIsActive && taxAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{taxName} ({taxRate}%)</span>
                                    <span className="font-medium">${taxAmount.toFixed(2)}</span>
                                </div>
                            )}
                            
                            <div className="flex justify-between text-lg font-semibold pt-3 border-t border-border/40">
                                <span>TOTAL</span>
                                <span className="text-primary">${finalTotal.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <Button 
                            className="w-full h-12 text-base font-semibold mt-4" 
                            disabled={cart.length === 0 || checkoutLoading} 
                            onClick={handleCheckout}
                        >
                            {checkoutLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Complete Order
                                </>
                            )}
                        </Button>
                        
                        <p className="text-xs text-center text-muted-foreground pt-2">
                            {taxIsActive ? `Tax (${taxRate}%) included` : 'No tax applied'}
                        </p>
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