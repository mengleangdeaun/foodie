import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Tag, ChevronDown, ChevronUp, Info } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
  selectedRemarks?: Record<string, string>;
  remarkPresets?: RemarkPreset[];
  // Removed immediate callbacks to prevent state synchronization issues
  // onSizeChange: (size: ProductSize | null) => void;
  // onModifierToggle: (modifierId: number) => void;
  // onRemarkChange: (remark: string) => void;
  // onRemarkPresetChange?: (presetName: string, option: string) => void;
  onAddToCart: (product: Product, size: ProductSize | null, modifiers: Modifier[], remark: string, totalPrice: number) => void;
}

const ConfigurationModal = ({
  product,
  isOpen,
  onClose,
  selectedSize, // Initial values only
  selectedModifiers, // Initial values only
  customRemark, // Initial values only
  selectedRemarks = {}, // Initial values only
  remarkPresets = [],
  onAddToCart
}: ConfigurationModalProps) => {
  const [tempSize, setTempSize] = useState<ProductSize | null>(null);
  const [tempModifiers, setTempModifiers] = useState<number[]>([]);
  const [tempRemark, setTempRemark] = useState('');
  const [tempSelectedRemarks, setTempSelectedRemarks] = useState<Record<string, string[]>>({});
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [errors, setErrors] = useState<{
    size?: string;
    modifiers?: string;
    remark?: string;
    remarkPresets?: string[];
  }>({});

  // Collapsed state for modifier groups to make mobile navigation easier
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({});

  const formatPrice = (price: any): number => {
    if (price === null || price === undefined) return 0;
    const num = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(num) ? 0 : num;
  };

  const formatPriceDisplay = (price: any): string => {
    return formatPrice(price).toFixed(2);
  };

  // One-time initialization when modal opens or product changes
  useEffect(() => {
    if (product && isOpen) {
      setTempSize(selectedSize);
      setTempModifiers([...selectedModifiers]);
      setTempRemark(customRemark);

      // Convert initial selectedRemarks (if they were flat strings) to arrays if needed
      // Assuming incoming selectedRemarks might be just { key: "value" } from legacy
      // We want to support { key: ["value1", "value2"] } ideally, but if props are Record<string, string>, we parse it.
      // But looking at props: selectedRemarks?: Record<string, string>;
      // So we need to handle the conversion initial load.
      const initialRemarks: Record<string, string[]> = {};
      Object.entries(selectedRemarks).forEach(([key, value]) => {
        // If the string looks like "[val1, val2]", we might need parsing, 
        // but usually it's passed as simple string for single.
        // For now, let's treat the incoming string as a single item array 
        // unless we decide to change the prop type upstream.
        // Since the prompt is about fixing selection, let's assume valid state starts empty or 
        // simple 1-1 mapping for now.
        if (value) initialRemarks[key] = [value];
      });
      setTempSelectedRemarks(initialRemarks);
      setErrors({});
      // Reset collapsed state
      setCollapsedGroups({});
    }
  }, [product, isOpen]); // Only depend on isOpen and product to reset

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

  // Update total price when local state changes
  useEffect(() => {
    if (product) {
      const price = calculateTotalPrice(tempSize, tempModifiers);
      setTotalPrice(price);
    }
  }, [product, tempSize, tempModifiers]);

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

  const handleRemarkPresetSelect = (presetName: string, presetType: string, option: string) => {
    setTempSelectedRemarks(prev => {
      const currentSelections = prev[presetName] || [];
      let newSelections: string[];

      if (presetType === 'single') {
        // Toggle behavior for single selection
        if (currentSelections.includes(option)) {
          newSelections = [];
        } else {
          newSelections = [option];
        }
      } else {
        // Multiple selection behavior
        if (currentSelections.includes(option)) {
          newSelections = currentSelections.filter(item => item !== option);
        } else {
          newSelections = [...currentSelections, option];
        }
      }

      return { ...prev, [presetName]: newSelections };
    });

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

    // Validate modifiers based on group rules
    if (product.modifier_groups) {
      for (const group of product.modifier_groups) {
        const selectedInGroup = tempModifiers.filter(id =>
          group.modifiers.some((m: Modifier) => m.id === id)
        ).length;

        if (group.min_selection > 0 && selectedInGroup < group.min_selection) {
          newErrors.modifiers = `Please select at least ${group.min_selection} item(s) from "${group.name}"`;
          break;
        }

        if (group.max_selection > 0 && selectedInGroup > group.max_selection) {
          newErrors.modifiers = `Max ${group.max_selection} item(s) allowed from "${group.name}"`;
          break;
        }
      }
    }

    // Validate remark presets
    if (remarkPresets && remarkPresets.length > 0) {
      remarkPresets.forEach((preset: RemarkPreset) => {
        const selections = tempSelectedRemarks[preset.name] || [];
        if (preset.is_required && selections.length === 0) {
          remarkPresetErrors.push(`${preset.name} is required`);
        }
      });

      if (remarkPresetErrors.length > 0) {
        newErrors.remarkPresets = remarkPresetErrors;
      }
    }

    // Validate custom remark
    if (product.is_remark_required && !tempRemark.trim()) {
      newErrors.remark = product.remark_preset || "Special instructions are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddToCart = () => {
    setErrors({});

    if (!validateForm()) {
      // Scroll to top of error if needed (simple implementation)
      return;
    }

    // Auto-select smallest size if none selected (should be caught by validation, but safe fallback)
    let finalSize = tempSize;
    if (!tempSize && product.sizes && product.sizes.length > 0) {
      const availableSizes = product.sizes.filter((s: ProductSize) => s.is_available);
      if (availableSizes.length > 0) {
        finalSize = availableSizes.reduce((min: ProductSize, size: ProductSize) =>
          formatPrice(size.final_price) < formatPrice(min.final_price) ? size : min
        );
      }
    }

    const selectedModifierObjects = getSelectedModifierObjects();

    // Build remark string
    const presetRemarkString = Object.entries(tempSelectedRemarks)
      .map(([key, values]) => {
        if (values.length === 0) return null;
        return `[${key}: ${values.join(', ')}]`;
      })
      .filter(Boolean)
      .join(' ');

    const finalRemark = presetRemarkString ?
      `${presetRemarkString} ${tempRemark}`.trim() :
      tempRemark;

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

  const handleSizeSelect = (size: ProductSize) => {
    setTempSize(size);
    if (errors.size) setErrors(prev => ({ ...prev, size: undefined }));
  };

  const handleModifierToggle = (modifierId: number) => {
    if (!product || !product.modifier_groups) return;

    // Find the group this modifier belongs to
    let group: ModifierGroup | undefined;
    for (const g of product.modifier_groups) {
      if (g.modifiers.some((m: Modifier) => m.id === modifierId)) {
        group = g;
        break;
      }
    }

    if (!group) return;

    const isSelected = tempModifiers.includes(modifierId);

    // Handle Logic based on selection_type
    // If selection_type is 'single', it acts like a radio button (max_selection is typically 1)
    // If selection_type is 'multiple', it acts like a checkbox

    // Fallback: if selection_type is missing, infer from max_selection
    const isSingleSelection = group.selection_type === 'single' || group.max_selection === 1;

    if (isSingleSelection) {
      // Radio Behavior: Auto-deselect others in the same group
      if (isSelected) {
        // Allow deselecting only if min_selection is 0 (optional)
        // If min_selection > 0, we generally don't want to allow deselecting the last item by clicking it again
        // However, standard ratio behavior usually doesn't allow deselecting.
        // Let's allow deselecting for now, validation will catch empty required groups.
        setTempModifiers(prev => prev.filter(id => id !== modifierId));
      } else {
        // Select this one, remove any other modifiers from this group
        const groupModifierIds = group.modifiers.map(m => m.id);
        setTempModifiers(prev => [
          ...prev.filter(id => !groupModifierIds.includes(id)), // Remove others from this group
          modifierId // Add new one
        ]);
      }
    } else {
      // Checkbox Behavior
      if (isSelected) {
        setTempModifiers(prev => prev.filter(id => id !== modifierId));
      } else {
        // Check limit if max_selection > 0
        if (group.max_selection > 0) {
          const currentCount = tempModifiers.filter(id =>
            group!.modifiers.some(m => m.id === id)
          ).length;

          if (currentCount >= group.max_selection) {
            // Limit reached
            // Optional: User feedback
            return;
          }
        }
        setTempModifiers(prev => [...prev, modifierId]);
      }
    }

    if (errors.modifiers) setErrors(prev => ({ ...prev, modifiers: undefined }));
  };

  const toggleGroupCollapse = (groupId: number) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed z-50 grid w-full h-[100dvh] max-w-none gap-0 border bg-white p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl md:w-full  md:max-w-lg md:h-auto md:max-h-[85vh] dark:bg-slate-900 border-0 md:border md:translate-x-[-50%] md:translate-y-[-50%] md:top-[50%] md:left-[50%] top-0 left-0 translate-x-0 translate-y-0 flex flex-col focus:outline-none">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20 space-y-0">
          <div>
            <DialogTitle className="text-lg md:text-xl font-bold line-clamp-1 text-left mr-8">
              {product.name}
            </DialogTitle>
            {product.description && (
              <DialogDescription className="text-sm text-slate-500 line-clamp-2 text-left mt-1">
                {product.description}
              </DialogDescription>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0"
          >
            <ChevronDown className="h-5 w-5 md:hidden" /> {/* Show ChevronDown on Mobile implies "Dismiss sheet" feel */}
            <span className="sr-only">Close</span>
            <div className="hidden md:block text-lg px-2">✕</div>
          </Button>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide pb-32 md:pb-6">


          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10 py-2">
                <h3 className="font-bold text-base flex items-center gap-2">
                  Select Size
                  {errors.size && <span className="text-xs text-red-500 font-normal bg-red-50 px-2 py-0.5 rounded-full border border-red-100 dark:bg-red-900/20 dark:border-red-800">Required</span>}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {product.sizes
                  .filter((size: ProductSize) => size.is_available)
                  .map((size: ProductSize) => {
                    const isSelected = tempSize?.id === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => handleSizeSelect(size)}
                        className={`
                          relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200
                          ${isSelected
                            ? 'border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(59,130,246,0.1)] dark:bg-primary/10'
                            : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }
                          ${errors.size ? 'border-red-200 bg-red-50 dark:bg-red-900/10' : ''}
                        `}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`
                            w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-200
                            ${isSelected
                              ? 'border-primary bg-primary scale-110'
                              : 'border-slate-300 dark:border-slate-600'
                            }
                          `}>
                            {/* Replaced 'white dot' with Check icon for clarity causing less ambiguity */}
                            {isSelected && <Check className="h-3 w-3 text-primary stroke-[3]" />}
                          </div>
                          <div className="text-left">
                            <div className={`font-semibold text-[15px] ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>
                              {size.name}
                            </div>
                            {size.has_active_discount && size.discount_percentage > 0 && (
                              <div className="text-xs text-green-500 font-medium mt-0.5 flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Save {size.discount_percentage}%
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`font-bold text-[15px] ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                            ${formatPriceDisplay(size.final_price)}
                          </div>
                          {size.has_active_discount && size.discount_percentage > 0 && (
                            <div className="text-xs text-slate-400 line-through mt-0.5">
                              ${formatPriceDisplay(size.base_price)}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          <Separator className="bg-slate-100 dark:bg-slate-800" />

          {/* Modifier Groups */}
          {product.modifier_groups && product.modifier_groups.length > 0 && (
            <div className="space-y-6">
              {product.modifier_groups.map((group: ModifierGroup) => {
                const isGroupCollapsed = collapsedGroups[group.id];
                const selectedCount = tempModifiers.filter(id =>
                  group.modifiers.some(m => m.id === id)
                ).length;

                return (
                  <div key={group.id} className="space-y-3">
                    <div
                      className="flex justify-between items-center cursor-pointer sticky top-0 bg-white dark:bg-slate-900 z-10 py-2 select-none"
                      onClick={() => toggleGroupCollapse(group.id)}
                    >
                      <div>
                        <h3 className="font-bold text-base flex items-center gap-2">
                          {group.name}
                          {selectedCount > 0 && (
                            <Badge className="h-5 px-1.5 text-[10px] bg-primary text-primary hover:bg-primary border">
                              {selectedCount}
                            </Badge>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          {group.min_selection > 0 ? (
                            <span className="text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">Required</span>
                          ) : <span className="text-slate-400 text-[10px] uppercase tracking-wide">Optional</span>}
                          <span className="text-slate-300">•</span>
                          <span>
                            {group.min_selection > 0 && `Min ${group.min_selection}`}
                            {group.min_selection > 0 && group.max_selection > 0 && ' - '}
                            {group.max_selection > 0 && `Max ${group.max_selection}`}
                          </span>
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                        {isGroupCollapsed ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronUp className="h-4 w-4 text-slate-500" />}
                      </Button>
                    </div>

                    {!isGroupCollapsed && (
                      <div className="space-y-2.5 animate-in slide-in-from-top-1 fade-in duration-200">
                        {group.modifiers.map((modifier: Modifier) => {
                          const isSelected = tempModifiers.includes(modifier.id);
                          return (
                            <div
                              key={modifier.id}
                              className={`
                                flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer active:scale-[0.98]
                                ${isSelected
                                  ? 'border-primary bg-primary/5 shadow-sm dark:bg-primary/10'
                                  : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                }
                              `}
                              onClick={() => handleModifierToggle(modifier.id)}
                            >
                              <div className="flex items-center gap-3.5">
                                <div className={`
                                  h-5 w-5 rounded border-[1.5px] flex items-center justify-center shrink-0 transition-colors duration-200
                                  ${isSelected
                                    ? 'bg-primary border-primary'
                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                  }
                                `}>
                                  {isSelected && <Check className="h-3.5 w-3.5 text-primary stroke-[3]" />}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`font-semibold text-[15px] ${isSelected ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {modifier.name}
                                  </span>
                                  {modifier.description && (
                                    <p className="text-xs text-slate-500">{modifier.description}</p>
                                  )}
                                </div>
                              </div>
                              {formatPrice(modifier.price) > 0 && (
                                <span className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>
                                  +${formatPriceDisplay(modifier.price)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              <Separator className="bg-slate-100 dark:bg-slate-800" />
            </div>
          )}

          {/* Remark Presets & Custom Remark */}
          <div className="space-y-6 pb-4">
            {remarkPresets && remarkPresets.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-bold text-base">Additionals</h3>
                {remarkPresets.map((preset: RemarkPreset) => (
                  <div key={preset.id} className="space-y-3">
                    <label className="text-sm font-medium flex gap-2 text-slate-700 dark:text-slate-300">
                      {preset.name}
                      {!!preset.is_required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {preset.options.map((option: string) => {
                        const currentSelections = tempSelectedRemarks[preset.name] || [];
                        const isSelected = currentSelections.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleRemarkPresetSelect(preset.name, preset.type, option)}
                            className={`
                              px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200
                              ${isSelected
                                ? 'border-primary bg-primary/5 text-primary shadow-sm dark:bg-primary/10'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                              }
                            `}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                Special Instructions
                {product.is_remark_required && <span className="text-xs text-red-500 font-normal bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Required</span>}
              </h3>
              <Input
                placeholder={product.remark_preset || "e.g., No onions, sauce on side..."}
                value={tempRemark}
                onChange={(e) => {
                  setTempRemark(e.target.value);
                  if (errors.remark) setErrors(prev => ({ ...prev, remark: undefined }));
                }}
                className={`w-full h-12 text-base rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 focus:ring-2 focus:ring-primary/20 ${errors.remark ? 'border-red-300 bg-red-50' : ''}`}
                maxLength={200}
              />
              <p className="text-xs text-right text-slate-400">
                {tempRemark.length}/200
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom 
            Using 'fixed bottom-0' for mobile to guarantee visibility over any overflow
            and 'md:static' for desktop
        */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 md:static md:w-full safe-area-bottom">
          <div className="flex flex-col gap-3">
            {/* Error Alert - Moved to footer for better visibility */}
            {(errors.size || errors.modifiers || errors.remark || errors.remarkPresets) && (
              <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-start gap-3 shadow-sm">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="text-sm font-medium text-red-600 dark:text-red-400 space-y-1">
                    {errors.size && <div>{errors.size}</div>}
                    {errors.modifiers && <div>{errors.modifiers}</div>}
                    {errors.remark && <div>{errors.remark}</div>}
                    {errors.remarkPresets?.map((err, i) => <div key={i}>{err}</div>)}
                  </div>
                </div>
              </div>
            )}

            {/* Total Preview */}
            <div className="flex justify-between items-center px-1">
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Amount
              </div>
              <div className="text-2xl font-bold text-primary">
                ${formatPriceDisplay(totalPrice)}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="h-14 px-6 rounded-xl border-slate-200 dark:border-slate-800 font-semibold md:flex"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleAddToCart}
                className="flex-1 h-14 rounded-xl text-lg font-bold shadow-xl shadow-primary/20 active:scale-[0.98] transition-transform"
                disabled={product.sizes && product.sizes.length > 0 && !tempSize}
              >
                Add to Order
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigurationModal;