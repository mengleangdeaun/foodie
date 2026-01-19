import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/util/api';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Search, Plus, MessageSquare, Loader2, 
  Tag, Info, ChevronRight, MapPin, Star, 
  Clock, History, X, ShoppingBag, Moon, 
  Sun, User, Settings, Home, Filter, 
  Heart, ChevronLeft, Shield, Phone, 
  Mail, Globe, CreditCard, Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Lottie from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Import components
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import CartItem from './components/CartItem';
import ConfigurationModal from './components/ConfigurationModal';
import OrderStatusOverlay from './components/OrderStatusOverlay';
import CartSheet from './components/CartSheet';
import HistorySheet from './components/HistorySheet';
import SettingsSheet from './components/SettingSheet';

// Import animations
import pendingAnim from '@/assets/css/animations/pending.json';
import cookingAnim from '@/assets/css/animations/cooking.json';
import readyAnim from '@/assets/css/animations/ready.json';
import confirmedAnim from '@/assets/css/animations/confirmed.json';

const ANIMATIONS = {
  pending: pendingAnim,
  cooking: cookingAnim,
  ready: readyAnim,
  confirmed: confirmedAnim,
};

const CustomerMenu = () => {
  const { token } = useParams();
  const { toast } = useToast();

  // State
  const [configuringProduct, setConfiguringProduct] = useState<any>(null);
  // Add this with other state declarations
  const [selectedRemarksForConfiguringProduct, setSelectedRemarksForConfiguringProduct] = useState<Record<string, string>>({});
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);
  const [customRemark, setCustomRemark] = useState('');
  
  const [branch, setBranch] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [activeStatus, setActiveStatus] = useState<string>('idle');
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [collectedOrders, setCollectedOrders] = useState<any[]>([]);
  
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [originalSubtotals, setOriginalSubtotals] = useState<Record<string, number>>({});
  const [discountAmounts, setDiscountAmounts] = useState<Record<string, number>>({});
  const headerRef = useRef<HTMLDivElement>(null);

const [darkMode, setDarkMode] = useState(() => {
  if (typeof window !== 'undefined') {
    // Default to light mode (false)
    const saved = localStorage.getItem('customerDarkMode');
    if (saved !== null) {
      // If user has explicitly set a preference, use it
      return saved === 'true';
    }
    // Default to light mode
    return false;
  }
  return false; // Default to light mode
});


  // Effects
  useEffect(() => {
    fetchMenu();
    const savedHistory = JSON.parse(localStorage.getItem('order_history') || '[]');
    setOrderHistory(savedHistory);
  }, [token]);

  useEffect(() => {
    if (window.Echo && activeOrderId) {
      window.Echo.channel(`order.${activeOrderId}`)
        .listen('.order.updated', (data: any) => {
          setActiveStatus(data.status);
          updateLocalHistory(activeOrderId, data.status);
        });
    }
  }, [activeOrderId]);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
  }, []);

  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setShowHeader(true);
        setLastScrollY(currentScrollY);
        return;
      }

      if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 30) {
        setShowHeader(false);
      } else if (lastScrollY > currentScrollY && lastScrollY - currentScrollY > 10) {
        setShowHeader(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlHeader, { passive: true });
    return () => window.removeEventListener('scroll', controlHeader);
  }, [lastScrollY]);

