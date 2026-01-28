import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  UtensilsCrossed, Clock, ShoppingBag,
  Sun, Moon, History, Settings, X
} from "lucide-react";
import { motion } from "framer-motion";

interface HeaderProps {
  branch: any;
  cart: any[];
  darkMode: boolean;
  showHeader: boolean;
  headerRef: React.RefObject<HTMLDivElement>;
  headerHeight: number;
  activeCategory: string;
  categories: any[];
  onToggleTheme: () => void;
  onOpenCart: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onChangeCategory: (categoryId: string) => void;
}

import TimeFormat from "@/components/TimeFormat";

const Header = ({
  branch,
  cart,
  darkMode,
  showHeader,
  headerRef,
  headerHeight,
  activeCategory,
  categories,
  onToggleTheme,
  onOpenCart,
  onOpenHistory,
  onOpenSettings,
  onChangeCategory
}: HeaderProps) => {
  const primaryColor = branch?.primary_color || '#3b82f6';
  const secondaryColor = branch?.secondary_color || '#8b5cf6';
  const accentColor = branch?.accent_color || '#10b981';

  // Update favicon when branch data is available
  useEffect(() => {
    if (branch?.favicon_path) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.type = 'image/png';
      link.rel = 'shortcut icon';
      link.href = `/storage/${branch.favicon_path}`;
    }
  }, [branch?.favicon_path]);

  // Calculate cart total using new pricing structure
  const calculateCartTotal = (): number => {
    return cart.reduce((total, item) => {
      // Calculate base price
      let basePrice = 0;
      if (item.selectedSize) {
        // Use final_price for size (includes discount if any)
        basePrice = item.selectedSize.final_price || item.selectedSize.base_price || 0;
      } else if (item.pricing?.effective_price !== undefined) {
        basePrice = item.pricing.effective_price;
      } else {
        basePrice = item.pricing?.branch_product_price || item.pricing?.product_base_price || 0;
      }

      // Calculate modifier price
      const modifierPrice = item.selectedModifiers?.reduce((sum: number, modifier: any) =>
        sum + (modifier.price || 0), 0) || 0;

      return total + ((basePrice + modifierPrice) * item.quantity);
    }, 0);
  };

  const cartTotal = calculateCartTotal();
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

  const formatPrice = (price: number): string => {
    return price.toFixed(2);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 transition-all duration-300 ${showHeader
          ? 'translate-y-0 opacity-100'
          : '-translate-y-full opacity-0'
          }`}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderBottom: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(203, 213, 225, 0.3)'}`
        }}
      >
        {/* Spacer to prevent content jump */}
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
                    />
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
                  className={`text-lg md:text-xl font-bold leading-none line-clamp-1`}
                  style={{ color: primaryColor }}
                >
                  {branch?.branch_name}
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="h-3 w-3" style={{ color: primaryColor }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                    {branch?.opening_time && branch?.closing_time ? (
                      <>
                        <TimeFormat time={branch.opening_time} /> - <TimeFormat time={branch.closing_time} />
                      </>
                    ) : (
                      branch?.opening_hours || 'Open Now'
                    )}
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
                    onClick={onOpenCart}
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
                      {cartCount}
                    </span>
                  </Button>
                </div>
              )}

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                className="h-9 w-9 rounded-full hidden md:flex"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                style={{
                  color: primaryColor,
                  backgroundColor: `${primaryColor}10`
                }}
              >
                {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </Button>

              {/* History Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenHistory}
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
                onClick={onOpenSettings}
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
              <button
                onClick={() => onChangeCategory('all')}
                className={`shrink-0 px-4 py-2 text-sm font-medium rounded-full border transition-all whitespace-nowrap ${activeCategory === 'all'
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

              {categories.slice(0, 8).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => onChangeCategory(cat.id.toString())}
                  className={`shrink-0 px-4 py-2 text-sm font-medium rounded-full border transition-all whitespace-nowrap ${activeCategory === cat.id.toString()
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
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </header>

      {/* Floating Cart Button for Desktop */}
      {cart.length > 0 && (
        <div className="hidden md:block fixed bottom-6 right-6 z-40">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            className="relative"
          >
            <Button
              onClick={onOpenCart}
              size="lg"
              className="h-14 rounded-2xl px-5 shadow-2xl hover:shadow-3xl transition-all duration-300"
              style={{
                backgroundColor: primaryColor,
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                boxShadow: `0 10px 30px ${primaryColor}40`
              }}
            >
              <ShoppingBag className="mr-2 h-5 w-5" />
              View Cart • ${formatPrice(cartTotal)}
              <span
                className="ml-3 h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold animate-pulse"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              >
                {cartCount}
              </span>
            </Button>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Header;