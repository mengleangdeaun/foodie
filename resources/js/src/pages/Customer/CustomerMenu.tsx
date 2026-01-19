import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '@/util/api';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
    Search, Plus, Minus, MessageSquare, 
    UtensilsCrossed, Loader2, Tag, Info, ChevronRight,
    MapPin, Star, Clock, History, X, ShoppingBag,
    Moon, Sun, Menu as MenuIcon, User, Settings,
    Home, Filter, Heart, ChevronLeft, Shield, ChevronDown,
    Phone, Mail, Globe, CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Lottie from "lottie-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";

// Import your local animations
import pendingAnim from '@/assets/css/animations/pending.json';
import cookingAnim from '@/assets/css/animations/cooking.json';
import readyAnim from '@/assets/css/animations/ready.json';
import confirmedAnim from '@/assets/css/animations/confirmed.json';

const ANIMATIONS = {
    pending: pendingAnim,
    cooking: cookingAnim,
    ready: readyAnim,
    confirmed: confirmedAnim,
}

// Add this new component before CustomerMenu component
interface ConfigurationModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: any, selectedSize: any, selectedModifiers: number[]) => void;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart 
}) => {
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);
  const [customRemark, setCustomRemark] = useState('');
  
  // Reset when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(null);
      setSelectedModifiers([]);
      setCustomRemark('');
    }
  }, [product]);
  
  if (!product) return null;
  
  const handleModifierToggle = (modifierId: number) => {
    setSelectedModifiers(prev => 
      prev.includes(modifierId) 
        ? prev.filter(id => id !== modifierId)
        : [...prev, modifierId]
    );
  };
  
  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, selectedModifiers);
    onClose();
  };
  
  const calculateTotalPrice = () => {
    let price = selectedSize?.price || product.pivot.branch_price;
    
    // Add modifier prices
    selectedModifiers.forEach(modifierId => {
      const modifier = product.modifier_groups
        ?.flatMap((group: any) => group.modifiers)
        .find((m: any) => m.id === modifierId);
      if (modifier) {
        price += modifier.price;
      }
    });
    
    return price;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize {product.name}</DialogTitle>
          <DialogDescription>
            Select size and add extras as needed
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Select Size</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.sizes.map((size: any) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedSize?.id === size.id 
                        ? 'bg-primary text-white border-primary' 
                        : 'border-slate-200 hover:border-primary'
                    }`}
                  >
                    <div className="font-medium">{size.name}</div>
                    {size.price && (
                      <div className="text-sm opacity-90">+${size.price.toFixed(2)}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Modifier Groups */}
          {product.modifier_groups && product.modifier_groups.length > 0 && (
            <div className="space-y-4">
              {product.modifier_groups.map((group: any) => (
                <div key={group.id} className="space-y-2">
                  <h3 className="font-semibold">{group.name}</h3>
                  <div className="space-y-2">
                    {group.modifiers.map((modifier: any) => (
                      <div 
                        key={modifier.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-primary transition-all cursor-pointer"
                        onClick={() => handleModifierToggle(modifier.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                            selectedModifiers.includes(modifier.id) 
                              ? 'bg-primary border-primary' 
                              : 'border-slate-300'
                          }`}>
                            {selectedModifiers.includes(modifier.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className="font-medium">{modifier.name}</span>
                        </div>
                        {modifier.price > 0 && (
                          <span className="font-semibold">+${modifier.price.toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Custom Remark */}
          <div className="space-y-2">
            <h3 className="font-semibold">Special Instructions</h3>
            <Input
              placeholder="Any special requests?"
              value={customRemark}
              onChange={(e) => setCustomRemark(e.target.value)}
              className="w-full"
            />
          </div>
          
          {/* Price Summary */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold text-primary">
                ${calculateTotalPrice().toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {selectedModifiers.length} modifier{selectedModifiers.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddToCart}>
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CustomerMenu = () => {
    const { token } = useParams();
    const { toast } = useToast();


      const [configuringProduct, setConfiguringProduct] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);
  const [customRemark, setCustomRemark] = useState('');
    
    const [branch, setBranch] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    
    // Loading State
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    
    // Local Order Management
    const [orderHistory, setOrderHistory] = useState<any[]>([]);
    const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
    const [activeStatus, setActiveStatus] = useState<string>('idle');

    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [collectedOrders, setCollectedOrders] = useState<any[]>([]);
    

    // Add these state variables at the top of your component with other state declarations
const [lastScrollY, setLastScrollY] = useState(0);
const [showHeader, setShowHeader] = useState(true);
const [headerHeight, setHeaderHeight] = useState(0);
const headerRef = useRef<HTMLDivElement>(null);

// Add this useEffect for scroll behavior



    // Dark/Light Mode
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('customerDarkMode') === 'true' || 
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    const currentAnimation = ANIMATIONS[activeStatus as keyof typeof ANIMATIONS];

    // Toggle Dark Mode
    useEffect(() => {
        if (!darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('customerDarkMode', 'true');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('customerDarkMode', 'false');
        }
    }, [darkMode]);

    useEffect(() => {
  if (headerRef.current) {
    setHeaderHeight(headerRef.current.offsetHeight);
  }
}, []);


    useEffect(() => {
  const controlHeader = () => {
    const currentScrollY = window.scrollY;
    
    // At the top of the page, always show header
    if (currentScrollY < 50) {
      setShowHeader(true);
      setLastScrollY(currentScrollY);
      return;
    }

    // Scrolling down - hide header
    if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 30) {
      setShowHeader(false);
    }
    // Scrolling up - show header
    else if (lastScrollY > currentScrollY && lastScrollY - currentScrollY > 10) {
      setShowHeader(true);
    }

    setLastScrollY(currentScrollY);
  };

  window.addEventListener('scroll', controlHeader, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', controlHeader);
  };
}, [lastScrollY]);

    // 1. Initial Load & History Sync
    useEffect(() => {
        fetchMenu();
        const savedHistory = JSON.parse(localStorage.getItem('order_history') || '[]');
        setOrderHistory(savedHistory);
    }, [token]);

    // 2. Real-time Status Sync
    useEffect(() => {
        if (window.Echo && activeOrderId) {
            window.Echo.channel(`order.${activeOrderId}`)
                .listen('.status.updated', (data: any) => {
                    setActiveStatus(data.status);
                    updateLocalHistory(activeOrderId, data.status);
                });
        }
    }, [activeOrderId]);

    const fetchMenu = async () => {
        try {
            // Fake progress animation for better UX
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

    const handlePlaceOrder = async () => {
        setActiveStatus('submitting');
        try {
            const res = await api.post(`/public/menu/order/${token}`, {
                items: cart.map(i => ({ 
                    id: i.id, 
                    qty: i.qty, 
                    remark: `${i.smartRemarkLabel || ''} ${i.remark || ''}`.trim() 
                }))
            });

            const newOrder = {
                id: res.data.order_id,
                date: new Date().toISOString(),
                status: 'pending',
                total: cart.reduce((a, b) => a + (b.pivot.branch_price * b.qty), 0),
                items: cart.map(i => ({ name: i.name, qty: i.qty }))
            };

            const updatedHistory = [newOrder, ...orderHistory].slice(0, 10);
            setOrderHistory(updatedHistory);
            setPendingOrders(prev => [newOrder, ...prev.slice(0, 9)]);
            setActiveOrderId(res.data.order_id);
            setActiveStatus('pending');
            setCart([]);
            setIsCartOpen(false);
            
            toast({
                title: "Order Placed!",
                description: "Your order has been sent to the kitchen",
                duration: 3000,
            });
        } catch (e) {
            setActiveStatus('idle');
            toast({ 
                variant: "destructive", 
                title: "Order Failed",
                description: "Please try again or contact staff"
            });
        }
    };

    const handleOrderCollected = () => {
    if (activeOrderId) {
        // Find the pending order
        const pendingOrder = pendingOrders.find(order => order.id === activeOrderId);
        if (pendingOrder) {
            // Mark as collected
            const collectedOrder = { ...pendingOrder, status: 'collected' };
            
            // Update collected orders and save to localStorage
            const updatedCollectedOrders = [collectedOrder, ...collectedOrders].slice(0, 10);
            setCollectedOrders(updatedCollectedOrders);
            localStorage.setItem('order_history', JSON.stringify(updatedCollectedOrders));
            
            // Remove from pending orders
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

    // --- SMART REMARK LOGIC ---
    const toggleSmartRemark = (productId: number, presetName: string, option: string) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newSelections = { ...(item.selectedRemarks || {}), [presetName]: option };
                const remarkStr = Object.entries(newSelections).map(([k, v]) => `[${k}: ${v}]`).join(' ');
                return { ...item, selectedRemarks: newSelections, smartRemarkLabel: remarkStr };
            }
            return item;
        }));
    };

  const addToCart = (product: any, size: any = null, modifiers: number[] = []) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && 
        item.selectedSize?.id === size?.id &&
        JSON.stringify(item.selectedModifiers) === JSON.stringify(modifiers)
      );
      
      if (existing) {
        return prev.map(item => 
          item.id === product.id && 
          item.selectedSize?.id === size?.id &&
          JSON.stringify(item.selectedModifiers) === JSON.stringify(modifiers)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prev, { 
        ...product, 
        quantity: 1, 
        remark: '', 
        selectedRemarks: {},
        selectedSize: size,
        selectedModifiers: modifiers,
        customRemark: ''
      }];
    });
    
    setConfiguringProduct(null);
    setSelectedSize(null);
    setSelectedModifiers([]);
    setCustomRemark('');
    
    toast({ 
      title: "Added to cart", 
      description: product.name,
      duration: 1500,
      className: "bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100"
    });
  };

    const handleProductClick = (product: any) => {
    if (product.sizes?.length > 0 || product.modifier_groups?.length > 0) {
      setConfiguringProduct(product);
    } else {
      addToCart(product);
    }
  };

    const updateQty = (id: number, delta: number) => {
        setCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item).filter(i => i.qty > 0));
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                                 p.short_description?.toLowerCase().includes(search.toLowerCase());
            const matchesCat = activeCategory === 'all' || p.category_id === parseInt(activeCategory);
            return matchesSearch && matchesCat;
        });
    }, [products, search, activeCategory]);

    // Calculate cart total
    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => total + (item.pivot.branch_price * item.qty), 0);
    }, [cart]);

    // Mobile category navigation
    const [showMobileCategories, setShowMobileCategories] = useState(false);

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
            <div className="w-full max-w-xs h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progress}%` }} 
                    className="h-full bg-primary" 
                />
            </div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Loading Menu</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{branch?.branch_name || 'Restaurant'}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">{progress}%</p>
            </div>
        </div>
    );

    // Get colors from branch config
    const primaryColor = branch?.primary_color || '#3b82f6';
    const secondaryColor = branch?.secondary_color || '#8b5cf6';
    const accentColor = branch?.accent_color || '#10b981';

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

            {/* 1. LOTTIE ORDER STATUS OVERLAY */}
            <AnimatePresence>
                {activeStatus !== 'idle' && activeStatus !== 'submitting' && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 z-[200] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="w-64 h-64 md:w-80 md:h-80">
                            {currentAnimation && <Lottie animationData={currentAnimation} loop={activeStatus !== 'ready'} />}
                        </div>
                        <motion.h2 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-3xl md:text-4xl font-bold mt-6 text-slate-900 dark:text-white"
                        >
                            {activeStatus === 'pending' ? 'Order Sent!' : 
                             activeStatus === 'cooking' ? 'Cooking in Progress' : 
                             activeStatus === 'confirmed' ? 'Order Confirmed' :
                             'Order Ready!'}
                        </motion.h2>
                        <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-slate-600 dark:text-slate-300 mt-3 max-w-md"
                        >
                            {activeStatus === 'pending' ? 'Your order has been received by the kitchen' : 
                             activeStatus === 'cooking' ? 'Our chefs are preparing your delicious meal' : 
                             activeStatus === 'confirmed' ? 'Your order has been confirmed!' : 
                             'Your order is ready for pickup!'}
                        </motion.p>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="mt-8 flex gap-4"
                        >
                        {activeStatus === 'ready' && (
                            <Button 
                                onClick={handleOrderCollected}
                                className="bg-green-600 hover:bg-green-700 text-white px-8"
                            >
                                <Shield className="mr-2 h-4 w-4" />
                                Order Collected
                            </Button>
                        )}
                            <Button 
                                onClick={() => setActiveStatus('idle')}
                                variant={activeStatus === 'ready' ? "outline" : "default"}
                                className="px-8 text-white hover:text-slate-100"
                                style={{backgroundColor : `${primaryColor}` }}
                            >
                                {activeStatus === 'ready' ? 'Close' : 'Order More'}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. HEADER - Mobile Optimized */}