useEffect(() => {
  if (darkMode) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('customerDarkMode', 'true');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('customerDarkMode', 'false');
  }
}, [darkMode]);

  // Functions
  const fetchMenu = async () => {
    try {
      const interval = setInterval(() => setProgress(prev => prev < 90 ? prev + 10 : prev), 100);
      const res = await api.get(`/public/menu/scan/${token}`);
      clearInterval(interval);
      setProgress(100);
      
      setBranch(res.data.branch);
      setProducts(res.data.products || []);
      setCategories(res.data.categories || []);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const updateLocalHistory = (id: number, status: string) => {
    setOrderHistory(prev => {
      const updated = prev.map(o => o.id === id ? { ...o, status } : o);
      localStorage.setItem('order_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleProductClick = (product: any) => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;
    
    if (hasSizes || hasModifiers) {
      setConfiguringProduct(product);
      setSelectedSize(null);
      setSelectedModifiers([]);
      setCustomRemark('');
    } else {
      addToCart(product);
    }
  };

const addToCart = (product: any, size: any = null, modifiers: any[] = [], remark: string = '', unitPrice?: number, remarkPresets?: Record<string, string>) => {
  setCart(prev => {
    // Generate a unique key for this cart item configuration
    const modifiersKey = JSON.stringify(modifiers.map(m => m.id).sort());
    const configKey = `${product.id}-${size?.id || 'no-size'}-${modifiersKey}`;
    
    // Check if the exact same configuration already exists
    const existingIndex = prev.findIndex(item => 
      item.configurationKey === configKey
    );
    
    if (existingIndex !== -1) {
      // Update quantity if same configuration exists
      const updated = [...prev];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1
      };
      return updated;
    }
    
    // IMPORTANT: Ensure we have the complete size object with pricing
    let completeSize = size;
    
    // If we have a size but it doesn't have complete pricing info, 
    // try to get it from the product's sizes array
    if (size && product.sizes && product.sizes.length > 0) {
      // Find the matching size in the product's sizes array
      const matchingSize = product.sizes.find((s: any) => s.id === size.id);
      if (matchingSize) {
        completeSize = {
          ...size,
          // Ensure we have all pricing fields from the product's size object
          base_price: matchingSize.base_price,
          final_price: matchingSize.final_price,
          discount_percentage: matchingSize.discount_percentage,
          has_active_discount: matchingSize.has_active_discount,
          is_available: matchingSize.is_available,
          price_source: matchingSize.price_source,
          discount_source: matchingSize.discount_source,
          has_branch_product_size_record: matchingSize.has_branch_product_size_record
        };
      }
    }
    
    // Calculate unit price if not provided from ConfigurationModal
    let calculatedUnitPrice = unitPrice;
    if (calculatedUnitPrice === undefined) {
      let basePrice = 0;
      if (size) {
        basePrice = formatPrice(size.final_price || size.base_price);
      } else if (product.pricing?.effective_price !== undefined) {
        basePrice = formatPrice(product.pricing.effective_price);
      } else {
        basePrice = formatPrice(product.pricing?.branch_product_price || product.pricing?.product_base_price || 0);
      }
      
      const modifierPrice = modifiers.reduce((total: number, mod: any) => 
        total + formatPrice(mod.price), 0);
      
      calculatedUnitPrice = basePrice + modifierPrice;
    }
    
    // Parse remark to separate preset remarks and custom remark
    let selectedRemarks = {};
    let customRemark = remark;
    
    // Extract preset remarks from the combined remark string
    const presetRegex = /\[([^:]+):\s*([^\]]+)\]/g;
    let match;
    while ((match = presetRegex.exec(remark)) !== null) {
      selectedRemarks = {
        ...selectedRemarks,
        [match[1]]: match[2]
      };
      // Remove preset remark from custom remark
      customRemark = customRemark.replace(match[0], '').trim();
    }
    
    // Create the new cart item with unitPrice
    const newCartItem = {
      ...product,
      quantity: 1,
      remark: customRemark,
      selectedRemarks: selectedRemarks,
      selectedSize: completeSize,
      selectedModifiers: modifiers,
      selectedModifierIds: modifiers.map(m => m.id),
      customRemark: customRemark,
      configurationKey: configKey,
      unitPrice: calculatedUnitPrice, // Store the calculated unit price
      smartRemarkLabel: Object.entries(selectedRemarks)
        .map(([key, value]) => `[${key}: ${value}]`)
        .join(' ')
    };
    
    return [...prev, newCartItem];
  });
  
  setConfiguringProduct(null);
  setSelectedSize(null);
  setSelectedModifiers([]);
  setCustomRemark('');
  setSelectedRemarksForConfiguringProduct({});
  
  toast({
    title: "Added to cart",
    description: product.name,
    duration: 1500,
    className: "bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100"
  });
};




const updateQuantity = (configurationKey: string, delta: number) => {
  setCart(prev => prev.map(item => 
    item.configurationKey === configurationKey 
      ? { ...item, quantity: Math.max(1, item.quantity + delta) }
      : item
  ));
};

const removeFromCart = (configurationKey: string) => {
  setCart(prev => prev.filter(item => item.configurationKey !== configurationKey));
};

const updateRemark = (configurationKey: string, remark: string) => {
  setCart(prev => prev.map(item => 
    item.configurationKey === configurationKey ? { ...item, remark } : item
  ));
};

const toggleSmartRemark = (configurationKey: string, presetName: string, option: string) => {
  setCart(prev => prev.map(item => {
    if (item.configurationKey === configurationKey) {
      const newSelections = { ...(item.selectedRemarks || {}), [presetName]: option };
      const remarkStr = Object.entries(newSelections).map(([k, v]) => `[${k}: ${v}]`).join(' ');
      return { ...item, selectedRemarks: newSelections, smartRemarkLabel: remarkStr };
    }
    return item;
  }));
};

const handlePlaceOrder = async () => {
  setActiveStatus('submitting');
  try {
    const orderItems = cart.map(item => {
      // Calculate base price (size or product price) - for reference only
      let basePrice = 0;
      if (item.selectedSize) {
        basePrice = formatPrice(item.selectedSize.final_price || item.selectedSize.base_price);
      } else if (item.pricing?.effective_price !== undefined) {
        basePrice = formatPrice(item.pricing.effective_price);
      } else {
        basePrice = formatPrice(item.pricing?.branch_product_price || item.pricing?.product_base_price || 0);
      }
      
      // Calculate modifiers price
      const modifiersPrice = item.selectedModifiers?.reduce((total: number, mod: any) => 
        total + formatPrice(mod.price), 0) || 0;
      
      // Build remark from smart remarks and custom remark
      const smartRemark = item.selectedRemarks ? 
        Object.entries(item.selectedRemarks).map(([key, value]) => `[${key}: ${value}]`).join(' ') : '';
      const finalRemark = `${smartRemark} ${item.customRemark || ''}`.trim();
      
      // Prepare selected_modifiers as array of IDs
      const selectedModifierIds = item.selectedModifiers?.map((mod: any) => mod.id) || [];
      
      return {
        product_id: item.id,
        quantity: item.quantity,
        size_id: item.selectedSize?.id || null, // Send only size_id (not the object)
        selected_modifiers: selectedModifierIds,
        remark: finalRemark,
      };
    });

    console.log('Sending order items:', JSON.stringify(orderItems, null, 2));

    const res = await api.post(`/public/menu/order/${token}`, {
      items: orderItems
    });

    console.log('Order response:', res.data);

    // Create a clean order object for local storage
    const newOrder = {
      id: res.data.order_id || Date.now(),
      order_number: res.data.order_number || `ORDER-${Date.now()}`,
      items: cart.map(item => ({
        name: item.name,
        size: item.selectedSize?.name,
        quantity: item.quantity,
        modifiers: item.selectedModifiers?.map((mod: any) => mod.name) || [],
        price_per_item: calculateItemTotal(item) / item.quantity,
        item_total: calculateItemTotal(item)
      })),
      subtotal: cartTotal,
      tax: branch?.tax_is_active ? cartTotal * ((branch?.tax_rate || 10) / 100) : 0,
      total: branch?.tax_is_active ? 
        cartTotal + (cartTotal * ((branch?.tax_rate || 10) / 100)) : 
        cartTotal,
      status: 'pending',
      created_at: new Date().toISOString(),
      branch_id: branch?.id,
      table_number: branch?.table_number || '01'
    };

    // Update history in localStorage
    const updatedHistory = [newOrder, ...orderHistory];
    setOrderHistory(updatedHistory);
    localStorage.setItem('order_history', JSON.stringify(updatedHistory));
    
    // Add to pending orders for tracking
    setPendingOrders(prev => [newOrder, ...prev]);
    
    // Set active order for real-time tracking
    setActiveOrderId(newOrder.id);
    setActiveStatus('pending');
    
    // Clear cart and close cart sheet
    setCart([]);
    setIsCartOpen(false);
    
    // Show success toast
    toast({
      title: "Order Placed!",
      description: `Order #${newOrder.order_number} has been submitted`,
      duration: 3000,
      className: "bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100"
    });
    
  } catch (e: any) {
    setActiveStatus('idle');
    
    // Enhanced error handling
    const errorMessage = e.response?.data?.message || 
                        e.response?.data?.error || 
                        "Please try again or contact staff";
    
    // Log detailed error for debugging
    console.error('Order submission error:', {
      error: e,
      response: e.response?.data,
      orderItems: cart
    });
    
    toast({ 
      variant: "destructive", 
      title: "Order Failed",
      description: errorMessage,
      duration: 5000
    });
  }
};

  const calculateItemTotal = (item: any): number => {
    // If item has stored unitPrice, use it (from ConfigurationModal)
    if (item.unitPrice !== undefined) {
      return item.unitPrice * item.quantity;
    }
    
    // Fallback calculation for items without unitPrice
    let basePrice = 0;
    if (item.selectedSize) {
      basePrice = formatPrice(item.selectedSize.final_price || item.selectedSize.base_price);
    } else if (item.pricing?.effective_price !== undefined) {
      basePrice = formatPrice(item.pricing.effective_price);
    } else {
      basePrice = formatPrice(item.pricing?.branch_product_price || item.pricing?.product_base_price || 0);
    }
    
    const modifierPrice = item.selectedModifiers?.reduce((total: number, modifier: any) => 
      total + formatPrice(modifier.price), 0) || 0;
    
    return (basePrice + modifierPrice) * item.quantity;
  };

  const handleOrderCollected = () => {
    if (activeOrderId) {
      const pendingOrder = pendingOrders.find(order => order.id === activeOrderId);
      if (pendingOrder) {
        const collectedOrder = { ...pendingOrder, status: 'collected' };
        const updatedCollectedOrders = [collectedOrder, ...collectedOrders].slice(0, 10);
        setCollectedOrders(updatedCollectedOrders);
        localStorage.setItem('order_history', JSON.stringify(updatedCollectedOrders));
        setPendingOrders(prev => prev.filter(order => order.id !== activeOrderId));
        
        toast({
          title: "Order Collected!",
          description: "Thank you for your order",
          duration: 3000,
        });
      }
    }
    setActiveStatus('idle');
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                           p.short_description?.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'all' || p.category_id === parseInt(activeCategory);
      return matchesSearch && matchesCat;
    });
  }, [products, search, activeCategory]);

  const formatPrice = (price: any): number => {
    if (price === null || price === undefined || price === "") return 0;
    const num = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(num) ? 0 : num;
  };


