// resources/js/src/util/permissions.ts

export const PERMISSION_MAP = {
    // 1. Operations
    orders: {
        label: 'Operations',
        actions: ['pos_access', 'view_dashboard', 'view_history', 'view_live']
    },
    // 2. Menu Management
    menu: {
        label: 'Menu Management',
        actions: ['manage_categories', 'manage_products', 'manage_inventory', 'manage_presets', 'manage_addons', 'manage_attributes']
    },
    // 3. Table Control
    tables: {
        label: 'Table Control',
        actions: ['manage_tables']
    },
    // 4. Kitchen Display
    kitchen: {
        label: 'Kitchen Display',
        actions: ['access_kds']
    },
    // 5. Management (Business)
    management: {
        label: 'Management',
        actions: ['view_business_insight', 'manage_branches', 'manage_staff', 'manage_delivery_partners', 'manage_permissions', 'manage_receipt_settings']
    }
};

/**
 * Templates for common roles to speed up onboarding
 */
export const ROLE_PRESETS = {
    chef: {
        kitchen: { access_kds: true },
        orders: { view_live: true },
        menu: { manage_inventory: true }
    },
    waiter: {
        orders: { pos_access: true, view_live: true },
        tables: { manage_tables: true }, // Usually waiters need to check tables
        menu: { manage_products: false } // Read-only access isn't explicitly defined yet, relying on 'manage' for edit. 
        // For now, let's assume they might need to see menu, but 'manage' implies edit.
        // If we need read-only, we might need 'view_products'.
        // For now, following the plan 1:1 with Sidebar.
    },
    cashier: {
        orders: { pos_access: true, view_history: true, view_dashboard: true, view_live: true },
        tables: { manage_tables: true }
    },
    manager: {
        orders: { pos_access: true, view_dashboard: true, view_history: true, view_live: true },
        menu: { manage_categories: true, manage_products: true, manage_inventory: true, manage_presets: true, manage_addons: true, manage_attributes: true },
        tables: { manage_tables: true },
        management: { manage_staff: true, manage_delivery_partners: true, manage_permissions: true, manage_receipt_settings: true }
    }
};