<header 
    ref={headerRef}
    className={`sticky top-0 z-50 transition-all duration-300 ${
        showHeader 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0'
    }`}
    style={{ 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderBottom: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.3)'}`
    }}
>
    {/* Add a spacer div to prevent content jump */}
    <div style={{ height: headerHeight }} className="absolute -z-10" />
    
    <div className="px-4 md:px-6 py-3">
        <div className="flex items-center justify-between mb-3">
            {/* Left: Logo & Branch Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative h-10 w-10 shrink-0">
                    {branch?.logo_path ? (
                        <>
                            <img 
                                src={`/storage/${branch.logo_path}`} 
                                alt={branch?.branch_name}
                                className="h-10 w-10 rounded-xl object-cover shadow-lg border-2"
                                style={{ borderColor: `${primaryColor}30` }}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = document.getElementById(`logo-fallback-${branch.id}`);
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                            <div 
                                id={`logo-fallback-${branch.id}`}
                                className="h-10 w-10 rounded-xl hidden items-center justify-center shadow-lg absolute top-0 left-0 border-2"
                                style={{ 
                                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                    borderColor: `${primaryColor}30`
                                }}
                            >
                                <UtensilsCrossed className="h-5 w-5 text-white" />
                            </div>
                        </>
                    ) : (
                        <div 
                            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg border-2"
                            style={{ 
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                borderColor: `${primaryColor}30`
                            }}
                        >
                            <UtensilsCrossed className="h-5 w-5 text-white" />
                        </div>
                    )}
                </div>
                <div className="min-w-0">
                    <h1 
                        className={`text-lg md:text-xl font-bold leading-none line-clamp-1 ${branch?.font_family_headings}`}
                        style={{ color: primaryColor }}
                    >
                        {branch?.branch_name}
                    </h1>
                    <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3" style={{ color: primaryColor }} />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {branch?.opening_hours || 'Open Now'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 ml-2">
                {/* Cart Badge - Mobile Only */}
                {cart.length > 0 && (
                    <div className="md:hidden relative">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setIsCartOpen(true)}
                            className="h-9 w-9 rounded-full relative"
                            style={{ 
                                color: primaryColor,
                                backgroundColor: `${primaryColor}10`
                            }}
                        >
                            <ShoppingBag className="h-4.5 w-4.5" />
                            <span 
                                className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs text-white font-bold flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse"
                                style={{ 
                                    backgroundColor: accentColor,
                                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                }}
                            >
                                {cart.reduce((a, b) => a + b.qty, 0)}
                            </span>
                        </Button>
                    </div>
                )}

                {/* Theme Toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDarkMode(!darkMode)}
                    className="h-9 w-9 rounded-full hidden md:flex"
                    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    style={{ 
                        color: primaryColor,
                        backgroundColor: `${primaryColor}10`
                    }}
                >
                    {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
                </Button>

                {/* History Button - Desktop Only */}
                <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsHistoryOpen(true)}
                    className="h-9 w-9 rounded-full hidden md:flex"
                    style={{ 
                        color: primaryColor,
                        backgroundColor: `${primaryColor}10`
                    }}
                >
                    <History className="h-4.5 w-4.5" />
                </Button>

                {/* Settings Button */}
                <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsSettingsOpen(true)}
                    className="h-9 w-9 rounded-full hidden md:flex"
                    style={{ 
                        color: primaryColor,
                        backgroundColor: `${primaryColor}10`
                    }}
                >
                    <Settings className="h-4.5 w-4.5" />
                </Button>
            </div>
        </div>

        {/* Mobile Horizontal Category Scroll */}
        <div className="md:hidden relative">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {/* All Categories Button */}
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`shrink-0 px-4 py-2 text-sm font-medium rounded-full border transition-all whitespace-nowrap ${
                        activeCategory === 'all' 
                        ? 'text-white shadow-lg' 
                        : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                    style={
                        activeCategory === 'all' 
                        ? { 
                            backgroundColor: primaryColor,
                            borderColor: primaryColor,
                            borderWidth: '2px',
                            boxShadow: `0 4px 12px ${primaryColor}40`
                        } 
                        : { 
                            borderColor: `${primaryColor}30`,
                            borderWidth: '1px'
                        }
                    }
                >
                    All
                </button>

                {/* Category Buttons */}
                {categories.slice(0, 8).map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id.toString())}
                        className={`shrink-0 px-4 py-2 text-sm font-medium rounded-full border transition-all whitespace-nowrap ${
                            activeCategory === cat.id.toString() 
                            ? 'text-white shadow-lg' 
                            : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                        style={
                            activeCategory === cat.id.toString() 
                            ? { 
                                backgroundColor: primaryColor,
                                borderColor: primaryColor,
                                borderWidth: '2px',
                                boxShadow: `0 4px 12px ${primaryColor}40`
                            } 
                            : { 
                                borderColor: `${primaryColor}30`,
                                borderWidth: '1px'
                            }
                        }
                    >
                        {cat.name}
                    </button>
                ))}
            </div>
            
            {/* Gradient fade on right side for scroll indication */}
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none"></div>
        </div>

    </div>
    
    {/* Floating Cart Button for Desktop - Always visible */}
    {cart.length > 0 && (
        <div className="hidden md:block fixed bottom-6 right-6 z-40">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                className="relative"
            >
                <Button
                    onClick={() => setIsCartOpen(true)}
                    size="lg"
                    className="h-14 rounded-2xl px-5 shadow-2xl hover:shadow-3xl transition-all duration-300"
                    style={{ 
                        backgroundColor: primaryColor,
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        boxShadow: `0 10px 30px ${primaryColor}40`
                    }}
                >
                    <ShoppingBag className="mr-2 h-5 w-5" />
                    View Cart • ${cartTotal.toFixed(2)}
                    <span 
                        className="ml-3 h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold animate-pulse"
                        style={{ 
                            backgroundColor: 'rgba(255,255,255,0.3)',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }}
                    >
                        {cart.reduce((a, b) => a + b.qty, 0)}
                    </span>
                </Button>
            </motion.div>
        </div>
    )}