const calculateItemPrices = (item: any) => {
  let basePrice = 0;
  let originalPrice = 0;
  let discountAmount = 0;
  
  if (item.selectedSize) {
    // Get both original and discounted prices
    originalPrice = formatPrice(item.selectedSize.base_price);
    basePrice = formatPrice(item.selectedSize.final_price || item.selectedSize.base_price);
    
    // Calculate discount amount
    if (item.selectedSize.has_active_discount && item.selectedSize.discount_percentage > 0) {
      discountAmount = originalPrice - basePrice;
    }
  } else if (item.pricing?.effective_price !== undefined) {
    originalPrice = formatPrice(item.pricing.branch_product_price || item.pricing.product_base_price);
    basePrice = formatPrice(item.pricing.effective_price);
    
    // Calculate discount amount
    if (item.pricing.has_active_discount && item.pricing.discount_percentage > 0) {
      discountAmount = originalPrice - basePrice;
    }
  } else {
    basePrice = formatPrice(item.pricing?.branch_product_price || item.pricing?.product_base_price || 0);
    originalPrice = basePrice;
  }
  
  const modifierPrice = item.selectedModifiers?.reduce((sum: number, modifier: any) => 
    sum + formatPrice(modifier.price), 0) || 0;
  
  return {
    basePrice,
    originalPrice,
    discountAmount,
    modifierPrice,
    totalPerItem: basePrice + modifierPrice,
    originalPerItem: originalPrice + modifierPrice
  };
};



