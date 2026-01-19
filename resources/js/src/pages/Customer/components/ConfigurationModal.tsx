import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Tag } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Modifier {
  id: number;
  name: string;
  price: number | string;
  description?: string;
}

interface ModifierGroup {
  id: number;
  name: string;
  selection_type: string;
  min_selection: number;
  max_selection: number;
  modifiers: Modifier[];
}

interface ProductSize {
  id: number;
  name: string;
  base_price: number;
  final_price: number;
  discount_percentage: number;
  has_active_discount: boolean;
  is_available: boolean;
  price_source?: string;
  discount_source?: string;
  has_branch_product_size_record?: boolean;
}

interface ProductPricing {
  base_price: number;
  effective_price: number;
  has_active_discount: boolean;
  discount_percentage: number;
}

interface RemarkPreset {
  id: number;
  name: string;
  options: string[];
  type: string;
  is_required: boolean;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  pricing: ProductPricing;
  sizes?: ProductSize[];
  modifier_groups?: ModifierGroup[];
  is_remark_required?: boolean;
  remark_preset?: string;
  category_id?: number;
}

interface ConfigurationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  selectedSize: ProductSize | null;
  selectedModifiers: number[];
  customRemark: string;
  selectedRemarks?: Record<string, string>; // Added for remark presets
  remarkPresets?: RemarkPreset[]; // Added for remark presets
  onSizeChange: (size: ProductSize | null) => void;
  onModifierToggle: (modifierId: number) => void;
  onRemarkChange: (remark: string) => void;
  onRemarkPresetChange?: (presetName: string, option: string) => void; // Added for remark presets
  onAddToCart: (product: Product, size: ProductSize | null, modifiers: Modifier[], remark: string, totalPrice: number) => void;
}

