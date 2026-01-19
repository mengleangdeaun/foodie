import { format, isToday } from "date-fns";

/**
 * Global helper to format Order titles consistently.
 * Used by Admin Monitor, Kitchen Display, and Customer Tracking.
 */
export const getOrderDisplayLabel = (order: any) => {
    if (!order) return "---";

    // Ensure we handle both string and Date objects for created_at
    const orderDate = typeof order.created_at === 'string' 
        ? new Date(order.created_at) 
        : order.created_at;

    // 1. If the order happened today, show the Sequence Number
    if (isToday(orderDate)) {
        // Use the daily_sequence mapped by the backend
        // Fallback to ID if sequence is missing (e.g., during live Echo arrival)
        const sequence = order.daily_sequence || order.id;
        return `Order #${sequence} of Today`;
    }

    // 2. For past dates, show the full date and time
    // Example: "Jan 14, 3:45 PM"
    return format(orderDate, 'MMM d, h:mm a');
};