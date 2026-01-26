export const ORDER_STATUS = {
    PENDING: 'pending',       // Initial order from POS/QR
    CONFIRMED: 'confirmed',   // Accepted by staff
    COOKING: 'cooking',       // Currently in the kitchen
    READY: 'ready',           // Food is ready to be served
    IN_SERVICE: 'in_service', // Food served, customers currently eating
    PAID: 'paid',             // Bill settled, order closed
    CANCELLED: 'cancelled'    // Order voided
};

export const STATUS_CONFIG: Record<string, { 
    bg: string; 
    border: string; 
    text: string;
    darkBg: string;
    darkBorder: string;
    darkText: string;
    label: string;
    dot: string; // Add this
}> = {
    [ORDER_STATUS.PENDING]: { 
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        text: 'text-amber-700',
        darkBg: 'dark:bg-amber-950',
        darkBorder: 'dark:border-amber-700',
        darkText: 'dark:text-amber-300',
        label: 'Pending',
        dot: 'bg-amber-500' // Add dot color
    },
    [ORDER_STATUS.CONFIRMED]: { 
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-700',
        darkBg: 'dark:bg-blue-950',
        darkBorder: 'dark:border-blue-700',
        darkText: 'dark:text-blue-300',
        label: 'Confirmed',
        dot: 'bg-blue-500'
    },
    [ORDER_STATUS.COOKING]: { 
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        text: 'text-orange-700',
        darkBg: 'dark:bg-orange-950',
        darkBorder: 'dark:border-orange-700',
        darkText: 'dark:text-orange-300',
        label: 'Cooking',
        dot: 'bg-orange-500'
    },
    [ORDER_STATUS.READY]: { 
        bg: 'bg-green-50',
        border: 'border-green-300',
        text: 'text-green-700',
        darkBg: 'dark:bg-green-950',
        darkBorder: 'dark:border-green-700',
        darkText: 'dark:text-green-300',
        label: 'Ready',
        dot: 'bg-green-500'
    },
    [ORDER_STATUS.IN_SERVICE]: { 
        bg: 'bg-purple-50',
        border: 'border-purple-300',
        text: 'text-purple-700',
        darkBg: 'dark:bg-purple-950',
        darkBorder: 'dark:border-purple-700',
        darkText: 'dark:text-purple-300',
        label: 'In Service',
        dot: 'bg-purple-500'
    },
    [ORDER_STATUS.PAID]: { 
        bg: 'bg-slate-50',
        border: 'border-slate-300',
        text: 'text-slate-700',
        darkBg: 'dark:bg-slate-950',
        darkBorder: 'dark:border-slate-700',
        darkText: 'dark:text-slate-300',
        label: 'Paid',
        dot: 'bg-slate-500'
    },
    [ORDER_STATUS.CANCELLED]: { 
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-700',
        darkBg: 'dark:bg-red-950',
        darkBorder: 'dark:border-red-700',
        darkText: 'dark:text-red-300',
        label: 'Cancelled',
        dot: 'bg-red-500'
    },
};

