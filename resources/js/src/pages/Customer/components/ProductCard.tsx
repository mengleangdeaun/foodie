import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Star, Tag, UtensilsCrossed, Check } from "lucide-react";

interface ProductCardProps {
  product: any;
  branch: any;
  onAddToCart: (product: any) => void;
}

const ProductCard = ({ product, branch, onAddToCart }: ProductCardProps) => {
  const primaryColor = branch?.primary_color || '#3b82f6';
  const secondaryColor = branch?.secondary_color || '#8b5cf6';
  const accentColor = branch?.accent_color || '#10b981';

  const formatPrice = (price: any): string => {
    if (price === null || price === undefined || price === "") return "0.00";
    const num = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const calculateDisplayPrice = () => {
    const hasSizes = product.sizes && product.sizes.length > 0;
    
    if (hasSizes) {
      const availableSizes = product.sizes.filter((s: any) => s.is_available !== false);
      if (availableSizes.length === 0) return formatPrice(product.pricing.effective_price);
      
      const minPrice = Math.min(...availableSizes.map((s: any) => parseFloat(s.final_price || s.price)));
      return formatPrice(minPrice);
    } else {
      return formatPrice(product.pricing.effective_price);
    }
  };

  const hasSizes = product.sizes && product.sizes.length > 0;
  const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;
  const requiresConfiguration = hasSizes || hasModifiers;

  const handleClick = () => {
    onAddToCart(product);
  };

  const displayPrice = calculateDisplayPrice();
  
  const basePrice = parseFloat(product.pricing.product_base_price || product.pricing.branch_product_price || product.pricing.effective_price);
  const hasDiscount = product.pricing.has_active_discount && product.pricing.discount_percentage > 0;
  const discountAmount = hasDiscount ? basePrice * (product.pricing.discount_percentage / 100) : 0;
  const finalPrice = hasDiscount ? basePrice - discountAmount : basePrice;
  
  const hasSizeDiscount = hasSizes && product.sizes.some((s: any) => 
    s.has_active_discount && s.discount_percentage > 0
  );

  // Get available sizes for price range display
  const availableSizes = hasSizes ? product.sizes.filter((s: any) => s.is_available !== false) : [];
  const sizePrices = availableSizes.map((s: any) => parseFloat(s.final_price || s.price));
  const minSizePrice = sizePrices.length > 0 ? Math.min(...sizePrices) : 0;
  const maxSizePrice = sizePrices.length > 0 ? Math.max(...sizePrices) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 dark:border-slate-700/50"
      style={{
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
      }}
    >
      {/* Gradient Overlay for Glassmorphism */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-white/30 to-transparent dark:from-slate-800/50 dark:via-slate-900/30 pointer-events-none"></div>

      {/* Top Badge Container */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-20 gap-2">
        {/* Left side: Size badge */}
        <div className="flex flex-col gap-1.5">
          {hasSizes && availableSizes.length > 0 && (
            <Badge 
              className="text-[10px] font-semibold px-2.5 py-1 backdrop-blur-md border border-white/30 shadow-sm"
              style={{ 
                backgroundColor: `${primaryColor}25`,
                color: primaryColor
              }}
            >
              {availableSizes.length} Size{availableSizes.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Right side: Discount badge */}
        {(hasDiscount || (hasSizes && hasSizeDiscount)) && (
          <div
            className="text-xs font-bold px-3 py-1.5 rounded-full text-white backdrop-blur-md shadow-lg border border-white/20"
            style={{ backgroundColor: `${accentColor}dd` }}
          >
            {hasSizes ? 'Sale' : `-${product.pricing.discount_percentage}%`}
          </div>
        )}
      </div>

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100/50 to-slate-200/50 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-sm">
        {product.image_path ? (
          <>
            <img
              src={`${product.image_path}`}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 p-4">
            <div className="text-center">
              <div
                className="h-12 w-12 md:h-16 md:w-16 rounded-2xl mb-2 flex items-center justify-center mx-auto backdrop-blur-md border border-white/20"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <UtensilsCrossed size={24} className="md:size-8" style={{ color: primaryColor }} />
              </div>
            </div>
          </div>
        )}

        {/* Quick Add Button - Mobile */}
        <button
          onClick={handleClick}
          className="absolute bottom-3 right-3 h-11 w-11 md:hidden rounded-2xl text-white flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 backdrop-blur-md border border-white/30"
          style={{
            backgroundColor: `${primaryColor}dd`,
            background: `linear-gradient(135deg, ${primaryColor}dd, ${secondaryColor}dd)`
          }}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Product Info */}
      <div className="relative p-4 md:p-5">
        <h3
          className="font-bold text-slate-900 dark:text-white line-clamp-1 text-base md:text-lg mb-2"
          style={{ fontFamily: branch?.font_family_headings }}
        >
          {product.name}
        </h3>

        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-3 min-h-[2.5rem] leading-relaxed">
          {product.short_description || "Delicious dish with premium ingredients"}
        </p>

        {/* Price Display - POS Style */}
        <div className="mb-4 space-y-2">
          {/* For products with sizes */}
          {hasSizes && availableSizes.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-lg md:text-xl font-bold"
                  style={{ color: primaryColor }}
                >
                  ${formatPrice(minSizePrice)}
                  {availableSizes.length > 1 && (
                    <span className="text-base font-semibold ml-1">
                      - ${formatPrice(maxSizePrice)}
                    </span>
                  )}
                </span>
                
                {/* Show base price with discount if applicable */}
                {hasSizeDiscount && availableSizes.length === 1 && (
                  <span className="text-sm text-slate-400 dark:text-slate-500 line-through ml-1">
                    ${formatPrice(availableSizes[0].price)}
                  </span>
                )}
              </div>
              
              {/* Size info */}
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {availableSizes.length} size{availableSizes.length !== 1 ? 's' : ''} available
              </div>
            </div>
          ) : (
            /* For products without sizes */
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-lg md:text-xl font-bold"
                  style={{ color: primaryColor }}
                >
                  ${formatPrice(finalPrice)}
                </span>
                
                {/* Show original price if discounted */}
                {hasDiscount && (
                  <span className="text-sm text-slate-400 dark:text-slate-500 line-through">
                    ${formatPrice(basePrice)}
                  </span>
                )}
              </div>
              
              {/* Discount badge for single price items */}
              {hasDiscount && (
                <div
                  className="text-xs font-bold px-2 py-1 rounded-lg inline-flex items-center gap-1 backdrop-blur-md border border-white/20"
                  style={{
                    backgroundColor: `${accentColor}25`,
                    color: accentColor
                  }}
                >
                  <Tag className="h-3 w-3" />
                  Save ${formatPrice(discountAmount)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add to Cart Button - Desktop */}
        <Button
          onClick={handleClick}
          size="sm"
          className="hidden md:flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold w-full justify-center backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          style={{
            backgroundColor: `${primaryColor}dd`,
            background: `linear-gradient(135deg, ${primaryColor}dd, ${secondaryColor}dd)`
          }}
        >
          {requiresConfiguration ? (
            <>
              <Check size={16} strokeWidth={2.5} />
              Customize Order
            </>
          ) : hasDiscount || hasSizeDiscount ? (
            <>
              <Plus size={16} strokeWidth={2.5} />
              Add • Save ${formatPrice(discountAmount || minSizePrice * 0.1)}
            </>
          ) : (
            <>
              <Plus size={16} strokeWidth={2.5} />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default ProductCard;