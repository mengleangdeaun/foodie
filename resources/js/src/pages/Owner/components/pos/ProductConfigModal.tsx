import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, Settings, Tag, X, CheckCircle, Star, Award, ChefHat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

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

interface Product {
  id: number;
  name: string;
  category_id: number;
  final_price: number;
  original_price: number;
  has_discount: boolean;
  discount_percentage: number;
  image_path?: string;
  short_description?: string;
  is_popular: boolean;
  is_signature: boolean;
  is_chef_recommendation: boolean;
  sizes: Size[];
  modifier_groups: ModifierGroup[];
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

interface BackendRemarkPreset {
  id: number;
  owner_id: number;
  name: string;
  options: string[]; // Array of strings, not objects
  type: 'multiple' | 'single' | 'text'; // Changed from input_type to type
  is_required: number; // 0 or 1, not boolean
  content?: string;
  pivot: {
    category_id: number;
    remark_preset_id: number;
  };
}

interface Category {
  id: number;
  name: string;
  remark_presets?: BackendRemarkPreset[]; // Using backend structure
}

interface SelectedPreset {
  presetId: number;
  name: string;
  selectedOptions?: string[]; // For multiple selection
  selectedOption?: string; // For single selection
  customText?: string; // For text input
}

interface ProductConfigModalProps {
  product: Product | null;
  categories: Category[];
  selectedSize: Size | null;
  selectedModifiers: { [groupId: number]: Modifier[] };
  selectedPresets: SelectedPreset[];
  remark: string;
  onClose: () => void;
  onSizeChange: (size: Size | null) => void;
  onModifierToggle: (groupId: number, modifier: Modifier) => void;
  onPresetChange: (presetId: number, name: string, selectedOptions?: string[], selectedOption?: string, customText?: string) => void;
  onRemarkChange: (remark: string) => void;
  onAddToCart: () => void;
}

export const ProductConfigModal = ({
  product,
  categories,
  selectedSize,
  selectedModifiers,
  selectedPresets,
  remark,
  onClose,
  onSizeChange,
  onModifierToggle,
  onPresetChange,
  onRemarkChange,
  onAddToCart
}: ProductConfigModalProps) => {
  const [localRemark, setLocalRemark] = useState(remark || '');
  const [errors, setErrors] = useState<{
    size?: string;
    modifiers?: string;
    remark?: string;
    remarkPresets?: string[];
  }>({});

  // Find the product's category and its remark presets
  const productCategory = product ? categories.find(cat => cat.id === product.category_id) : null;
  const backendRemarkPresets = productCategory?.remark_presets || [];

  // Transform backend remark presets to a more usable format
  const transformedRemarkPresets = useMemo(() => {
    return backendRemarkPresets.map(preset => ({
      id: preset.id,
      name: preset.name,
      type: preset.type,
      is_required: preset.is_required === 1,
      options: preset.options,
      content: preset.content
    }));
  }, [backendRemarkPresets]);

  useEffect(() => {
    setLocalRemark(remark || '');
  }, [remark]);

  // Get selected preset values
  const getSelectedPreset = (presetId: number) => {
    return selectedPresets.find(sp => sp.presetId === presetId);
  };

  // Handle preset selection
const handlePresetSelection = (presetId: number, option: string, type: 'multiple' | 'single' | 'text') => {
  const preset = transformedRemarkPresets.find(p => p.id === presetId); // Find the preset object
  const existing = getSelectedPreset(presetId);
  
  if (type === 'multiple') {
    const currentOptions = existing?.selectedOptions || [];
    const newOptions = currentOptions.includes(option)
      ? currentOptions.filter(opt => opt !== option)
      : [...currentOptions, option];
    
    // Pass preset.name here
    onPresetChange(presetId, newOptions, undefined, undefined, preset?.name); 
  } else if (type === 'single') {
    // Pass preset.name here
    onPresetChange(presetId, undefined, option, undefined, preset?.name);
  }
};

const handleTextPresetChange = (presetId: number, text: string) => {
  const preset = transformedRemarkPresets.find(p => p.id === presetId);
  onPresetChange(presetId, undefined, undefined, text, preset?.name);
};

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const presetErrors: string[] = [];

    // Validate size if product has sizes
    if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
      newErrors.size = "Please select a size";
    }