</header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-32 md:pb-20">
                {/* 3. SEARCH & FILTERS - Mobile Optimized */}
                <div className="mb-8 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        <Input
                            placeholder="Search dishes, ingredients..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-12 h-14 md:h-16 text-base rounded-2xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-primary shadow-sm"
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

                    {/* Category Filters - Desktop Horizontal Scroll */}
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
<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
    <AnimatePresence mode="popLayout">
        {filteredProducts.map((product: any, index: number) => {
            // Parse prices as numbers
            const originalPrice = Number(product.pivot.branch_price) || 0;
            const discountPercentage = Number(product.pivot.discount_percentage) || 0;
            
            // Calculate discount savings
            const discountAmount = product.pivot.has_active_discount 
                ? originalPrice * (discountPercentage / 100)
                : 0;
            const discountedPrice = product.pivot.has_active_discount 
                ? originalPrice - discountAmount
                : originalPrice;

            return (
                <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="group relative bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl overflow-hidden shadow-md hover:shadow-xl dark:hover:shadow-slate-900/30 transition-all duration-200 border border-slate-100 dark:border-slate-700 hover:border-primary/20"
                >
                    {/* Compact Image Container */}
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-900">
                        {product.image_path ? (
                            <>
                                <img 
                                    src={`${product.image_path}`} 
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    loading="lazy"
                                />
                                {/* Subtle overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 p-4">
                                <div className="text-center">
                                    <div 
                                        className="h-10 w-10 md:h-12 md:w-12 rounded-xl mb-2 flex items-center justify-center mx-auto"
                                        style={{ backgroundColor: `${primaryColor}15` }}
                                    >
                                        <UtensilsCrossed size={20} className="md:size-6" style={{ color: primaryColor }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Discount Badge - Top Left */}
                        {product.pivot.has_active_discount && (
                            <div 
                                className="absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-full shadow"
                                style={{ 
                                    backgroundColor: accentColor,
                                    fontSize: '10px'
                                }}
                            >
                                -{discountPercentage}%
                            </div>
                        )}

                        {/* Size Badge - Top Right */}
                        {product.size && (
                            <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded shadow">
                                {product.size}
                            </div>
                        )}

                        {/* Quick Add Button - Bottom Right */}
                        <button
                            onClick={() => addToCart(product)}
                            className="absolute bottom-2 right-2 h-8 w-8 md:h-10 md:w-10 md:hidden rounded-full text-white flex items-center justify-center shadow-md hover:shadow-lg hover:scale-110 transition-all duration-200"
                            style={{ 
                                backgroundColor: primaryColor,
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                            }}
                        >
                            <Plus size={16} className="md:size-5" />
                        </button>
                    </div>

                    {/* Compact Product Info */}
                    <div className="p-3 md:p-4">
                        {/* Product Name */}
                        <h3 
                            className="font-bold text-slate-900 dark:text-white line-clamp-1 text-sm md:text-base mb-1"
                            style={{ fontFamily: branch?.font_family_headings }}
                        >
                            {product.name}
                        </h3>

                        {/* Short Description - Show on mobile too */}
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-2 min-h-[2rem]">
                            {product.short_description || "Delicious dish with premium ingredients"}
                        </p>

                        {/* Price Section */}
                        {product.pivot.has_active_discount ? (
                            <div className="space-y-1">
                                {/* Discounted Price */}
                                <div className="flex items-baseline gap-1">
                                    <span 
                                        className="text-base md:text-lg font-bold"
                                        style={{ color: primaryColor }}
                                    >
                                        ${discountedPrice.toFixed(2)}
                                    </span>
                                    {/* Original Price */}
                                    <span className="text-xs text-slate-400 dark:text-slate-500 line-through">
                                        ${originalPrice.toFixed(2)}
                                    </span>
                                </div>
                                
                                {/* Save Amount */}
                                <div 
                                    className="text-xs font-medium px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                                    style={{ 
                                        backgroundColor: `${accentColor}20`,
                                        color: accentColor
                                    }}
                                >
                                    <Tag className="h-2.5 w-2.5" />
                                    Save ${discountAmount.toFixed(2)}
                                </div>
                            </div>
                        ) : (
                            <div>
                                {/* Regular Price */}
                                <span 
                                    className="text-base md:text-lg font-bold"
                                    style={{ color: primaryColor }}
                                >
                                    ${originalPrice.toFixed(2)}
                                </span>
                            </div>
                        )}

                        {/* Add to Cart Button - Desktop Only (Hidden on mobile) */}
                        <Button
                            onClick={() => addToCart(product)}
                            size="sm"
                            className="hidden md:flex items-center gap-1 rounded-lg px-3 py-2 text-xs mt-3 w-full justify-center"
                            style={{ 
                                backgroundColor: primaryColor,
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                            }}
                        >
                            {product.pivot.has_active_discount ? (
                                <>
                                    <Plus size={12} />
                                    Add • Save ${discountAmount.toFixed(2)}
                                </>
                            ) : (
                                <>
                                    <Plus size={12} />
                                    Add to Cart
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Popular Badge - Top Left (below discount badge) */}
                    {product.is_popular && (
                        <div className="absolute top-10 left-2 flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-[10px] font-medium px-1.5 py-0.5 rounded-full">
                            <Star className="h-2 w-2 fill-amber-500" />
                            <span>Popular</span>
                        </div>
                    )}
                </motion.div>
            );
        })}
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
                    style={{ color: primaryColor, fontFamily: branch?.font_family_headings }}
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
                <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-slate-400 dark:text-slate-500">
                    <div className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="font-medium">Try searching</div>
                        <div className="text-xs mt-1">"pasta", "burger", etc.</div>
                    </div>
                    <div className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <div className="font-medium">Check categories</div>
                        <div className="text-xs mt-1">Switch to "All"</div>
                    </div>
                </div>
            </div>
        </motion.div>
    )}
