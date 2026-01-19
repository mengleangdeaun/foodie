import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, Tag, Star, Award, ChefHat } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description?: string;
  short_description?: string;
  final_price: number;
  original_price: number;
  has_discount: boolean;
  discount_percentage: number;
  image_path?: string;
  is_popular: boolean;
  is_signature: boolean;
  is_chef_recommendation: boolean;
  modifier_groups: any[];
  sizes: any[];
  category?: {
    id: number;
    name: string;
  };
}

interface ProductCardProps {
  product: Product;
  onConfigure: (product: Product) => void;
}

export const ProductCard = ({ product, onConfigure }: ProductCardProps) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 overflow-hidden group relative bg-white dark:bg-slate-800 hover:scale-[1.02]"
      onClick={() => onConfigure(product)}
    >
      {/* Product Flags - Compact Design */}
      <div className="absolute top-2 left-2 z-10 flex gap-1">
        {product.is_popular && (
          <Badge className="bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 shadow-md flex items-center gap-0.5">
            <Star size={8} fill="white" />
            HOT
          </Badge>
        )}
        {product.is_signature && (
          <Badge className="bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 shadow-md flex items-center gap-0.5">
            <Award size={8} fill="white" />
            SIGN
          </Badge>
        )}
        {product.is_chef_recommendation && (
          <Badge className="bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 shadow-md flex items-center gap-0.5">
            <ChefHat size={8} fill="white" />
            CHEF
          </Badge>
        )}
      </div>

      {/* Modifier Indicator - Compact */}
      {product.modifier_groups && product.modifier_groups.length > 0 && (
        <Badge className="absolute top-2 right-2 bg-blue-500 text-white text-[8px] font-bold px-1.5 py-0.5 shadow-md flex items-center gap-0.5">
          <Tag size={8} />
          +
        </Badge>
      )}

      {/* Product Image */}
      <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 relative overflow-hidden">
        {product.image_path ? (
          <img 
            src={product.image_path} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils className="text-slate-300 dark:text-slate-500" size={48} />
          </div>
        )}
        
        {/* Price Display - Enhanced Gradient */}
        <div className="absolute bottom-0 right-0 left-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="text-white/90 text-[11px] font-semibold uppercase tracking-wide">
              {product.category?.name || 'Item'}
            </div>
            <div className="flex items-center gap-2">
              {product.has_discount && (
                <span className="text-white/70 line-through text-[11px] font-medium">
                  ${product.original_price.toFixed(2)}
                </span>
              )}
              <span className="text-white font-bold text-lg drop-shadow-lg">
                ${product.final_price.toFixed(2)}
              </span>
              {product.has_discount && (
                <Badge className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[9px] font-bold px-2 py-0.5 shadow-lg">
                  -{product.discount_percentage}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>
          {product.short_description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {product.short_description}
            </p>
          )}
        </div>
        
        {/* Bottom Row: Price, Discount, and Size */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
              ${product.final_price.toFixed(2)}
            </span>
            {product.has_discount && (
              <>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through">
                  ${product.original_price.toFixed(2)}
                </span>
                <Badge className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0">
                  -{product.discount_percentage}%
                </Badge>
              </>
            )}
          </div>
          
          {/* Size Indicator */}
          {product.sizes && product.sizes.length > 0 && (
            <span className="text-[9px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
              {product.sizes.length} {product.sizes.length > 1 ? 'Sizes' : 'Size'}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};