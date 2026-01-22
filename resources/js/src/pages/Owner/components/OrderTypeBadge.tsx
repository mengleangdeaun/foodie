import React from "react";
import { Badge } from "@/components/ui/badge";
import { Utensils, Truck, Package } from "lucide-react";
import { Order } from "@/types";

interface OrderTypeBadgeProps {
  order: Order;
}

const OrderTypeBadge: React.FC<OrderTypeBadgeProps> = ({ order }) => {
  if (order.restaurant_table) {
    return (
      <Badge 
        variant="outline" 
        className="bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30 font-medium"
      >
        <Utensils className="h-3.5 w-3.5 mr-1.5" />
        Table {order.restaurant_table.table_number}
      </Badge>
    );
  }

  if (order.delivery_partner) {
    return (
      <Badge 
        variant="outline" 
        className="bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 font-medium"
      >
        <Truck className="h-3.5 w-3.5 mr-1.5" />
        {order.delivery_partner.name}
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 font-medium"
    >
      <Package className="h-3.5 w-3.5 mr-1.5" />
      Takeaway
    </Badge>
  );
};

export default OrderTypeBadge;