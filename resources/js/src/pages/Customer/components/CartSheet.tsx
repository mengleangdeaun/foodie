import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, X, Loader2, ChevronRight, UtensilsCrossed, AlertCircle } from "lucide-react";
import CartItem from './CartItem';
import { useState, useEffect, useMemo } from 'react';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  cartTotal: number;
  categories: any[];
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  branch: any;
  activeStatus: string;
  onUpdateQuantity: (configurationKey: string, delta: number) => void; // Change to string
  onRemove: (configurationKey: string) => void; // Change to string
  onUpdateRemark: (configurationKey: string, remark: string) => void; // Change to string
  onToggleSmartRemark: (configurationKey: string, presetName: string, option: string) => void;
  onPlaceOrder: () => void;
}

const CartSheet = ({
  isOpen,
  onClose,
  cart,
  cartTotal,
  categories,
  primaryColor,
  secondaryColor,
  accentColor,
  branch,
  activeStatus,
  onUpdateQuantity,
  onRemove,
  onUpdateRemark,
  onToggleSmartRemark,
  onPlaceOrder
}: CartSheetProps) => {
  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const taxIsActive = Number(branch?.tax_is_active) === 1;
  const taxRate = taxIsActive ? Number(branch?.tax_rate ?? 10) : 0;
  const taxName = branch?.tax_name || 'Tax';

  // Helper function to format and parse prices
  const formatPrice = (price: any): number => {
    if (price === null || price === undefined || price === "") return 0;
    const num = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(num) ? 0 : num;
  };

  const formatPriceDisplay = (price: number): string => {
    return price.toFixed(2);
  };

  // Calculate ORIGINAL price (before any discount)
  const calculateItemOriginalPrice = (item: any): number => {
    let originalBasePrice = 0;
    
    if (item.selectedSize) {
      // Use base_price (original price before discount)
      originalBasePrice = formatPrice(item.selectedSize.base_price || 0);
    } else if (item.sizes && item.sizes.length > 0) {
      // If no size selected but has sizes, find smallest available size's original price
      const availableSizes = item.sizes.filter((s: any) => s.is_available);
      if (availableSizes.length > 0) {
        const smallestSize = availableSizes.reduce((min: any, size: any) => 
          formatPrice(size.base_price) < formatPrice(min.base_price) ? size : min
        );
        originalBasePrice = formatPrice(smallestSize.base_price || 0);
      }
    } else {
      // Product without sizes, use the original price (before discount)
      originalBasePrice = formatPrice(
        item.pricing?.branch_product_price || 
        item.pricing?.product_base_price || 
        item.pricing?.effective_price || 
        item.price || 0
      );
    }
    
    // Add modifier prices (modifiers are not discounted)
    let modifierTotal = 0;
    if (item.selectedModifiers && item.selectedModifiers.length > 0) {
      item.selectedModifiers.forEach((modifier: any) => {
        modifierTotal += formatPrice(modifier.price || 0);
      });
    }
    
    return originalBasePrice + modifierTotal;
  };

  // Calculate FINAL price (after discount)
  const calculateItemPrice = (item: any): number => {
    let basePrice = 0;
    
    // Get base price from selected size or product price
    if (item.selectedSize) {
      // Use final_price (price after discount)
      basePrice = formatPrice(item.selectedSize.final_price || item.selectedSize.base_price || 0);
    } else if (item.sizes && item.sizes.length > 0) {
      // If no size selected but has sizes, find smallest available size
      const availableSizes = item.sizes.filter((s: any) => s.is_available);
      if (availableSizes.length > 0) {
        const smallestSize = availableSizes.reduce((min: any, size: any) => 
          formatPrice(size.final_price || size.base_price) < formatPrice(min.final_price || min.base_price) ? size : min
        );
        basePrice = formatPrice(smallestSize.final_price || smallestSize.base_price || 0);
      }
    } else {
      // Product without sizes, use effective_price (already discounted)
      basePrice = formatPrice(item.pricing?.effective_price || item.pricing?.branch_product_price || item.pricing?.product_base_price || item.price || 0);
    }
    
    // Add modifier prices
    let modifierTotal = 0;
    if (item.selectedModifiers && item.selectedModifiers.length > 0) {
      item.selectedModifiers.forEach((modifier: any) => {
        modifierTotal += formatPrice(modifier.price || 0);
      });
    }
    
    return basePrice + modifierTotal;
  };

  // Calculate item discount amount
  const calculateItemDiscount = (item: any): number => {
    const originalPrice = calculateItemOriginalPrice(item);
    const finalPrice = calculateItemPrice(item);
    return Math.max(0, originalPrice - finalPrice);
  };

  // Calculate totals using useMemo for performance
  const displayCartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const itemPrice = calculateItemPrice(item);
      return total + (itemPrice * item.quantity);
    }, 0);
  }, [cart]);

  const originalSubtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const originalPrice = calculateItemOriginalPrice(item);
      return total + (originalPrice * item.quantity);
    }, 0);
  }, [cart]);

  const totalDiscount = useMemo(() => {
    return cart.reduce((total, item) => {
      const itemDiscount = calculateItemDiscount(item);
      return total + (itemDiscount * item.quantity);
    }, 0);
  }, [cart]);

  // Calculate tax and totals
  const tax = taxIsActive ? displayCartTotal * (taxRate / 100) : 0;
  const totalWithTax = displayCartTotal + tax;

  // Validate cart before placing order - FIXED to make modifiers optional
  const validateCart = (): boolean => {
    const errors: string[] = [];

    // Check if cart is empty
    if (cart.length === 0) {
      errors.push("Your cart is empty");
      setValidationErrors(errors);
      return false;
    }

    // Check each product for configuration requirements
    cart.forEach((item, index) => {
      const itemNumber = index + 1;
      
      // Check if product with sizes has a size selected
      if (item.sizes && item.sizes.length > 0 && !item.selectedSize) {
        errors.push(`Item ${itemNumber}: "${item.name}" requires a size selection`);
      }
      
      // Check modifier group requirements (only if min_selection > 0)
      if (item.modifier_groups && item.modifier_groups.length > 0) {
        item.modifier_groups.forEach((group: any) => {
          const selectedModifiersInGroup = item.selectedModifiers?.filter((mod: any) => 
            group.modifiers.some((gMod: any) => gMod.id === mod.id)
          ) || [];
          
          // Only validate if min_selection is greater than 0 (required)
          if (group.min_selection > 0 && selectedModifiersInGroup.length < group.min_selection) {
            errors.push(`Item ${itemNumber}: "${item.name}" - "${group.name}" requires at least ${group.min_selection} selection(s)`);
          }
          
          // Check maximum selection
          if (group.max_selection > 0 && selectedModifiersInGroup.length > group.max_selection) {
            errors.push(`Item ${itemNumber}: "${item.name}" - "${group.name}" allows maximum ${group.max_selection} selection(s)`);
          }
        });
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handlePlaceOrder = () => {
    if (validateCart()) {
      onPlaceOrder();
    }
  };

  // Clear validation errors when cart changes
  useEffect(() => {
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [cart]);

  // Get total items in cart (sum of quantities)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Check if any item requires configuration
  const hasUnconfiguredItems = cart.some(item => {
    // Check for required size
    if (item.sizes && item.sizes.length > 0 && !item.selectedSize) {
      return true;
    }
    
    // Check for required modifiers (only if min_selection > 0)
    if (item.modifier_groups && item.modifier_groups.length > 0) {
      return item.modifier_groups.some((group: any) => {
        const selectedModifiersInGroup = item.selectedModifiers?.filter((mod: any) => 
          group.modifiers.some((gMod: any) => gMod.id === mod.id)
        ) || [];
        
        // Only consider it unconfigured if min_selection > 0 and not met
        return group.min_selection > 0 && selectedModifiersInGroup.length < group.min_selection;
      });
    }
    
    // Check for required remark
    if (item.is_remark_required && (!item.customRemark || item.customRemark.trim() === '')) {
      return true;
    }
    
    return false;
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className="p-6 border-b sticky top-0 z-10"
            style={{
              borderColor: `${primaryColor}20`,
              backgroundColor: `${primaryColor}05`,
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-2xl font-bold flex items-center gap-2"
                  style={{ color: primaryColor }}
                >
                  <ShoppingBag className="h-6 w-6" />
                  Your Order
                  {cart.length > 0 && (
                    <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
                      ({totalItems} item{totalItems !== 1 ? 's' : ''})
                    </span>
                  )}
                </h2>
                {cart.length > 0 && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span>Subtotal: <span className="font-bold">${formatPriceDisplay(displayCartTotal)}</span></span>
                    {totalDiscount > 0 && (
                      <span className="ml-2 text-green-600">
                        (Saved: ${formatPriceDisplay(totalDiscount)})
                      </span>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-10 w-10 rounded-full"
                style={{ 
                  color: primaryColor,
                  backgroundColor: `${primaryColor}10`
                }}
              >
                <X size={20} />
              </Button>
            </div>
            
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800 dark:text-red-300 text-sm">
                      Please fix the following issues:
                    </p>
                    <ul className="mt-2 space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                          <span className="mt-1">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {/* Configuration Warning */}
            {hasUnconfiguredItems && validationErrors.length === 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Some items require configuration
                  </p>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Please check each item for size selection and modifiers
                </p>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div
                  className="h-20 w-20 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <ShoppingBag className="h-10 w-10" style={{ color: primaryColor }} />
                </div>
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: primaryColor }}
                >
                  Your cart is empty
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                  Add delicious items from our menu to get started
                </p>
                <Button
                  onClick={onClose}
                  className="px-8 py-6 text-base"
                  style={{ 
                    backgroundColor: primaryColor,
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`
                  }}
                >
                  Browse Menu
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {cart.map((item, index) => {
                  // Calculate item price
                  const itemPrice = calculateItemPrice(item);
                  const itemTotalPrice = itemPrice * item.quantity;
                  
                  // Find category for this item to get remark presets
                  const category = categories.find(c => c.id === item.category_id);
                  const categoryRemarkPresets = category?.remark_presets || [];
                  
                  return (
                    <CartItem
                      key={item.configurationKey} // Use configurationKey as key
                      item={item}
                      itemPrice={itemPrice}
                      itemTotalPrice={itemTotalPrice}
                      categories={categories}
                      primaryColor={primaryColor}
                      onUpdateQuantity={onUpdateQuantity}
                      onToggleSmartRemark={onToggleSmartRemark}
                      onUpdateRemark={onUpdateRemark}
                      onRemove={onRemove}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Checkout Footer */}
          {cart.length > 0 && (
            <div
              className="p-6 border-t bg-white dark:bg-slate-900 sticky bottom-0"
              style={{ borderColor: `${primaryColor}20` }}
            >
              <div className="space-y-4">
                {/* Price Breakdown */}
                <div className="space-y-2">
                  {/* Original Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Original Subtotal</span>
                    <span className="font-bold">${formatPriceDisplay(originalSubtotal)}</span>
                  </div>
                  
                  {/* Item Discounts */}
                  {totalDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">Item Discounts</span>
                      <span className="font-bold text-green-600">-${formatPriceDisplay(totalDiscount)}</span>
                    </div>
                  )}
                  
                  {/* Subtotal after discounts */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold">Subtotal ({totalItems} items)</span>
                    <span className="font-bold">${formatPriceDisplay(displayCartTotal)}</span>
                  </div>
                  
                  {/* Tax */}
                  {taxIsActive && tax > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 dark:text-slate-400">
                        {taxName} ({taxRate}%)
                      </span>
                      <span className="font-bold">${formatPriceDisplay(tax)}</span>
                    </div>
                  )}
                  
                  {/* Total */}
                  <div className="flex justify-between items-center text-lg font-bold pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span>Total</span>
                    <span style={{ color: primaryColor }}>${formatPriceDisplay(totalWithTax)}</span>
                  </div>
                </div>
                
                {/* Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  size="lg"
                  className="w-full h-14 mt-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={activeStatus === 'submitting' || hasUnconfiguredItems}
                  style={{ 
                    backgroundColor: primaryColor,
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`,
                    opacity: hasUnconfiguredItems ? 0.7 : 1
                  }}
                >
                  {activeStatus === 'submitting' ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Order...
                    </>
                  ) : (
                    <>
                      Place Order • ${formatPriceDisplay(totalWithTax)}
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                
                {/* Order Note */}
                {hasUnconfiguredItems && (
                  <p className="text-center text-sm text-amber-600 dark:text-amber-400 mt-2">
                    Please configure all items before placing order
                  </p>
                )}
                
                {/* Terms */}
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                  By placing order, you agree to our terms and conditions
                </p>
                
                {/* Branch Info */}
                <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-400 dark:text-slate-500">
                  <UtensilsCrossed className="h-3 w-3" />
                  <span>Ordering from {branch?.branch_name}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
