import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Utensils, Tag, Star, Award, ChefHat, Ruler } from "lucide-react";

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
  const hasModifiers = product.modifier_groups && product.modifier_groups.length > 0;
  const hasSizes = product.sizes && product.sizes.length > 0;
  const showDiscount = product.has_discount && product.discount_percentage > 0;
  const categoryName = product.category?.name || '';

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-border/40 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:scale-[1] active:scale-[0.98]"
      onClick={() => onConfigure(product)}
    >
      {/* Top Ribbon - Feature Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1">
        {product.is_popular && (
          <Badge className="bg-amber-500/90 text-white text-[10px] font-semibold px-2 py-0.5 shadow-md backdrop-blur-sm">
            <Star size={10} className="mr-1" fill="white" />
            Popular
          </Badge>
        )}
        {product.is_signature && (
          <Badge className="bg-rose-600/90 text-white text-[10px] font-semibold px-2 py-0.5 shadow-md backdrop-blur-sm">
            <Award size={10} className="mr-1" />
            Signature
          </Badge>
        )}
        {product.is_chef_recommendation && (
          <Badge className="bg-emerald-600/90 text-white text-[10px] font-semibold px-2 py-0.5 shadow-md backdrop-blur-sm">
            <ChefHat size={10} className="mr-1" />
            Chef's Pick
          </Badge>
        )}
      </div>

      {/* Right Indicators - Top */}
      <div className="absolute top-2 right-2 z-10">
        {hasModifiers && (
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-[10px] px-2 py-0.5 border-primary/30">
            <Tag size={10} className="mr-1" />
            Customizable
          </Badge>
        )}
      </div>

      {/* Product Image */}
      <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        {product.image_path ? (
          <img 
            src={product.image_path} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Utensils className="text-muted-foreground" size={48} />
          </div>
        )}
        
        {/* Category Overlay - Simplified */}
        {categoryName && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 via-transparent to-transparent p-3">
            <div className="text-xs font-medium text-white/90 truncate">
              {categoryName}
            </div>
          </div>
        )}

        {/* Size Indicator - Bottom Right */}
        {hasSizes && (
          <Badge className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm text-foreground border-border text-[10px] font-medium px-2 py-0.5 shadow-sm flex items-center gap-1">
            <Ruler size={10} />
            {product.sizes.length} {product.sizes.length > 1 ? 'Sizes' : 'Size'}
          </Badge>
        )}
      </div>
      
      {/* Product Info */}
      <div className="p-4 space-y-3">
        {/* Name and Description */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </div>
        
        {/* Price and Action Section */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">
                ${product.final_price.toFixed(2)}
              </span>
              {showDiscount && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground line-through">
                    ${product.original_price.toFixed(2)}
                  </span>
                  <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
                    -{product.discount_percentage}%
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Indicator */}
          <div className="flex items-center gap-2">
            {hasModifiers && (
              <div className="text-[10px] font-medium text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
                + Options
              </div>
            )}
            <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full hover:bg-primary/20 transition-colors">
              Add →
            </div>
          </div>
        </div>

        {/* Stock/Status Indicator */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            {!hasModifiers && !hasSizes ? (
              <span className="text-green-600 dark:text-green-400 font-medium">Ready to add</span>
            ) : (
              <span>Customize</span>
            )}
          </div>
          {showDiscount && (
            <Badge variant="outline" className="text-[10px] border-green-200 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400">
              Save ${(product.original_price - product.final_price).toFixed(2)}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};