import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, Settings, Tag, X, CheckCircle, Star, Award, ChefHat, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  options: string[];
  type: 'multiple' | 'single' | 'text';
  is_required: number;
  content?: string;
  pivot: {
    category_id: number;
    remark_preset_id: number;
  };
}

interface Category {
  id: number;
  name: string;
  remark_presets?: BackendRemarkPreset[];
}

interface SelectedPreset {
  presetId: number;
  name: string;
  selectedOptions?: string[];
  selectedOption?: string;
  customText?: string;
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
  const [activeTab, setActiveTab] = useState<'sizes' | 'modifiers' | 'remarks'>('sizes');

  const productCategory = product ? categories.find(cat => cat.id === product.category_id) : null;
  const backendRemarkPresets = productCategory?.remark_presets || [];

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

  const getSelectedPreset = (presetId: number) => {
    return selectedPresets.find(sp => sp.presetId === presetId);
  };

  const handlePresetSelection = (presetId: number, option: string, type: 'multiple' | 'single' | 'text') => {
    const preset = transformedRemarkPresets.find(p => p.id === presetId);
    const existing = getSelectedPreset(presetId);
    
    if (type === 'multiple') {
      const currentOptions = existing?.selectedOptions || [];
      const newOptions = currentOptions.includes(option)
        ? currentOptions.filter(opt => opt !== option)
        : [...currentOptions, option];
      
      onPresetChange(presetId, newOptions, undefined, undefined, preset?.name);
    } else if (type === 'single') {
      onPresetChange(presetId, undefined, option, undefined, preset?.name);
    }
  };

  const handleTextPresetChange = (presetId: number, text: string) => {
    const preset = transformedRemarkPresets.find(p => p.id === presetId);
    onPresetChange(presetId, undefined, undefined, text, preset?.name);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const presetErrors: string[] = [];

    if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
      newErrors.size = "Please select a size";
    }

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
      <DialogContent className="max-w-5xl max-h-[90vh]  p-0 [&>button]:hidden ">
        <DialogHeader className="p-6 border-b border-border/50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {product.image_path && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={product.image_path} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {product.name}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1">
                  {product.short_description || 'Customize your order'}
                </DialogDescription>
                <div className="flex gap-2 mt-2">
                  {product.is_popular && (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-300">
                      <Star size={12} className="mr-1" /> Popular
                    </Badge>
                  )}
                  {product.is_signature && (
                    <Badge variant="secondary" className="bg-rose-500/10 text-rose-700 dark:text-rose-300">
                      <Award size={12} className="mr-1" /> Signature
                    </Badge>
                  )}
                  {product.is_chef_recommendation && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                      <ChefHat size={12} className="mr-1" /> Chef's Pick
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(90vh-180px)]">
          {/* Left Column: Configuration Options */}
          <div className="w-2/3 border-r border-border/50">
            <div className="p-6">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="sizes" className="flex items-center gap-2">
                    {product.sizes?.length > 0 && (
                      <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center">{product.sizes.length}</Badge>
                    )}
                    Sizes
                  </TabsTrigger>
                  <TabsTrigger value="modifiers" className="flex items-center gap-2">
                    {product.modifier_groups?.length > 0 && (
                      <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center">{product.modifier_groups.length}</Badge>
                    )}
                    Add-ons
                  </TabsTrigger>
                  <TabsTrigger value="remarks" className="flex items-center gap-2">
                    {transformedRemarkPresets.length > 0 && (
                      <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center">{transformedRemarkPresets.length}</Badge>
                    )}
                    Preferences
                  </TabsTrigger>
                </TabsList>

