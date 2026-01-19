export const ORDER_STATUS = {
    PENDING: 'pending',       // Initial order from POS/QR
    CONFIRMED: 'confirmed',   // Accepted by staff
    COOKING: 'cooking',       // Currently in the kitchen
    READY: 'ready',           // Food is ready to be served
    IN_SERVICE: 'in_service', // Food served, customers currently eating
    PAID: 'paid',             // Bill settled, order closed
    CANCELLED: 'cancelled'    // Order voided
};

export const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    [ORDER_STATUS.PENDING]: { color: 'bg-amber-500', label: 'Pending' },
    [ORDER_STATUS.CONFIRMED]: { color: 'bg-blue-500', label: 'Confirmed' },
    [ORDER_STATUS.COOKING]: { color: 'bg-orange-500', label: 'Cooking' },
    [ORDER_STATUS.READY]: { color: 'bg-green-500', label: 'Ready' },
    [ORDER_STATUS.IN_SERVICE]: { color: 'bg-purple-600', label: 'In Service' },
    [ORDER_STATUS.PAID]: { color: 'bg-slate-600', label: 'Paid' },
    [ORDER_STATUS.CANCELLED]: { color: 'bg-red-600', label: 'Cancelled' },
};