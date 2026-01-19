import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { Button } from "@/components/ui/button";
import { Shield, Check, Tag, ShoppingBag, X } from "lucide-react";

interface OrderStatusOverlayProps {
  activeStatus: string;
  currentAnimation: any;
  primaryColor: string;
  onOrderCollected: () => void;
  onClose: () => void;
  order?: any;
  cart?: any[];
  branch?: any;
}

const OrderStatusOverlay = ({
  activeStatus,
  currentAnimation,
  primaryColor,
  onOrderCollected,
  onClose,
  order,
  cart = [],
  branch
}: OrderStatusOverlayProps) => {
  
  // Safe price formatting function
  const formatPrice = (price: any): string => {
    if (price === null || price === undefined) return "0.00";
    const num = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };
  
  // Safe calculation of item price
  const calculateItemPrice = (item: any): number => {
    if (!item) return 0;
    
    let basePrice = 0;
    
    if (item.selectedSize) {
      basePrice = parseFloat(item.selectedSize.final_price || item.selectedSize.base_price || "0");
    } else if (item.pricing?.effective_price !== undefined) {
      basePrice = parseFloat(item.pricing.effective_price || "0");
    } else if (item.pricing?.branch_product_price !== undefined) {
      basePrice = parseFloat(item.pricing.branch_product_price || "0");
    } else if (item.pricing?.product_base_price !== undefined) {
      basePrice = parseFloat(item.pricing.product_base_price || "0");
    } else {
      basePrice = parseFloat(item.price || "0");
    }
    
    const modifierPrice = (item.selectedModifiers || []).reduce((total: number, modifier: any) => {
      return total + parseFloat(modifier?.price || "0");
    }, 0);
    
    return basePrice + modifierPrice;
  };
  
  // Safe calculation of original price (before discount)
  const calculateItemOriginalPrice = (item: any): number => {
    if (!item) return 0;
    
    let originalPrice = 0;
    
    if (item.selectedSize) {
      originalPrice = parseFloat(item.selectedSize.base_price || item.selectedSize.final_price || "0");
    } else if (item.pricing?.product_base_price !== undefined) {
      originalPrice = parseFloat(item.pricing.product_base_price || "0");
    } else if (item.pricing?.branch_product_price !== undefined) {
      originalPrice = parseFloat(item.pricing.branch_product_price || "0");
    } else if (item.pricing?.effective_price !== undefined) {
      originalPrice = parseFloat(item.pricing.effective_price || "0");
    } else {
      originalPrice = parseFloat(item.price || "0");
    }
    
    const modifierPrice = (item.selectedModifiers || []).reduce((total: number, modifier: any) => {
      return total + parseFloat(modifier?.price || "0");
    }, 0);
    
    return originalPrice + modifierPrice;
  };
  
  // Calculate totals safely
  const calculateTotals = () => {
    if (order && order.subtotal !== undefined) {
      return {
        subtotal: order.subtotal,
        tax: order.tax || 0,
        total: order.total || order.subtotal + (order.tax || 0),
        items: order.items || cart || []
      };
    }
    
    const subtotal = (cart || []).reduce((total, item) => {
      if (!item) return total;
      const itemPrice = calculateItemPrice(item);
      return total + (itemPrice * (item.quantity || 1));
    }, 0);
    
    const taxRate = branch?.tax_is_active ? parseFloat(branch?.tax_rate || "10") : 0;
    const tax = branch?.tax_is_active ? subtotal * (taxRate / 100) : 0;
    const total = subtotal + tax;
    
    return { 
      subtotal, 
      tax, 
      total, 
      items: cart || [] 
    };
  };
  
  const orderDetails = calculateTotals();
  const taxRate = branch?.tax_is_active ? parseFloat(branch?.tax_rate || "10") : 0;
  const taxName = branch?.tax_name || 'Tax';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4 md:p-6 text-center"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 h-10 w-10 rounded-full flex items-center justify-center bg-white/20 dark:bg-slate-800/20 backdrop-blur-sm border border-white/30 dark:border-slate-700/30 hover:bg-white/30 dark:hover:bg-slate-700/30 transition-colors"
        style={{ color: primaryColor }}
      >
        <X size={20} />
      </button>
      
      {/* Animation */}
      <div className="w-48 h-48 md:w-64 md:h-64">
        {currentAnimation && <Lottie animationData={currentAnimation} loop={activeStatus !== 'ready'} />}
      </div>
      
      {/* Status Title */}
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl md:text-3xl font-bold mt-4 md:mt-6 text-slate-900 dark:text-white"
      >
        {activeStatus === 'pending' ? 'Order Sent!' :
         activeStatus === 'cooking' ? 'Cooking in Progress' :
         activeStatus === 'confirmed' ? 'Order Confirmed' :
         'Order Ready!'}
      </motion.h2>
      
      {/* Status Description */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-slate-600 dark:text-slate-300 mt-2 max-w-md text-sm md:text-base"
      >
        {activeStatus === 'pending' ? 'Your order has been received by the kitchen' :
         activeStatus === 'cooking' ? 'Our chefs are preparing your delicious meal' :
         activeStatus === 'confirmed' ? 'Your order has been confirmed!' :
         'Your order is ready for pickup!'}
      </motion.p>
      
      {/* Order Details Summary */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-4 md:mt-6 w-full max-w-md bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 md:h-5 md:w-5" />
            Order Summary
          </h3>
          <span className="text-sm text-slate-500">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        {/* Order Items */}
        <div className="space-y-2 max-h-48 md:max-h-60 overflow-y-auto pr-2">
          {orderDetails.items?.map((item: any, index: number) => {
            if (!item) return null;
            
            const itemPrice = calculateItemPrice(item);
            const originalPrice = calculateItemOriginalPrice(item);
            const hasDiscount = originalPrice > itemPrice && originalPrice > 0;
            const quantity = item.quantity || 1;
            
            return (
              <div key={index} className="flex justify-between items-start pb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="text-left">
                  <div className="font-medium text-sm md:text-base">
                    {quantity}× {item.name || `Item ${index + 1}`}
                  </div>
                  {item.selectedSize?.name && (
                    <div className="text-xs text-slate-500">Size: {item.selectedSize.name}</div>
                  )}
                  {hasDiscount && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs line-through text-slate-400">
                        ${formatPrice(originalPrice)}
                      </span>
                      <span className="text-xs bg-green-100 text-green-600 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                        Save ${formatPrice(originalPrice - itemPrice)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm md:text-base">${formatPrice(itemPrice * quantity)}</div>
                  <div className="text-xs text-slate-500">${formatPrice(itemPrice)} each</div>
                </div>
              </div>
            );
          })}
          
          {(!orderDetails.items || orderDetails.items.length === 0) && (
            <div className="text-center py-4 text-slate-500">
              No items in order
            </div>
          )}
        </div>
        
        {/* Order Totals */}
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300">Subtotal</span>
            <span className="font-medium">${formatPrice(orderDetails.subtotal)}</span>
          </div>
          
          {orderDetails.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">Tax ({taxRate}%)</span>
              <span className="font-medium">${formatPrice(orderDetails.tax)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200 dark:border-slate-700">
            <span>Total</span>
            <span className="text-green-600">${formatPrice(orderDetails.total)}</span>
          </div>
          
          {order?.order_number && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-500">Order #{order.order_number}</div>
              <div className="text-xs text-slate-400 mt-1">Table: {branch?.table_number || 'N/A'}</div>
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Action Buttons */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-6 md:mt-8 flex gap-3 md:gap-4"
      >
        {activeStatus === 'ready' && (
          <Button
            onClick={onOrderCollected}
            className="bg-green-600 hover:bg-green-700 text-white px-6 md:px-8 py-2 md:py-3"
          >
            <Check className="mr-2 h-4 w-4" />
            Order Collected
          </Button>
        )}
        <Button
          onClick={onClose}
          variant={activeStatus === 'ready' ? "outline" : "default"}
          className="px-6 md:px-8 py-2 md:py-3 text-white hover:text-slate-100"
          style={{ backgroundColor: primaryColor }}
        >
          {activeStatus === 'ready' ? 'Close' : 'Order More'}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default OrderStatusOverlay;
