import { ORDER_STATUS } from "@/constants/orderStatus";

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

export interface OrderItem {
    id: number;
    quantity: number;
    product: {
        name: string;
        price: number;
    };
    remark: string;
    selectedSize?: {
        name: string;
        base_price?: string;
        final_price?: string;
    };
    selectedModifiers?: {
        price: string;
    }[];
    pricing?: {
        effective_price?: string;
        branch_product_price?: string;
        product_base_price?: string;
    };
    price?: string;
}

export interface Order {
    id: number;
    total: number;
    status: OrderStatus;
    created_at: string;
    items: OrderItem[];
    subtotal?: number;
    tax?: number;
    order_number?: string;
    restaurant_table?: {
        table_number: string;
    };
    delivery_partner?: {
        name: string;
    };
    order_type?: 'dine-in' | 'takeaway' | 'delivery';
    histories?: {
        from_status: OrderStatus;
        to_status: OrderStatus;
        note: string;
        created_at: string;
        user?: {
            name: string;
        }
    }[];
}