// Update the cartTotal calculation
const cartTotal = useMemo(() => {
  return cart.reduce((total, item) => {
    const prices = calculateItemPrices(item);
    return total + (prices.totalPerItem * item.quantity);
  }, 0);
}, [cart]);

// Update the original subtotal calculation
const originalSubtotal = useMemo(() => {
  return cart.reduce((total, item) => {
    const prices = calculateItemPrices(item);
    return total + (prices.originalPerItem * item.quantity);
  }, 0);
}, [cart]);

// Calculate total discount
const totalDiscount = useMemo(() => {
  return originalSubtotal - cartTotal;
}, [originalSubtotal, cartTotal]);


  const primaryColor = branch?.primary_color || '#3b82f6';
  const secondaryColor = branch?.secondary_color || '#8b5cf6';
  const accentColor = branch?.accent_color || '#10b981';

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="w-full max-w-xs h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${progress}%` }} 
          className="h-full bg-primary" 
          style={{ backgroundColor: primaryColor }}
        />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Loading Menu</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{branch?.branch_name || 'Restaurant'}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">{progress}%</p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 transition-colors duration-200 ${branch?.font_family}`}>
      {/* Dynamic Theme CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root { 
          --primary: ${primaryColor};
          --primary-rgb: ${(() => {
            const hex = primaryColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `${r}, ${g}, ${b}`;
          })()};
        }
        .dark { 
          --primary: ${primaryColor};
        }
      `}} />

      {/* Order Status Overlay */}
{activeStatus !== 'idle' && activeStatus !== 'submitting' && (
  <OrderStatusOverlay
    activeStatus={activeStatus}
    currentAnimation={ANIMATIONS[activeStatus as keyof typeof ANIMATIONS]}
    primaryColor={primaryColor}
    onOrderCollected={handleOrderCollected}
    onClose={() => setActiveStatus('idle')}
    order={activeOrderId}
    cart={cart} // Pass current cart
    branch={branch} // Pass branch info
  />
)}

      {/* Header */}
      <Header
        branch={branch}
        cart={cart}
        darkMode={darkMode}
        showHeader={showHeader}
        headerRef={headerRef}
        headerHeight={headerHeight}
        activeCategory={activeCategory}
        categories={categories}
        onToggleTheme={() => setDarkMode(!darkMode)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onChangeCategory={setActiveCategory}
      />

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-32 md:pb-20">
        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <Input
              placeholder="Search dishes, ingredients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-12 h-14 md:h-16 text-base rounded-2xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary shadow-sm"
              style={{ borderColor: `${primaryColor}30` }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Category Filters - Desktop */}
          <div className="hidden md:flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeCategory === 'all' ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              style={activeCategory === 'all' ? { backgroundColor: primaryColor } : undefined}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id.toString())}
                className={`px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeCategory === cat.id.toString() ? 'text-white ' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                style={activeCategory === cat.id.toString() ? { backgroundColor: primaryColor } : undefined}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product: any, index: number) => (
              <ProductCard
                key={product.id}
                product={product}
                branch={branch}
                onAddToCart={handleProductClick}
              />
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-10 md:py-16 text-center"
            >
              <div className="relative max-w-md mx-auto px-4">
                <div 
                  className="h-16 w-16 md:h-24 md:w-24 mx-auto rounded-full flex items-center justify-center mb-4"
                  style={{ 
                    backgroundColor: `${primaryColor}10`,
                  }}
                >
                  <Search className="h-8 w-8 md:h-12 md:w-12" style={{ color: primaryColor }} />
                </div>
                <h3 
                  className="text-lg md:text-xl font-bold mb-2"
                  style={{ color: primaryColor }}
                >
                  No dishes found
                </h3>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mb-6">
                  {search ? `No results for "${search}"` : 'No items in this category'}
                </p>
                {(search || activeCategory !== 'all') && (
                  <Button
                    onClick={() => {
                      setSearch('');
                      setActiveCategory('all');
                    }}
                    className="rounded-lg px-4 py-2 text-sm md:text-base"
                    style={{ 
                      backgroundColor: primaryColor,
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 px-4">
        <div className="flex items-center justify-around">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center gap-1"
            style={{ color: primaryColor }}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsHistoryOpen(true)}
            className="flex flex-col items-center gap-1"
            style={{ color: primaryColor }}
          >
            <History className="h-5 w-5" />
            <span className="text-xs">History</span>
          </Button>

          {/* Cart Button */}
          <div className="relative">
            <Button
              variant="default"
              size="lg"
              onClick={() => setIsCartOpen(true)}
              className="h-14 w-14 rounded-full text-white shadow-lg"
              style={{ 
                backgroundColor: primaryColor,
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
              }}
            >
              <ShoppingBag className="h-6 w-6" />
            </Button>
            {cart.length > 0 && (
              <span 
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full text-xs text-white font-bold flex items-center justify-center border-2 border-white dark:border-slate-900"
                style={{ backgroundColor: accentColor }}
              >
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(true)}
            className="flex flex-col items-center gap-1"
            style={{ color: primaryColor }}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Account</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
            className="flex flex-col items-center gap-1"
            style={{ color: primaryColor }}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="text-xs">Theme</span>
          </Button>
        </div>
      </nav>

      {/* Configuration Modal */}
<ConfigurationModal
  product={configuringProduct}
  isOpen={!!configuringProduct}
  onClose={() => {
    setConfiguringProduct(null);
    setSelectedRemarksForConfiguringProduct({});
  }}
  selectedSize={selectedSize}
  selectedModifiers={selectedModifiers}
  customRemark={customRemark}
  selectedRemarks={selectedRemarksForConfiguringProduct}
  remarkPresets={configuringProduct?.category_id ? 
    categories.find(c => c.id === configuringProduct.category_id)?.remark_presets || [] 
    : []}
  onSizeChange={setSelectedSize}
  onModifierToggle={(modifierId) => {
    setSelectedModifiers(prev => 
      prev.includes(modifierId) 
        ? prev.filter(id => id !== modifierId)
        : [...prev, modifierId]
    );
  }}
  onRemarkChange={setCustomRemark}
  onRemarkPresetChange={(presetName, option) => {
    setSelectedRemarksForConfiguringProduct(prev => ({
      ...prev,
      [presetName]: option
    }));
  }}
  onAddToCart={(product, size, modifiers, remark, totalPrice) => {
    addToCart(product, size, modifiers, remark, totalPrice);
    setSelectedRemarksForConfiguringProduct({});
  }}
/>

      {/* Cart Sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        categories={categories}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
        branch={branch}
        activeStatus={activeStatus}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onUpdateRemark={updateRemark}
        onToggleSmartRemark={toggleSmartRemark}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* History Sheet */}
      <HistorySheet
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orderHistory={orderHistory}
        primaryColor={primaryColor}
        branch={branch}
      />

      {/* Settings Sheet */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        branch={branch}
        primaryColor={primaryColor}
        token={token}
      />
    </div>
  );
};

export default CustomerMenu;