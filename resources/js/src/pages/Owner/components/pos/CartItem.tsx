import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, X, Check, MessageSquare } from "lucide-react";

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

// Update the SelectedPreset interface to match the new structure
interface SelectedPreset {
  presetId: number;
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

  // Helper function to format selected presets for display
  const formatSelectedPresets = (presets: SelectedPreset[]): string[] => {
    return presets.map(preset => {
      if (preset.selectedOptions && preset.selectedOptions.length > 0) {
        return `${preset.presetId}: ${preset.selectedOptions.join(', ')}`;
      } else if (preset.selectedOption) {
        return `${preset.presetId}: ${preset.selectedOption}`;
      } else if (preset.customText) {
        return `${preset.presetId}: ${preset.customText}`;
      }
      return '';
    }).filter(Boolean);
  };

  return (
    <div className="border-b pb-4 space-y-3 last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-black text-sm uppercase tracking-tighter">
            {item.name}
            {item.selected_size && (
              <span className="ml-2 text-xs text-slate-500">
                ({item.selected_size.name})
              </span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {showDiscount ? (
              <div className="flex items-center gap-2">
                <span className="line-through text-slate-400 text-[10px]">
                  ${getOriginalPrice().toFixed(2)}
                </span>
                <Badge className="bg-red-500/10 text-red-600 text-[8px]">
                  -{item.discount_percentage}%
                </Badge>
                <p className="text-[10px] text-slate-400 font-bold">
                  ${getDisplayPrice().toFixed(2)} x {item.quantity}
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 font-bold">
                ${item.price.toFixed(2)} x {item.quantity}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full" 
              onClick={() => onUpdateQuantity(item.id, item.selected_size?.id || null, item.selected_modifiers, -1)}
            >
              <Minus size={12}/>
            </Button>
            <span className="text-xs font-black w-4 text-center">
              {item.quantity}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 rounded-full" 
              onClick={() => onUpdateQuantity(item.id, item.selected_size?.id || null, item.selected_modifiers, 1)}
            >
              <Plus size={12}/>
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-red-500 hover:bg-red-50"
            onClick={() => onRemove(item.id, item.selected_size?.id || null, item.selected_modifiers)}
          >
            <X size={12}/>
          </Button>
        </div>
      </div>

      {/* Display Selected Modifiers */}
      {Object.keys(item.selected_modifiers).length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Options:</p>
          {Object.entries(item.selected_modifiers).map(([groupId, modifiers]: [string, any]) => (
            <div key={groupId} className="space-y-0.5">
              {modifiers.map((modifier: Modifier) => (
                <div key={modifier.id} className="flex items-center justify-between text-[10px] text-slate-600">
                  <span className="flex items-center gap-1">
                    <Check size={8} className="text-green-500" />
                    {modifier.name}
                  </span>
                  {modifier.price > 0 && (
                    <span className="font-bold">
                      +${modifier.price.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
          {modifiersTotal > 0 && (
            <div className="text-[10px] font-bold text-slate-500 flex justify-between pt-1 border-t">
              <span>Modifiers Total:</span>
              <span>+${(modifiersTotal * item.quantity).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Display selected remark presets */}
      {item.selected_presets && item.selected_presets.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Presets:</p>
          <div className="flex flex-wrap gap-1">
            {formatSelectedPresets(item.selected_presets).map((presetText, idx) => (
              <Badge key={idx} variant="secondary" className="text-[8px] px-2 py-0">
                {presetText}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 bg-slate-50 rounded px-2 py-1">
        <MessageSquare size={12} className="text-slate-300" />
        <Input 
          placeholder="Note / Special Request..." 
          className="h-6 text-[10px] bg-transparent border-none focus-visible:ring-0 placeholder:italic" 
          value={remark} 
          onChange={(e) => handleRemarkChange(e.target.value)} 
        />
      </div>
    </div>
  );
};