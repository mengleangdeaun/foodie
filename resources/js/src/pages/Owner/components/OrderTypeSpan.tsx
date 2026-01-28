import React from 'react';

interface OrderTypeSpanProps {
    type: string;
}

const OrderTypeSpan: React.FC<OrderTypeSpanProps> = ({ type }) => {
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'qr_scan':
                return 'QR Scan';
            case 'takeaway':
                return 'Takeaway';
            case 'delivery':
                return 'Delivery';
            default:
                return type.replace('_', ' ');
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'qr_scan':
                return 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40 rounded px-2 py-0.5';
            case 'takeaway':
                return 'text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40 rounded px-2 py-0.5';
            case 'delivery':
                return 'text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/40 rounded px-2 py-0.5';
            default:
                return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-800 rounded px-2 py-0.5';
        }
    };

    return (
        <span className={`text-xs font-semibold capitalize ${getTypeColor(type)}`}>
            {getTypeLabel(type)}
        </span>
    );
};

export default OrderTypeSpan;
