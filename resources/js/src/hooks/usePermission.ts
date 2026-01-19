import { useAuth } from '../context/AuthContext';

/**
 * Hook to check granular permissions based on the Keyed Object structure.
 * Usage: const { canDo } = usePermission();
 * if (canDo('orders', 'create')) { ... }
 */
export const usePermission = () => {
    const { user } = useAuth();

    const canDo = (module: string, action: string): boolean => {
        // 1. Super Admin and Owners always have full access bypass
        if (user?.role === 'super_admin' || user?.role === 'owner') {
            return true;
        }

        // 2. Check the keyed object: user.permissions[module][action]
        // Example: user.permissions.orders?.read === true
        const modulePermissions = user?.permissions?.[module];
        
        if (!modulePermissions) {
            return false;
        }

        return modulePermissions[action] === true;
    };

    return { 
        canDo, 
        role: user?.role,
        permissions: user?.permissions 
    };
};