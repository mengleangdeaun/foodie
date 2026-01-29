import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children, requiredPermission }: { children: JSX.Element, requiredPermission?: { module: string, action: string } }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    // 1. Hard Loading: Wait if the system is still fetching initial auth
    if (loading) return null;

    // 2. No User: Redirect to login
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. Permission Check Logic
    // 3. Permission Check Logic
    if (requiredPermission && user.role !== 'owner' && user.role !== 'super_admin') {
        const { module, action } = requiredPermission;

        // --- THE CRITICAL GUARD ---
        // If the user object is present but doesn't have permissions yet, 
        // stay in a loading state instead of redirecting to unauthorized.
        if (!user.permissions) {
            return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
        }

        // Final check: Use optional chaining and force boolean
        const hasAccess = !!user.permissions?.[module]?.[action];

        if (!hasAccess) {
            console.warn(`[ProtectedRoute] Unauthorized Access Attempt:`);
            console.warn(`- User Role: ${user.role}`);
            console.warn(`- Required: Module[${module}] -> Action[${action}]`);
            console.warn(`- User Permissions for Module[${module}]:`, user.permissions[module]);
            return <Navigate to="/admin/unauthorized" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;