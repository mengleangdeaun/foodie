import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, X, UtensilsCrossed, Tag } from "lucide-react";

interface CartItemProps {
  item: any;
  itemPrice?: number;
  itemTotalPrice?: number;
  categories: any[];
  primaryColor: string;
  onUpdateQuantity: (configurationKey: string, delta: number) => void;
  onToggleSmartRemark: (configurationKey: string, presetName: string, option: string) => void;
  onUpdateRemark: (configurationKey: string, remark: string) => void;
  onRemove: (configurationKey: string) => void;
}

const CartItem = ({
  item,
  itemPrice: propItemPrice,
  itemTotalPrice: propItemTotalPrice,
  categories,
  primaryColor,
  onUpdateQuantity,
  onToggleSmartRemark,
  onUpdateRemark,
  onRemove
}: CartItemProps) => {
  const category = categories.find(c => c.id === item.category_id);

  const formatPrice = (price: any): number => {
    if (price === null || price === undefined) return 0;
    const num = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(num) ? 0 : num;
  };

  const formatPriceDisplay = (price: any): string => {
    return formatPrice(price).toFixed(2);
  };

  // Calculate item price including size and modifiers (per item)
  const calculateItemPrice = (): number => {
    // If price is passed as prop, use it (from ConfigurationModal)
    if (propItemPrice !== undefined) {
      return propItemPrice;
    }

    let basePrice = 0;

    // For products with sizes, use selectedSize.final_price (already discounted)
    if (item.selectedSize && item.selectedSize.final_price !== undefined) {
      basePrice = formatPrice(item.selectedSize.final_price);
    }
    // For products without sizes, use pricing.effective_price (already discounted)
    else if (item.pricing?.effective_price !== undefined) {
      basePrice = formatPrice(item.pricing.effective_price);
    }
    // Fallback
    else {
      basePrice = formatPrice(item.price || 0);
    }

    return basePrice;
  };

  // Calculate modifier price for ONE item
  const calculateModifierPrice = (): number => {
    if (!item.selectedModifiers || item.selectedModifiers.length === 0) return 0;

    return item.selectedModifiers.reduce((total: number, modifier: any) => {
      return total + formatPrice(modifier.price);
    }, 0);
  };

  // Calculate total price for the item (price * quantity)
  const calculateItemTotalPrice = (): number => {
    // If total price is passed as prop, use it
    if (propItemTotalPrice !== undefined) {
      return propItemTotalPrice;
    }

    const singleItemPrice = calculateItemPrice() + calculateModifierPrice();
    return singleItemPrice * item.quantity;
  };

  // Use either prop price or calculate it
  const basePrice = calculateItemPrice();
  const modifierPrice = calculateModifierPrice();
  const itemSinglePrice = propItemPrice !== undefined ?
    propItemPrice :
    basePrice + modifierPrice;

  const itemTotalPrice = propItemTotalPrice !== undefined ?
    propItemTotalPrice :
    itemSinglePrice * item.quantity;

  // Calculate base price without modifiers for breakdown
  const getBasePriceWithoutModifiers = (): number => {
    if (item.selectedSize && item.selectedSize.final_price !== undefined) {
      return formatPrice(item.selectedSize.final_price);
    }

    if (item.pricing?.effective_price !== undefined) {
      return formatPrice(item.pricing.effective_price);
    }

    return formatPrice(item.price || 0);
  };

  const basePriceWithoutModifiers = getBasePriceWithoutModifiers();

  // Check if size has discount
  const hasSizeDiscount = item.selectedSize?.has_active_discount &&
    item.selectedSize?.discount_percentage > 0;

  // Check if product (without size) has discount
  const hasProductDiscount = !item.selectedSize &&
    item.pricing?.has_active_discount &&
    item.pricing?.discount_percentage > 0;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: `${primaryColor}05`,
        border: `1px solid ${primaryColor}20`
      }}
    >
      <div className="flex gap-4">
        {/* Item Image */}
        <div className="h-20 w-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 relative">
          {item.image_path ? (
            <>
              <img
                src={item.image_path}
                alt={item.name}
                className="h-full w-full object-cover"
              />
              {/* Branch-specific price indicator */}
              {item.selectedSize?.price_source === 'branch_size' && (
                <div className="absolute top-1 right-1 bg-white/90 dark:bg-slate-800/90 rounded-full p-1">
                  <Tag className="h-3 w-3 text-amber-500" />
                </div>
              )}
            </>
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
              <div className="flex items-center gap-2">
                <h4 className="font-bold">
                  {item.name}
                </h4>
                {/* Discount badge for product without sizes */}
                {hasProductDiscount && (
                  <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">
                    -{item.pricing.discount_percentage}%
                  </span>
                )}
              </div>

              {/* Size display with discount info */}
              {item.selectedSize && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {item.selectedSize.name}
                  </span>
                  {hasSizeDiscount && (
                    <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">
                      -{item.selectedSize.discount_percentage}%
                    </span>
                  )}
                </div>
              )}

              <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                <span style={{ color: primaryColor }} className="font-bold">
                  ${formatPriceDisplay(itemSinglePrice)}
                </span>

                {/* Show original price if discounted */}
                {hasSizeDiscount && item.selectedSize && item.selectedSize.base_price && (
                  <span className="text-xs line-through text-slate-400 dark:text-slate-500 ml-2">
                    ${formatPriceDisplay(item.selectedSize.base_price)}
                  </span>
                )}
                {hasProductDiscount && item.pricing?.product_base_price && (
                  <span className="text-xs line-through text-slate-400 dark:text-slate-500 ml-2">
                    ${formatPriceDisplay(item.pricing.product_base_price)}
                  </span>
                )}

                {/* Modifier count */}
                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                  <span className="text-xs ml-2">
                    + {item.selectedModifiers.length} extra{item.selectedModifiers.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(item.configurationKey)}
              className="h-8 w-8 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
              style={{ color: primaryColor }}
            >
              <X size={16} />
            </Button>
          </div>

          {/* Selected Modifiers */}
          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-slate-500 mb-1">Extras:</p>
              <div className="flex flex-wrap gap-1">
                {item.selectedModifiers.map((modifier: any) => (
                  <span
                    key={modifier.id}
                    className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded flex items-center gap-1"
                  >
                    {modifier.name}
                    {formatPrice(modifier.price) > 0 && (
                      <span className="text-primary font-medium">
                        (+${formatPriceDisplay(modifier.price)})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center justify-between mt-4">
            <div
              className="flex items-center gap-3 rounded-full px-3 py-1"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <button
                onClick={() => onUpdateQuantity(item.configurationKey, -1)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/20"
                style={{ color: primaryColor }}
                disabled={item.quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <span
                className="font-bold min-w-[2rem] text-center"
                style={{ color: primaryColor }}
              >
                {item.quantity}
              </span>
              <button
                onClick={() => onUpdateQuantity(item.configurationKey, 1)}
                className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-white/20"
                style={{ color: primaryColor }}
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="text-right">
              <span
                className="font-bold text-lg"
                style={{ color: primaryColor }}
              >
                ${formatPriceDisplay(itemTotalPrice)}
              </span>
              <div className="text-xs text-slate-500">
                {item.quantity} × ${formatPriceDisplay(itemSinglePrice)}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Smart Remarks */}
      {category?.remark_presets?.length > 0 && (
        <div className="mt-4 space-y-3">
          {category.remark_presets.map((preset: any) => (
            <div key={preset.id}>
              <p
                className="text-xs font-medium mb-2"
                style={{ color: primaryColor }}
              >
                {preset.name}:
              </p>
              <div className="flex flex-wrap gap-2">
                {preset.options.map((opt: string) => {
                  // Ensure selectedRemarks is treated as array or handled gracefully
                  const selections = item.selectedRemarks?.[preset.name];
                  const isSelected = Array.isArray(selections)
                    ? selections.includes(opt)
                    : selections === opt; // Fallback for legacy string state

                  return (
                    <button
                      key={opt}
                      onClick={() => onToggleSmartRemark(item.configurationKey, preset.name, opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isSelected
                          ? 'text-white shadow-sm'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                      style={isSelected ? {
                        backgroundColor: primaryColor,
                        borderColor: primaryColor
                      } : {}}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Remark Input */}
      <div className="mt-4">
        <Input
          placeholder="Special instructions..."
          value={item.customRemark || item.remark || ''}
          onChange={e => onUpdateRemark(item.configurationKey, e.target.value)}
          className="h-10 text-sm"
          style={{ borderColor: `${primaryColor}30` }}
        />
      </div>

      {/* Price breakdown on hover/expand */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-500 space-y-1">
          {/* Base price breakdown */}
          {item.selectedSize ? (
            <div className="flex justify-between">
              <span>{item.name} ({item.selectedSize.name})</span>
              <span>${formatPriceDisplay(item.selectedSize.final_price || item.selectedSize.base_price)}</span>
            </div>
          ) : (
            <div className="flex justify-between">
              <span>{item.name}</span>
              <span>${formatPriceDisplay(basePriceWithoutModifiers)}</span>
            </div>
          )}

          {/* Modifiers breakdown */}
          {item.selectedModifiers?.map((modifier: any) => (
            <div key={modifier.id} className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">+ {modifier.name}</span>
              <span>${formatPriceDisplay(modifier.price)}</span>
            </div>
          ))}

          {/* Total for one item */}
          <div className="flex justify-between font-medium pt-1 border-t border-slate-200 dark:border-slate-700 mt-1">
            <span>Price per item:</span>
            <span>${formatPriceDisplay(itemSinglePrice)}</span>
          </div>

          {/* Quantity multiplier */}
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>× {item.quantity} quantity</span>
            <span>= ${formatPriceDisplay(itemTotalPrice)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;