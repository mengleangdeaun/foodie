// resources/js/src/util/permissions.ts

export const PERMISSION_MAP = {
    orders: {
        label: 'Order Management',
        actions: ['read', 'create', 'update', 'delete', 'print_bill']
    },
    menu: {
        label: 'Menu & Catalog',
        actions: ['read', 'create', 'update', 'delete', 'sync_inventory']
    },
    staff: {
        label: 'Staff & Roles',
        actions: ['read', 'create', 'update', 'delete']
    },
    tables: {
        label: 'Table & QR Control',
        actions: ['read', 'create', 'update', 'delete']
    }
};

/**
 * Templates for common roles to speed up onboarding
 */
export const ROLE_PRESETS = {
    chef: {
        orders: { read: true, update: true },
        menu: { read: true }
    },
    waiter: {
        orders: { read: true, create: true },
        menu: { read: true }
    },
    cashier: {
        orders: { read: true, update: true, print_bill: true },
        menu: { read: true }
    },
    manager: {
        orders: { read: true, create: true, update: true, delete: true, print_bill: true },
        menu: { read: true, create: true, update: true, delete: true, sync_inventory: true },
        tables: { read: true, create: true, update: true, delete: true }
    }
};