</div>
            </main>

            {/* 5. MOBILE BOTTOM NAVIGATION */}
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

                    {/* Cart Button with Badge */}
                    <div className="relative">
                        <Button
                            variant="default"
                            size="lg"
                            onClick={() => setIsCartOpen(true)}
                            className="h-14 w-14 rounded-full text-white shadow-lg"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <ShoppingBag className="h-6 w-6" />
                        </Button>
                        {cart.length > 0 && (
                            <span 
                                className="absolute -top-1 -right-1 h-6 w-6 rounded-full text-xs text-white font-bold flex items-center justify-center border-2 border-white dark:border-slate-900"
                                style={{ backgroundColor: accentColor }}
                            >
                                {cart.reduce((a, b) => a + b.qty, 0)}
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

            {/* 6. CART DRAWER - Mobile Optimized */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div 
                            className="p-6 border-b"
                            style={{ 
                                borderColor: `${primaryColor}20`,
                                backgroundColor: `${primaryColor}05`
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 
                                        className="text-2xl font-bold"
                                        style={{ color: primaryColor, fontFamily: branch?.font_family_headings }}
                                    >
                                        Your Order
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {cart.length} item{cart.length !== 1 ? 's' : ''} • ${cartTotal.toFixed(2)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsCartOpen(false)}
                                    style={{ color: primaryColor }}
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                        </div>

                        {/* Cart Items - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div 
                                        className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                                        style={{ backgroundColor: `${primaryColor}20` }}
                                    >
                                        <ShoppingBag className="h-8 w-8" style={{ color: primaryColor }} />
                                    </div>
                                    <h3 
                                        className="text-xl font-bold mb-2"
                                        style={{ color: primaryColor, fontFamily: branch?.font_family_headings }}
                                    >
                                        Your cart is empty
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                                        Add items from the menu to get started
                                    </p>
                                    <Button
                                        onClick={() => setIsCartOpen(false)}
                                        className="px-8"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        Browse Menu
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {cart.map((item) => (
                                        <div 
                                            key={item.id} 
                                            className="rounded-xl p-4"
                                            style={{ 
                                                backgroundColor: `${primaryColor}05`,
                                                border: `1px solid ${primaryColor}20`
                                            }}
                                        >
                                            <div className="flex gap-4">
                                                {/* Item Image */}
                                                <div className="h-20 w-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
                                                    {item.image_path ? (
                                                        <img 
                                                            src={item.image_path} 
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center">
                                                            <UtensilsCrossed className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Item Details */}
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 
                                                                className="font-bold"
                                                                style={{ fontFamily: branch?.font_family_headings }}
                                                            >
                                                                {item.name}
                                                            </h4>
                                                            <p 
                                                                className="text-sm font-bold mt-1"
                                                                style={{ color: primaryColor }}
                                                            >
                                                                ${item.pivot.branch_price}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => updateQty(item.id, -item.qty)}
                                                            className="h-8 w-8"
                                                            style={{ color: primaryColor }}
                                                        >
                                                            <X size={16} />
                                                        </Button>
                                                    </div>

                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center justify-between mt-4">
                                                        <div 
                                                            className="flex items-center gap-3 rounded-full px-3 py-1"
                                                            style={{ backgroundColor: `${primaryColor}10` }}
                                                        >
                                                            <button
                                                                onClick={() => updateQty(item.id, -1)}
                                                                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/20"
                                                                style={{ color: primaryColor }}
                                                            >
                                                                <Minus size={16} />
                                                            </button>
                                                            <span 
                                                                className="font-bold min-w-[2rem] text-center"
                                                                style={{ color: primaryColor }}
                                                            >
                                                                {item.qty}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQty(item.id, 1)}
                                                                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/20"
                                                                style={{ color: primaryColor }}
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>
                                                        <span 
                                                            className="font-bold"
                                                            style={{ color: primaryColor }}
                                                        >
                                                            ${(item.pivot.branch_price * item.qty).toFixed(2)}
                                                        </span>
                                                    </div>

                                                    {/* Smart Remarks */}
                                                    {categories.find(c => c.id === item.category_id)?.remark_presets?.length > 0 && (
                                                        <div className="mt-4 space-y-3">
                                                            {categories.find(c => c.id === item.category_id).remark_presets.map((preset: any) => (
                                                                <div key={preset.id}>
                                                                    <p 
                                                                        className="text-xs font-medium mb-2"
                                                                        style={{ color: primaryColor }}
                                                                    >
                                                                        {preset.name}:
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {preset.options.map((opt: string) => (
                                                                            <button
                                                                                key={opt}
                                                                                onClick={() => toggleSmartRemark(item.id, preset.name, opt)}
                                                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${item.selectedRemarks?.[preset.name] === opt ? 'text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                                                                style={item.selectedRemarks?.[preset.name] === opt ? { backgroundColor: primaryColor } : {}}
                                                                            >
                                                                                {opt}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Custom Remark */}
                                                    <div className="mt-4">
                                                        <Input
                                                            placeholder="Special instructions..."
                                                            value={item.remark}
                                                            onChange={e => setCart(prev => prev.map(i => i.id === item.id ? {...i, remark: e.target.value} : i))}
                                                            className="h-10 text-sm"
                                                            style={{ borderColor: `${primaryColor}30` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Checkout Footer */}
                        {cart.length > 0 && (
                            <div 
                                className="p-6 border-t bg-white dark:bg-slate-900"
                                style={{ borderColor: `${primaryColor}20` }}
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                                        <span className="font-bold">${cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600 dark:text-slate-400">Tax</span>
                                        <span className="font-bold">${(cartTotal * 0.08).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg font-bold pt-4 border-t">
                                        <span>Total</span>
                                        <span style={{ color: primaryColor }}>${(cartTotal * 1.08).toFixed(2)}</span>
                                    </div>
                                    
                                    <Button
                                        onClick={handlePlaceOrder}
                                        size="lg"
                                        className="w-full h-14 mt-6 text-lg font-bold"
                                        disabled={activeStatus === 'submitting'}
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        {activeStatus === 'submitting' ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Place Order • ${(cartTotal * 1.08).toFixed(2)}
                                                <ChevronRight className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </Button>
                                    
                                    <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                                        By placing order, you agree to our terms and conditions
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* 7. HISTORY SHEET */}
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetContent 
                onEscapeKeyDown={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
                side="right" className="w-full sm:max-w-md p-0 [&>button]:hidden">
                    <div className="h-full flex flex-col">
                        <div 
                            className="p-6 border-b"
                            style={{ 
                                borderColor: `${primaryColor}20`,
                                backgroundColor: `${primaryColor}05`
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 
                                        className="text-2xl font-bold"
                                        style={{ color: primaryColor, fontFamily: branch?.font_family_headings }}
                                    >
                                        Order History
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Your recent orders
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsHistoryOpen(false)}
                                    style={{ color: primaryColor }}
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            {orderHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <div 
                                        className="h-16 w-16 rounded-full flex items-center justify-center mb-4"
                                        style={{ backgroundColor: `${primaryColor}20` }}
                                    >
                                        <History className="h-8 w-8" style={{ color: primaryColor }} />
                                    </div>
                                    <h3 
                                        className="text-xl font-bold mb-2"
                                        style={{ color: primaryColor, fontFamily: branch?.font_family_headings }}
                                    >
                                        No orders yet
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400">
                                        Your order history will appear here
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orderHistory.map(order => (
                                        <div 
                                            key={order.id} 
                                            className="rounded-xl p-4"
                                            style={{ 
                                                backgroundColor: `${primaryColor}05`,
                                                border: `1px solid ${primaryColor}20`
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        Order #{order.id}
                                                    </p>
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                        {new Date(order.date).toLocaleDateString()} • {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </p>
                                                </div>
                                                <Badge 
                                                    className="text-xs font-medium"
                                                    style={{ 
                                                        backgroundColor: `${primaryColor}20`,
                                                        color: primaryColor
                                                    }}
                                                >
                                                    {order.status}
                                                </Badge>
                                            </div>
                                            
                                            <div className="space-y-2 mb-3">
                                                {order.items.map((i: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-sm">
                                                        <span className="text-slate-700 dark:text-slate-300">
                                                            {i.qty}x {i.name}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: `${primaryColor}20` }}>
                                                <span 
                                                    className="font-bold"
                                                    style={{ color: primaryColor }}
                                                >
                                                    ${order.total.toFixed(2)}
                                                </span>
                                                {order.status === 'ready' && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        style={{ borderColor: primaryColor, color: primaryColor }}
                                                    >
                                                        Reorder
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* 8. SETTINGS SHEET */}
            <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <SheetContent side="right" className="w-full sm:max-w-md p-0">
                    <div className="h-full flex flex-col">
                        <div 
                            className="p-6 border-b"
                            style={{ 
                                borderColor: `${primaryColor}20`,
                                backgroundColor: `${primaryColor}05`
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 
                                        className="text-2xl font-bold"
                                        style={{ color: primaryColor, fontFamily: branch?.font_family_headings }}
                                    >
                                        Settings
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Customize your experience
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsSettingsOpen(false)}
                                    style={{ color: primaryColor }}
                                >
                                    <X size={20} />
                                </Button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-6">
                                {/* Theme Settings */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg" style={{ color: primaryColor }}>Appearance</h3>
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            {darkMode ? <Moon className="h-5 w-5" style={{ color: primaryColor }} /> : <Sun className="h-5 w-5" style={{ color: primaryColor }} />}
                                            <div>
                                                <p className="font-medium">Dark Mode</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    Switch between themes
                                                </p>
                                            </div>
                                        </div>
                                        <Switch
                                            checked={darkMode}
                                            onCheckedChange={setDarkMode}
                                        />
                                    </div>
                                </div>

                                {/* Restaurant Info */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg" style={{ color: primaryColor }}>Restaurant Info</h3>
                                    <div className="space-y-3">
                                        <div 
                                            className="flex items-center gap-3 p-3 rounded-lg"
                                            style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${primaryColor}20` }}
                                        >
                                            <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                                            <div>
                                                <p className="font-medium">Phone</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                                    {branch?.contact_phone || 'Not available'}
                                                </p>
                                            </div>
                                        </div>
                                        <div 
                                            className="flex items-center gap-3 p-3 rounded-lg"
                                            style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${primaryColor}20` }}
                                        >
                                            <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                                            <div>
                                                <p className="font-medium">Email</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                                    {branch?.email || 'Not available'}
                                                </p>
                                            </div>
                                        </div>
                                        <div 
                                            className="flex items-center gap-3 p-3 rounded-lg"
                                            style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${primaryColor}20` }}
                                        >
                                            <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                                            <div>
                                                <p className="font-medium">Address</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                                    {branch?.address || 'Not available'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* App Info */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg" style={{ color: primaryColor }}>About</h3>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
                                        <p>Table: #{token?.split('-')[0]}</p>
                                        <p>Branch: {branch?.branch_name}</p>
                                        <p>App Version: 2.0.0</p>
                                    </div>
                                </div>

                                {/* Support */}
                                <div className="space-y-4 pt-6 border-t" style={{ borderColor: `${primaryColor}20` }}>
                                    <h3 className="font-bold text-lg" style={{ color: primaryColor }}>Support</h3>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        style={{ borderColor: primaryColor, color: primaryColor }}
                                    >
                                        <MessageSquare className="mr-3 h-5 w-5" />
                                        Contact Support
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="w-full justify-start"
                                        style={{ borderColor: primaryColor, color: primaryColor }}
                                    >
                                        <Shield className="mr-3 h-5 w-5" />
                                        Privacy Policy
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* 9. FLOATING CART BUTTON (Desktop) */}
            {cart.length > 0 && (
                <div className="hidden md:block fixed bottom-6 right-6 z-40">
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative"
                    >
                        <Button
                            onClick={() => setIsCartOpen(true)}
                            size="lg"
                            className="h-16 rounded-2xl px-6 shadow-2xl"
                            style={{ 
                                backgroundColor: primaryColor,
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                            }}
                        >
                            <ShoppingBag className="mr-3 h-5 w-5" />
                            View Cart • ${cartTotal.toFixed(2)}
                            <span 
                                className="ml-3 h-6 w-6 rounded-full flex items-center justify-center text-sm"
                                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                            >
                                {cart.reduce((a, b) => a + b.qty, 0)}
                            </span>
                        </Button>
                    </motion.div>
                    
                </div>
            )}

            



        </div>
    );
};

export default CustomerMenu;