    // Validate required remark presets
    transformedRemarkPresets.forEach(preset => {
      if (preset.is_required) {
        const selected = getSelectedPreset(preset.id);
        
        if (preset.type === 'text' && (!selected?.customText || selected.customText.trim() === '')) {
          presetErrors.push(`Please enter a value for "${preset.name}"`);
        } else if (preset.type === 'single' && !selected?.selectedOption) {
          presetErrors.push(`Please select an option for "${preset.name}"`);
        } else if (preset.type === 'multiple' && (!selected?.selectedOptions || selected.selectedOptions.length === 0)) {
          presetErrors.push(`Please select at least one option for "${preset.name}"`);
        }
      }
    });

    if (presetErrors.length > 0) {
      newErrors.remarkPresets = presetErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddToCart = () => {
    if (!validateForm()) {
      return;
    }
    onAddToCart();
  };

  const calculateModifiersTotal = () => {
    let total = 0;
    Object.values(selectedModifiers).forEach((modifierList: Modifier[]) => {
      modifierList.forEach(modifier => {
        total += modifier.price;
      });
    });
    return total;
  };

  const getCurrentPrice = () => {
    const basePrice = selectedSize?.final_price || product?.final_price || 0;
    const modifiersTotal = calculateModifiersTotal();
    return basePrice + modifiersTotal;
  };

  const getBasePrice = () => {
    return selectedSize?.final_price || product?.final_price || 0;
  };

  const getOriginalPrice = () => {
    if (selectedSize) {
      return selectedSize.base_price;
    }
    return product?.original_price || 0;
  };

  const getDiscountPercentage = () => {
    if (selectedSize) {
      return selectedSize.discount_percentage;
    }
    return product?.discount_percentage || 0;
  };

  const hasDiscount = () => {
    if (selectedSize) {
      return selectedSize.has_active_discount;
    }
    return product?.has_discount || false;
  };

  if (!product) return null;

  const priceInfo = {
    basePrice: getBasePrice(),
    modifiersTotal: calculateModifiersTotal(),
    originalPrice: getOriginalPrice(),
    finalPrice: getCurrentPrice(),
    hasActiveDiscount: hasDiscount(),
    discountPercentage: getDiscountPercentage()
  };

return (
  <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
      <div className="sticky top-0 bg-white border-b z-10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <DialogTitle className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {product.name}
              <div className="flex gap-1">
                {product.is_popular && (
                  <Badge className="bg-yellow-500 text-white text-xs">
                    <Star size={10} className="mr-1" /> POPULAR
                  </Badge>
                )}
                {product.is_signature && (
                  <Badge className="bg-red-500 text-white text-xs">
                    <Award size={10} className="mr-1" /> SIGNATURE
                  </Badge>
                )}
                {product.is_chef_recommendation && (
                  <Badge className="bg-green-500 text-white text-xs">
                    <ChefHat size={10} className="mr-1" /> CHEF'S PICK
                  </Badge>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="text-slate-600 mt-1">
              {product.short_description || 'Customize your order'}
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(95vh-180px)]">
        {/* Left Column: Product Info & Sizes */}
        <div className="flex-1 border-r">
          <ScrollArea className="h-full">
            <div className="p-6">
              <div className="space-y-8">
                {/* Product Image & Basic Info */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Product Image */}
                  <div className="space-y-4">
                    <div className="relative h-64 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                      {product.image_path ? (
                        <img 
                          src={product.image_path} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                              <ChefHat className="text-slate-400" size={24} />
                            </div>
                            <p className="text-slate-400 text-sm">{product.name}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sizes */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-between">
                        <span>Choose Size</span>
                        <span className="text-sm font-normal text-slate-500">
                          {selectedSize ? selectedSize.name : 'Select a size'}
                        </span>
                      </h4>
                      {product.sizes && product.sizes.length > 0 ? (
                        <div className="space-y-3">
                          {product.sizes.map(size => {
                            const isSelected = selectedSize?.id === size.id;
                            const hasSizeDiscount = size.has_active_discount && size.discount_percentage > 0;
                            
                            return (
                              <div
                                key={size.id}
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                    : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                                } ${errors.size ? 'border-red-300' : ''}`}
                                onClick={() => {
                                  onSizeChange(size);
                                  if (errors.size) {
                                    setErrors(prev => ({ ...prev, size: undefined }));
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-bold text-slate-900">{size.name}</div>
                                    {size.price_source !== 'product_base' && (
                                      <div className="text-xs text-slate-500 mt-1">
                                        {size.price_source === 'branch_size' ? 'Branch Size Price' : 
                                         size.price_source === 'branch_product' ? 'Branch Product Price' : 'Base Price'}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {hasSizeDiscount && (
                                      <>
                                        <span className="line-through text-slate-400 text-sm">
                                          ${size.base_price.toFixed(2)}
                                        </span>
                                        <Badge className="bg-red-500 text-white text-xs px-2">
                                          -{size.discount_percentage}%
                                        </Badge>
                                      </>
                                    )}
                                    <span className={`font-bold ${hasSizeDiscount ? 'text-green-600' : 'text-slate-900'}`}>
                                      ${size.final_price.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="flex items-center gap-1 mt-2 text-primary text-sm">
                                    <CheckCircle size={16} />
                                    <span>Selected</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 border rounded-lg border-dashed border-slate-200">
                          <p className="text-slate-500">No size options available</p>
                          <p className="text-sm text-slate-400 mt-1">Default size will be used</p>
                        </div>
                      )}
                      {errors.size && (
                        <p className="text-red-500 text-sm mt-2">{errors.size}</p>
                      )}
                    </div>

                    {/* Current Price Summary */}
                    <div className="border rounded-xl p-4 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700">Selected Price:</span>
                        <div className="flex items-center gap-2">
                          {priceInfo.hasActiveDiscount && priceInfo.originalPrice > priceInfo.basePrice && (
                            <span className="line-through text-slate-400">
                              ${priceInfo.originalPrice.toFixed(2)}
                            </span>
                          )}
                          <span className="text-xl font-bold text-green-600">
                            ${priceInfo.basePrice.toFixed(2)}
                          </span>
                          {priceInfo.hasActiveDiscount && priceInfo.discountPercentage > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">
                              -{priceInfo.discountPercentage}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-slate-500">
                        {selectedSize ? `Size: ${selectedSize.name}` : 'Standard size'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remark Presets */}
                {transformedRemarkPresets.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-slate-900">Additional Options</h4>
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-primary" />
                        <span className="text-sm text-slate-500">Preset Options</span>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      {transformedRemarkPresets.map(preset => {
                        const selected = getSelectedPreset(preset.id);
                        
                        if (preset.type === 'single') {
                          return (
                            <div key={preset.id} className="space-y-3">
                              <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                {preset.name}
                                {preset.is_required && <span className="text-red-500">*</span>}
                              </Label>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {preset.options?.map((option, index) => {
                                  const isSelected = selected?.selectedOption === option;
                                  return (
                                    <div
                                      key={index}
                                      className={`flex items-center justify-center px-4 py-3 rounded-lg border cursor-pointer text-center ${
                                        isSelected 
                                          ? 'bg-primary text-primary-foreground border-primary' 
                                          : 'bg-white border-slate-200 hover:border-primary'
                                      }`}
                                      onClick={() => handlePresetSelection(preset.id, option, 'single')}
                                    >
                                      <span>{option}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              {preset.is_required && !selected?.selectedOption && errors.remarkPresets && (
                                <p className="text-red-500 text-sm">Please select an option for {preset.name}</p>
                              )}
                            </div>
                          );
                        }
                        
                        if (preset.type === 'multiple') {
                          return (
                            <div key={preset.id} className="space-y-3">
                              <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                {preset.name}
                                {preset.is_required && <span className="text-red-500">*</span>}
                              </Label>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                {preset.options?.map((option, index) => {
                                  const isSelected = selected?.selectedOptions?.includes(option) || false;
                                  return (
                                    <div
                                      key={index}
                                      className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer ${
                                        isSelected 
                                          ? 'bg-primary/10 border-primary' 
                                          : 'bg-white border-slate-200 hover:border-primary'
                                      }`}
                                      onClick={() => handlePresetSelection(preset.id, option, 'multiple')}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                          isSelected ? 'bg-primary border-primary' : 'border-slate-300'
                                        }`}>
                                          {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <span>{option}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              {preset.is_required && (!selected?.selectedOptions || selected.selectedOptions.length === 0) && errors.remarkPresets && (
                                <p className="text-red-500 text-sm">Please select at least one option for {preset.name}</p>
                              )}
                            </div>
                          );
                        }
                        
                        if (preset.type === 'text') {
                          return (
                            <div key={preset.id} className="space-y-2">
                              <Label className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                {preset.name}
                                {preset.is_required && <span className="text-red-500">*</span>}
                              </Label>
                              <Input
                                type="text"
                                placeholder={preset.content || `Enter ${preset.name.toLowerCase()}...`}
                                value={selected?.customText || ''}
                                onChange={(e) => handleTextPresetChange(preset.id, e.target.value)}
                                className="w-full"
                              />
                              {preset.is_required && (!selected?.customText || selected.customText.trim() === '') && errors.remarkPresets && (
                                <p className="text-red-500 text-sm">Please enter a value for {preset.name}</p>
                              )}
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Remark */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-900">Special Instructions</h4>
                  
                  <Textarea
                    placeholder="Add special instructions for the kitchen (e.g., no onions, extra sauce)..."
                    className="min-h-[100px] resize-none"
                    value={localRemark}
                    onChange={(e) => {
                      setLocalRemark(e.target.value);
                      onRemarkChange(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Column: Modifiers & Price Summary */}
        <div className="w-[400px] flex flex-col">
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-900">Add-ons & Modifiers</h4>
              {product.modifier_groups && product.modifier_groups.length > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Settings size={12} />
                  {product.modifier_groups.length} option{product.modifier_groups.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            {/* Error Alert */}
            {(errors.size || errors.remarkPresets) && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="space-y-1">
                  {errors.size && <div>{errors.size}</div>}
                  {errors.remarkPresets && errors.remarkPresets.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <ScrollArea className="flex-1 px-6">
            {product.modifier_groups && product.modifier_groups.length > 0 ? (
              <div className="space-y-6 pr-2">
                {product.modifier_groups.map(group => {
                  const groupSelection = selectedModifiers[group.id] || [];
                  const isMinRequired = group.min_selection > 0;
                  const isMaxReached = group.max_selection && groupSelection.length >= group.max_selection;

                  return (
                    <div key={group.id} className="space-y-4 border rounded-xl p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-800">
                          {group.name}
                        </h5>
                        <div className="text-xs text-slate-500">
                          {group.selection_type === 'single' ? 'Choose one' : 'Choose multiple'}
                          {group.max_selection && ` (Max: ${group.max_selection})`}
                          {isMinRequired && ` (Min: ${group.min_selection})`}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {group.modifiers.map(modifier => {
                          const isSelected = groupSelection.some(m => m.id === modifier.id);
                          return (
                            <div
                              key={modifier.id}
                              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-primary/10 border-primary' 
                                  : 'bg-white border-slate-200 hover:border-primary hover:bg-slate-50'
                              } ${!isSelected && isMaxReached && group.selection_type === 'multiple' ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => {
                                if (!(!isSelected && isMaxReached && group.selection_type === 'multiple')) {
                                  onModifierToggle(group.id, modifier);
                                }
                              }}
                            >
                              <div className="flex items-center gap-3">
                                {group.selection_type === 'single' ? (
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                    isSelected ? 'bg-primary border-primary' : 'border-slate-300'
                                  }`}>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                  </div>
                                ) : (
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    isSelected ? 'bg-primary border-primary' : 'border-slate-300'
                                  }`}>
                                    {isSelected && <Check size={12} className="text-white" />}
                                  </div>
                                )}
                                <span className="font-medium">{modifier.name}</span>
                              </div>
                              {modifier.price > 0 && (
                                <span className="font-bold text-green-600">
                                  +${modifier.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border rounded-xl border-dashed border-slate-200">
                <Settings size={32} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-500">No modifiers available</p>
                <p className="text-sm text-slate-400 mt-1">This item has no additional options</p>
              </div>
            )}
          </ScrollArea>

          {/* Price Summary */}
          <div className="p-6 border-t">
            <div className="border rounded-xl p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg">
              <h5 className="text-lg font-bold mb-4">Order Summary</h5>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Item Price:</span>
                  <span className="font-bold">${priceInfo.basePrice.toFixed(2)}</span>
                </div>
                
                {priceInfo.modifiersTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Add-ons:</span>
                    <span className="font-bold text-green-400">
                      +${priceInfo.modifiersTotal.toFixed(2)}
                    </span>
                  </div>
                )}

                {priceInfo.hasActiveDiscount && priceInfo.discountPercentage > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Discount:</span>
                    <span className="font-bold text-red-400">
                      -${(priceInfo.originalPrice - priceInfo.basePrice).toFixed(2)}
                    </span>
                  </div>
                )}
                
                <Separator className="bg-slate-700" />
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xl font-bold">Total:</span>
                  <div className="flex items-center gap-2">
                    {priceInfo.hasActiveDiscount && priceInfo.originalPrice > priceInfo.basePrice && (
                      <span className="line-through text-slate-400 text-sm">
                        ${(priceInfo.originalPrice + priceInfo.modifiersTotal).toFixed(2)}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-white">
                      ${priceInfo.finalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-slate-500">Ready to add to cart?</div>
            <div className="text-2xl font-bold text-slate-900">
              ${priceInfo.finalPrice.toFixed(2)}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} size="lg">
              Cancel
            </Button>
            <Button onClick={handleAddToCart} size="lg" className="font-bold px-8">
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
};