                {/* Sizes Tab */}
                <TabsContent value="sizes" className="space-y-6">
                  {product.sizes && product.sizes.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {product.sizes.map(size => {
                        const isSelected = selectedSize?.id === size.id;
                        const hasSizeDiscount = size.has_active_discount && size.discount_percentage > 0;
                        
                        return (
                          <div
                            key={size.id}
                            className={`relative border rounded-xl p-4 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                                : 'border-border hover:border-primary/50 hover:bg-accent/50'
                            }`}
                            onClick={() => onSizeChange(size)}
                          >
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-foreground">{size.name}</div>
                                  {size.price_source && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Source: {size.price_source}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end">
                                  {hasSizeDiscount && (
                                    <>
                                      <span className="line-through text-muted-foreground text-sm">
                                        ${size.base_price.toFixed(2)}
                                      </span>
                                      <Badge className="bg-red-500 text-white text-xs px-2 mt-1">
                                        -{size.discount_percentage}%
                                      </Badge>
                                    </>
                                  )}
                                  <span className={`font-bold text-lg ${hasSizeDiscount ? 'text-green-600' : 'text-foreground'}`}>
                                    ${size.final_price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-2 text-primary text-sm mt-2">
                                  <CheckCircle size={16} />
                                  <span>Selected</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 border rounded-lg border-dashed border-border">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <Info className="text-muted-foreground" size={24} />
                      </div>
                      <p className="text-muted-foreground">No size options available</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Default size will be used</p>
                    </div>
                  )}
                </TabsContent>

                {/* Modifiers Tab */}
                <TabsContent value="modifiers" className="space-y-6">
                  <ScrollArea className="h-[calc(70vh-200px)]">
                    {product.modifier_groups && product.modifier_groups.length > 0 ? (
                      <div className="space-y-4">
                        {product.modifier_groups.map(group => {
                          const groupSelection = selectedModifiers[group.id] || [];
                          const isMaxReached = group.max_selection && groupSelection.length >= group.max_selection;

                          return (
                            <div key={group.id} className="space-y-3 border rounded-lg p-4 bg-card">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-semibold text-foreground">
                                    {group.name}
                                  </h5>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {group.selection_type === 'single' ? 'Choose one' : 'Choose multiple'}
                                    {group.max_selection && ` • Max: ${group.max_selection}`}
                                    {group.min_selection > 0 && ` • Min: ${group.min_selection}`}
                                  </div>
                                </div>
                                {groupSelection.length > 0 && (
                                  <Badge variant="secondary">
                                    {groupSelection.length} selected
                                  </Badge>
                                )}
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
                                          : 'bg-background border-border hover:border-primary/50'
                                      } ${!isSelected && isMaxReached && group.selection_type === 'multiple' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      onClick={() => {
                                        if (!(!isSelected && isMaxReached && group.selection_type === 'multiple')) {
                                          onModifierToggle(group.id, modifier);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center gap-3">
                                        {group.selection_type === 'single' ? (
                                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                            isSelected ? 'bg-primary border-primary' : 'border-border'
                                          }`}>
                                            {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                          </div>
                                        ) : (
                                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                            isSelected ? 'bg-primary border-primary' : 'border-border'
                                          }`}>
                                            {isSelected && <Check size={14} className="text-white" />}
                                          </div>
                                        )}
                                        <span className="font-medium text-foreground">{modifier.name}</span>
                                      </div>
                                      {modifier.price > 0 && (
                                        <span className="font-semibold text-green-600 dark:text-green-400">
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
                      <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed border-border">
                        <Settings size={32} className="mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">No add-ons available</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">This item has no additional options</p>
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>

                {/* Remarks Tab */}
                <TabsContent value="remarks" className="space-y-6">
                  <ScrollArea className="h-[calc(70vh-200px)]">
                    <div className="space-y-6 mb-6">
                      {transformedRemarkPresets.map(preset => {
                        const selected = getSelectedPreset(preset.id);
                        
                        if (preset.type === 'single') {
                          return (
                            <div key={preset.id} className="space-y-3 border rounded-lg p-4 bg-card">
                              <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                                {preset.name}
                                {preset.is_required && <span className="text-red-500">*</span>}
                              </Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {preset.options?.map((option, index) => {
                                  const isSelected = selected?.selectedOption === option;
                                  return (
                                    <div
                                      key={index}
                                      className={`flex items-center justify-center px-3 py-2 rounded-lg border cursor-pointer text-center transition-all ${
                                        isSelected 
                                          ? 'bg-primary text-primary-foreground border-primary' 
                                          : 'bg-background border-border hover:border-primary'
                                      }`}
                                      onClick={() => handlePresetSelection(preset.id, option, 'single')}
                                    >
                                      <span className="text-sm">{option}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        
                        if (preset.type === 'multiple') {
                          return (
                            <div key={preset.id} className="space-y-3 border rounded-lg p-4 bg-card">
                              <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
                                {preset.name}
                                {preset.is_required && <span className="text-red-500">*</span>}
                              </Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {preset.options?.map((option, index) => {
                                  const isSelected = selected?.selectedOptions?.includes(option) || false;
                                  return (
                                    <div
                                      key={index}
                                      className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                        isSelected 
                                          ? 'bg-primary/10 border-primary' 
                                          : 'bg-background border-border hover:border-primary'
                                      }`}
                                      onClick={() => handlePresetSelection(preset.id, option, 'multiple')}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                          isSelected ? 'bg-primary border-primary' : 'border-border'
                                        }`}>
                                          {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                        <span className="text-sm">{option}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
                        
                        if (preset.type === 'text') {
                          return (
                            <div key={preset.id} className="space-y-2 border rounded-lg p-4 bg-card">
                              <Label className="text-sm font-semibold text-foreground flex items-center gap-1">
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
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                    </div>
                    <div className="space-y-3 border rounded-lg p-4 bg-card">
                    <Label className="text-sm font-semibold text-foreground">Special Instructions</Label>
                    <Textarea
                      placeholder="Add special instructions for the kitchen..."
                      className="min-h-[80px] resize-none"
                      value={localRemark}
                      onChange={(e) => {
                        setLocalRemark(e.target.value);
                        onRemarkChange(e.target.value);
                      }}
                    />
                  </div>
                  </ScrollArea>

                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Right Column: Price Summary */}
          <div className="w-1/3 flex flex-col">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4">Order Summary</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span className="font-medium text-foreground">${priceInfo.originalPrice.toFixed(2)}</span>
                </div>
                
                {priceInfo.modifiersTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Add-ons:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      +${priceInfo.modifiersTotal.toFixed(2)}
                    </span>
                  </div>
                )}

                {priceInfo.hasActiveDiscount && priceInfo.discountPercentage > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      -${(priceInfo.originalPrice - priceInfo.basePrice).toFixed(2)}
                    </span>
                  </div>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-semibold text-foreground">Total:</span>
                  <div className="flex items-center gap-2">
                    {priceInfo.hasActiveDiscount && priceInfo.originalPrice > priceInfo.basePrice && (
                      <span className="line-through text-muted-foreground text-sm">
                        ${(priceInfo.originalPrice + priceInfo.modifiersTotal).toFixed(2)}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-primary">
                      ${priceInfo.finalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Modifiers Preview */}
            {Object.keys(selectedModifiers).length > 0 && (
              <div className="px-6 pb-4">
                <h5 className="text-sm font-medium text-foreground mb-2">Selected Add-ons</h5>
                <div className="space-y-1">
                  {Object.values(selectedModifiers).flat().map((modifier: Modifier) => (
                    <div key={modifier.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">• {modifier.name}</span>
                      {modifier.price > 0 && (
                        <span className="font-medium text-green-600 dark:text-green-400">
                          +${modifier.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {(errors.size || errors.remarkPresets) && (
              <div className="px-6 pb-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="space-y-1">
                    {errors.size && <div>{errors.size}</div>}
                    {errors.remarkPresets && errors.remarkPresets.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-auto p-6 border-t border-border/50">
              <div className="space-y-3">
                <Button 
                  onClick={handleAddToCart} 
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  Add to Cart • ${priceInfo.finalPrice.toFixed(2)}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};