const ConfigurationModal = ({
  product,
  isOpen,
  onClose,
  selectedSize,
  selectedModifiers,
  customRemark,
  selectedRemarks = {},
  remarkPresets = [],
  onSizeChange,
  onModifierToggle,
  onRemarkChange,
  onRemarkPresetChange,
  onAddToCart
}: ConfigurationModalProps) => {
  const [tempSize, setTempSize] = useState<ProductSize | null>(null);
  const [tempModifiers, setTempModifiers] = useState<number[]>([]);
  const [tempRemark, setTempRemark] = useState('');
  const [tempSelectedRemarks, setTempSelectedRemarks] = useState<Record<string, string>>({});
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [errors, setErrors] = useState<{
    size?: string;
    modifiers?: string;
    remark?: string;
    remarkPresets?: string[];
  }>({});
  
  // Track if we've initialized from props
  const [hasInitialized, setHasInitialized] = useState(false);

  const formatPrice = (price: any): number => {
    if (price === null || price === undefined) return 0;
    const num = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(num) ? 0 : num;
  };

  const formatPriceDisplay = (price: any): string => {
    return formatPrice(price).toFixed(2);
  };

  const calculateTotalPrice = (size: ProductSize | null, modifiers: number[]): number => {
    if (!product) return 0;
    
    let basePrice = 0;
    
    // Get base price from selected size or product
    if (size) {
      // Use the discounted price (final_price)
      basePrice = formatPrice(size.final_price);
    } else if (product.sizes && product.sizes.length > 0) {
      // If product has sizes but none selected, find the smallest available size for price calculation
      const availableSizes = product.sizes.filter((s: ProductSize) => s.is_available);
      if (availableSizes.length > 0) {
        // Find the smallest price size for calculation
        const smallestSize = availableSizes.reduce((min: ProductSize, current: ProductSize) => 
          formatPrice(current.final_price) < formatPrice(min.final_price) ? current : min
        );
        basePrice = formatPrice(smallestSize.final_price);
      }
    } else {
      // Product without sizes, use effective_price (already discounted)
      basePrice = formatPrice(product.pricing.effective_price);
    }

    // Add modifier prices
    let modifierTotal = 0;
    modifiers.forEach(modifierId => {
      let foundModifier: Modifier | null = null;
      for (const group of product.modifier_groups || []) {
        const modifier = group.modifiers.find((m: Modifier) => m.id === modifierId);
        if (modifier) {
          foundModifier = modifier;
          break;
        }
      }
      if (foundModifier) {
        modifierTotal += formatPrice(foundModifier.price);
      }
    });

    return basePrice + modifierTotal;
  };

  // Calculate total price whenever tempSize or tempModifiers change
  useEffect(() => {
    if (product) {
      const price = calculateTotalPrice(tempSize, tempModifiers);
      setTotalPrice(price);
    }
  }, [product, tempSize, tempModifiers]);

  // Initialize temp state from props ONLY when product changes
  useEffect(() => {
    if (product && !hasInitialized) {
      setTempSize(selectedSize);
      setTempModifiers([...selectedModifiers]);
      setTempRemark(customRemark);
      setTempSelectedRemarks({...selectedRemarks});
      setHasInitialized(true);
    }
  }, [product, hasInitialized, selectedSize, selectedModifiers, customRemark, selectedRemarks]);

  // Reset initialization when modal closes or product changes
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
    }
  }, [isOpen]);

  // Reset everything when product changes
  useEffect(() => {
    if (product) {
      setTempSize(selectedSize);
      setTempModifiers([...selectedModifiers]);
      setTempRemark(customRemark);
      setTempSelectedRemarks({...selectedRemarks});
      setHasInitialized(true);
    }
  }, [product]);

  if (!product) return null;

  const getSelectedModifierObjects = (): Modifier[] => {
    if (!product.modifier_groups || tempModifiers.length === 0) return [];
    
    const modifiers: Modifier[] = [];
    
    tempModifiers.forEach(modifierId => {
      for (const group of product.modifier_groups || []) {
        const modifier = group.modifiers.find((m: Modifier) => m.id === modifierId);
        if (modifier) {
          modifiers.push(modifier);
          break;
        }
      }
    });
    
    return modifiers;
  };

  const handleRemarkPresetSelect = (presetName: string, option: string) => {
    const newRemarks = { ...tempSelectedRemarks, [presetName]: option };
    setTempSelectedRemarks(newRemarks);
    
    // Call parent handler if provided
    if (onRemarkPresetChange) {
      onRemarkPresetChange(presetName, option);
    }
    
    // Clear remark preset errors when user interacts with them
    if (errors.remarkPresets) {
      setErrors(prev => ({ ...prev, remarkPresets: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const remarkPresetErrors: string[] = [];

    // Validate size if product has sizes
    if (product.sizes && product.sizes.length > 0 && !tempSize) {
      newErrors.size = "Please select a size";
    }

    // Validate modifiers based on group rules (only check if min_selection > 0)
    if (product.modifier_groups) {
      for (const group of product.modifier_groups) {
        const selectedInGroup = tempModifiers.filter(id => 
          group.modifiers.some((m: Modifier) => m.id === id)
        ).length;
        
        // Only validate if min_selection is greater than 0 (required)
        if (group.min_selection > 0 && selectedInGroup < group.min_selection) {
          newErrors.modifiers = `Please select at least ${group.min_selection} item(s) from "${group.name}"`;
          break;
        }
        
        // Check maximum selection if set
        if (group.max_selection > 0 && selectedInGroup > group.max_selection) {
          newErrors.modifiers = `You can select at most ${group.max_selection} item(s) from "${group.name}"`;
          break;
        }
      }
    }

    // Validate remark presets
    if (remarkPresets && remarkPresets.length > 0) {
      remarkPresets.forEach((preset: RemarkPreset) => {
        if (preset.is_required && !tempSelectedRemarks[preset.name]) {
          remarkPresetErrors.push(`Please select an option for "${preset.name}"`);
        }
      });
      
      if (remarkPresetErrors.length > 0) {
        newErrors.remarkPresets = remarkPresetErrors;
      }
    }

    // Validate custom remark if required
    if (product.is_remark_required && !tempRemark.trim()) {
      newErrors.remark = product.remark_preset || "Special instructions are required for this product";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddToCart = () => {
    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    // If product has sizes but no size selected, auto-select the smallest available size
    let finalSize = tempSize;
    if (!tempSize && product.sizes && product.sizes.length > 0) {
      const availableSizes = product.sizes.filter((s: ProductSize) => s.is_available);
      if (availableSizes.length > 0) {
        finalSize = availableSizes.reduce((min: ProductSize, size: ProductSize) => 
          formatPrice(size.final_price) < formatPrice(min.final_price) ? size : min
        );
        setTempSize(finalSize);
      }
    }
    
    const selectedModifierObjects = getSelectedModifierObjects();
    
    // Update parent component state
    if (finalSize && finalSize !== selectedSize) {
      onSizeChange(finalSize);
    }
    
    // Check if modifiers have changed
    if (JSON.stringify(tempModifiers) !== JSON.stringify(selectedModifiers)) {
      // First, toggle off any modifiers that are no longer selected
      selectedModifiers.forEach(id => {
        if (!tempModifiers.includes(id)) {
          onModifierToggle(id);
        }
      });
      // Then, toggle on any new modifiers
      tempModifiers.forEach(id => {
        if (!selectedModifiers.includes(id)) {
          onModifierToggle(id);
        }
      });
    }
    
    if (tempRemark !== customRemark) {
      onRemarkChange(tempRemark);
    }
    
    // Build remark string from presets
    const presetRemarkString = Object.entries(tempSelectedRemarks)
      .map(([key, value]) => `[${key}: ${value}]`)
      .join(' ');
    
    const finalRemark = presetRemarkString ? 
      `${presetRemarkString} ${tempRemark}`.trim() : 
      tempRemark;
    
    // Pass the calculated totalPrice to the cart (price per item)
    onAddToCart(product, finalSize, selectedModifierObjects, finalRemark, totalPrice);
    onClose();
  };

  const getModifierById = (modifierId: number): Modifier | null => {
    if (!product.modifier_groups) return null;
    
    for (const group of product.modifier_groups) {
      const modifier = group.modifiers.find((m: Modifier) => m.id === modifierId);
      if (modifier) return modifier;
    }
    return null;
  };

  const getSizeDisplayPrice = (size: ProductSize): string => {
    return `${formatPriceDisplay(size.final_price)}`;
  };

  const handleSizeSelect = (size: ProductSize) => {
    setTempSize(size);
    // Also update parent immediately so it knows about the selection
    onSizeChange(size);
    // Clear size error when user selects a size
    if (errors.size) {
      setErrors(prev => ({ ...prev, size: undefined }));
    }
  };

  const handleModifierToggle = (modifierId: number) => {
    const newModifiers = tempModifiers.includes(modifierId)
      ? tempModifiers.filter(id => id !== modifierId)
      : [...tempModifiers, modifierId];
    setTempModifiers(newModifiers);
    
    // Also update parent immediately
    onModifierToggle(modifierId);
    
    // Clear modifier errors when user interacts with modifiers
    if (errors.modifiers) {
      setErrors(prev => ({ ...prev, modifiers: undefined }));
    }
  };

  const handleRemarkChange = (value: string) => {
    setTempRemark(value);
    // Also update parent immediately
    onRemarkChange(value);
    // Clear remark error when user types
    if (errors.remark) {
      setErrors(prev => ({ ...prev, remark: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize {product.name}</DialogTitle>
          <DialogDescription>
            Select size and add extras as needed
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Display errors */}
          {(errors.size || errors.modifiers || errors.remark || errors.remarkPresets) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-1">
                {errors.size && <div>{errors.size}</div>}
                {errors.modifiers && <div>{errors.modifiers}</div>}
                {errors.remark && <div>{errors.remark}</div>}
                {errors.remarkPresets && errors.remarkPresets.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Select Size</h3>
                {errors.size && (
                  <span className="text-xs text-red-500">Required</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {product.sizes
                  .filter((size: ProductSize) => size.is_available)
                  .map((size: ProductSize) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleSizeSelect(size)}
                      className={`p-3 rounded-lg border text-left transition-all relative ${
                        tempSize?.id === size.id 
                          ? 'bg-primary text-white border-primary' 
                          : 'border-slate-200 hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-800'
                      } ${errors.size ? 'border-red-300' : ''}`}
                    >
                      <div className="font-medium">{size.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm ${
                          tempSize?.id === size.id ? 'text-white' : 'text-primary font-semibold'
                        }`}>
                          ${getSizeDisplayPrice(size)}
                        </span>
                        {size.has_active_discount && size.discount_percentage > 0 && (
                          <>
                            <span className={`text-xs line-through ${
                              tempSize?.id === size.id ? 'text-white/70' : 'text-slate-400'
                            }`}>
                              ${formatPriceDisplay(size.base_price)}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                              tempSize?.id === size.id 
                                ? 'bg-white/20 text-white' 
                                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                            }`}>
                              -{size.discount_percentage}%
                            </span>
                          </>
                        )}
                      </div>
                      {/* Branch-specific price indicator */}
                      {size.price_source === 'branch_size' && (
                        <div className="absolute top-1 right-1">
                          <Tag className="h-3 w-3 text-amber-500" />
                        </div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}
          
          {/* Modifier Groups */}
          {product.modifier_groups && product.modifier_groups.length > 0 && (
            <div className="space-y-4">
              {product.modifier_groups.map((group: ModifierGroup) => (
                <div key={group.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{group.name}</h3>
                      {group.min_selection === 0 && (
                        <span className="text-xs text-slate-500">(Optional)</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {group.min_selection > 0 && `Min: ${group.min_selection}`}
                      {group.max_selection > 0 && ` • Max: ${group.max_selection}`}
                      {group.selection_type && ` • ${group.selection_type}`}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.modifiers.map((modifier: Modifier) => (
                      <div 
                        key={modifier.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                          tempModifiers.includes(modifier.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 hover:border-primary'
                        }`}
                        onClick={() => handleModifierToggle(modifier.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                            tempModifiers.includes(modifier.id) 
                              ? 'bg-primary border-primary' 
                              : 'border-slate-300'
                          }`}>
                            {tempModifiers.includes(modifier.id) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium">{modifier.name}</span>
                            {modifier.description && (
                              <p className="text-xs text-slate-500">{modifier.description}</p>
                            )}
                          </div>
                        </div>
                        {formatPrice(modifier.price) > 0 && (
                          <span className="font-semibold">+${formatPriceDisplay(modifier.price)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Remark Presets */}
          {remarkPresets && remarkPresets.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Additional Options</h3>
              <div className="space-y-3">
                {remarkPresets.map((preset: RemarkPreset) => (
                  <div key={preset.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{preset.name}</h4>
                          {Number(preset.is_required) === 1 && (
                            <span className="text-xs text-red-500">Required</span>
                          )}

                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preset.options.map((option: string) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleRemarkPresetSelect(preset.name, option)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            tempSelectedRemarks[preset.name] === option 
                              ? 'text-white shadow-sm' 
                              : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                          }`}
                          style={tempSelectedRemarks[preset.name] === option ? { 
                            backgroundColor: '#3b82f6',
                            borderColor: '#3b82f6'
                          } : {}}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
{Number(preset.is_required) === 1 &&
 !tempSelectedRemarks[preset.name] &&
 errors.remarkPresets && (
  <p className="text-xs text-red-500">
    Please select an option for {preset.name}
  </p>
)}


                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Custom Remark */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Special Instructions</h3>
              {product.is_remark_required && (
                <span className="text-xs text-red-500">Required</span>
              )}
            </div>
            <Input
              placeholder={product.remark_preset || "Any special requests? (e.g., no onions, extra sauce)"}
              value={tempRemark}
              onChange={(e) => handleRemarkChange(e.target.value)}
              className={`w-full ${errors.remark ? 'border-red-300' : ''}`}
              maxLength={200}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-500">
                {tempRemark.length}/200 characters
              </p>
              {product.is_remark_required && !tempRemark.trim() && (
                <p className="text-xs text-red-500">
                  {product.remark_preset || "Special instructions are required"}
                </p>
              )}
            </div>
          </div>
          
          {/* Price Summary */}
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold text-primary">
                ${formatPriceDisplay(totalPrice)}
              </span>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
              <p>
                {tempModifiers.length} modifier{tempModifiers.length !== 1 ? 's' : ''} selected
                {tempSize && ` • ${tempSize.name} size`}
              </p>
              <div className="text-xs space-y-1">
                {/* Base price breakdown */}
                {tempSize && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      {tempSize.name}
                      {tempSize.has_active_discount && tempSize.discount_percentage > 0 && (
                        <span className="text-red-500">({tempSize.discount_percentage}% off)</span>
                      )}
                    </span>
                    <span>${formatPriceDisplay(tempSize.final_price)}</span>
                  </div>
                )}
                {!tempSize && (!product.sizes || product.sizes.length === 0) && (
                  <div className="flex justify-between">
                    <span>{product.name}</span>
                    {product.pricing.has_active_discount && product.pricing.discount_percentage > 0 && (
                      <span className="text-red-500">({product.pricing.discount_percentage}% off)</span>
                    )}
                    <span>${formatPriceDisplay(product.pricing.effective_price)}</span>
                  </div>
                )}
                {/* Modifier breakdown */}
                {tempModifiers.map(id => {
                  const modifier = getModifierById(id);
                  return modifier ? (
                    <div key={id} className="flex justify-between">
                      <span className="text-slate-600">+ {modifier.name}</span>
                      <span>${formatPriceDisplay(modifier.price)}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="outline"
            onClick={handleAddToCart}
            className="flex-1"
            disabled={product.sizes && product.sizes.length > 0 && !tempSize}
          >
            Add to Cart - ${formatPriceDisplay(totalPrice)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationModal;