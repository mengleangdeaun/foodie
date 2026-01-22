import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, X, Check, MessageSquare, ChevronRight } from "lucide-react";

interface Size {
  id: number;
  name: string;
  base_price: number;
  final_price: number;
  discount_percentage: number;
  has_active_discount: boolean;
}

interface Modifier {
  id: number;
  name: string;
  price: number;
}

interface SelectedPreset {
  presetId: number;
  name: string;
  selectedOptions?: string[];
  selectedOption?: string;
  customText?: string;
}

interface CartItemProps {
  item: any;
  index: number;
  onUpdateQuantity: (productId: number, sizeId: number | null, modifiers: any, change: number) => void;
  onRemove: (productId: number, sizeId: number | null, modifiers: any) => void;
  onUpdateRemark: (index: number, remark: string) => void;
}

export const CartItem = ({ 
  item, 
  index, 
  onUpdateQuantity, 
  onRemove, 
  onUpdateRemark 
}: CartItemProps) => {
  const [remark, setRemark] = useState(item.remark || '');
  const [isExpanded, setIsExpanded] = useState(false);

  const modifiersTotal = Object.values(item.selected_modifiers).reduce((total: number, modifiers: any) => {
    return total + modifiers.reduce((sum: number, mod: Modifier) => sum + mod.price, 0);
  }, 0);

  const handleRemarkChange = (value: string) => {
    setRemark(value);
    onUpdateRemark(index, value);
  };

  const getOriginalPrice = () => {
    if (item.selected_size) {
      return item.selected_size.base_price * item.quantity;
    }
    return item.original_price * item.quantity;
  };

  const getDisplayPrice = () => {
    return item.price * item.quantity;
  };

  const showDiscount = item.has_discount && item.discount_percentage > 0;
  const hasModifiers = Object.keys(item.selected_modifiers).length > 0;
  const hasPresets = item.selected_presets && item.selected_presets.length > 0;
  const hasDetails = hasModifiers || hasPresets;

  const formatSelectedPresets = (presets: SelectedPreset[]): string[] => {
    return presets.map(preset => {
      if (preset.selectedOptions && preset.selectedOptions.length > 0) {
        return `${preset.name}: ${preset.selectedOptions.join(', ')}`;
      } else if (preset.selectedOption) {
        return `${preset.name}: ${preset.selectedOption}`;
      } else if (preset.customText) {
        return `${preset.name}: ${preset.customText}`;
      }
      return '';
    }).filter(Boolean);
  };

  return (
    <div className="border border-border/30 rounded-lg p-3 space-y-3 hover:border-border/50 transition-colors bg-card">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">
                {item.name}
                {item.selected_size && (
                  <span className="ml-2 text-xs text-muted-foreground font-medium">
                    ({item.selected_size.name})
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {showDiscount ? (
                  <div className="flex items-center gap-2">
                    <span className="line-through text-muted-foreground text-xs">
                      ${getOriginalPrice().toFixed(2)}
                    </span>
                    <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-1.5 py-0">
                      -{item.discount_percentage}%
                    </Badge>
                    <p className="text-xs font-medium text-foreground/80">
                      ${getDisplayPrice().toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-medium text-foreground/80">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <p className="text-sm font-semibold text-foreground">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
              {hasDetails && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-6 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  Details
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 border border-border/40 rounded-full p-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onUpdateQuantity(item.id, item.selected_size?.id || null, item.selected_modifiers, -1)}
          >
            <Minus size={14} />
          </Button>
          <span className="text-sm font-medium w-6 text-center text-foreground">
            {item.quantity}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
            onClick={() => onUpdateQuantity(item.id, item.selected_size?.id || null, item.selected_modifiers, 1)}
          >
            <Plus size={14} />
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(item.id, item.selected_size?.id || null, item.selected_modifiers)}
        >
          <X size={14} />
        </Button>
      </div>

      {/* Expanded Details */}
      {(isExpanded || !hasDetails) && (
        <>
          {/* Selected Modifiers */}
          {hasModifiers && (
            <div className="pt-2 border-t border-border/20 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Options</p>
              {Object.entries(item.selected_modifiers).map(([groupId, modifiers]: [string, any]) => (
                <div key={groupId} className="space-y-1">
                  {modifiers.map((modifier: Modifier) => (
                    <div key={modifier.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-foreground/90">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        {modifier.name}
                      </span>
                      {modifier.price > 0 && (
                        <span className="font-medium text-green-600 dark:text-green-400">
                          +${modifier.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {modifiersTotal > 0 && (
                <div className="text-xs font-medium text-muted-foreground flex justify-between pt-1 border-t border-border/10">
                  <span>Add-ons total:</span>
                  <span className="text-foreground">+${(modifiersTotal * item.quantity).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Selected Presets */}
          {hasPresets && (
            <div className="pt-2 border-t border-border/20 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Preferences</p>
              <div className="space-y-1">
                {formatSelectedPresets(item.selected_presets).map((presetText, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-xs text-foreground/90">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                    <span>{presetText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Remarks Input */}
      <div className="relative">
        <MessageSquare size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Add note for kitchen..." 
          className="h-8 text-sm pl-9 pr-3 bg-background border-border/40 focus-visible:ring-1 placeholder:text-muted-foreground" 
          value={remark} 
          onChange={(e) => handleRemarkChange(e.target.value)}
        />
      </div>
    </div>
  );
};