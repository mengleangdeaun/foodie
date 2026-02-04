import { lazy } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';

// Auth & Public
const Error = lazy(() => import('../components/Error'));
const Index = lazy(() => import('../pages/Index'));
const Login = lazy(() => import('../pages/Auth/login'));
const Unauthorized = lazy(() => import('../pages/Auth/Unauthorized'));
const AccountDeactivated = lazy(() => import('../pages/Auth/AccountDeactivated'));
const ForgotPassword = lazy(() => import('../pages/Auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/Auth/ResetPassword'));
const CustomerMenu = lazy(() => import('../pages/Customer/CustomerMenu'));


// Super Admin
const SuperAdminDashboard = lazy(() => import('../pages/SuperAdmin/Dashboard'));
const RestaurantList = lazy(() => import('../pages/SuperAdmin/RestaurantList'));
const OnboardRestaurant = lazy(() => import('../pages/SuperAdmin/OnboardRestaurant'));
const LandingPageSettings = lazy(() => import('../pages/SuperAdmin/LandingPageSettings'));
const ContactSubmissions = lazy(() => import('../pages/SuperAdmin/ContactSubmissions')); // New Import

// Owner & Operational
const OwnerDashboard = lazy(() => import('../pages/Owner/BranchDashboard'));
const OwnnerBranchOverview = lazy(() => import('../pages/Owner/Overview'));
const OwnerBranches = lazy(() => import('../pages/Owner/Branches'));
const BranchContent = lazy(() => import('../pages/Owner/BranchContent'));
const StaffManagement = lazy(() => import('../pages/Owner/StaffManagement'));
const DeliveryPartnerManagement = lazy(() => import('../pages/Owner/DeliveryPartnerManagement'));
const POSPage = lazy(() => import('../pages/Owner/POSPage'));
const ReceiptSettings = lazy(() => import('../pages/Owner/ReceiptSettings'));
const OrderManagement = lazy(() => import('../pages/Owner/OrderManagement'));
const LiveOrder = lazy(() => import('../pages/Owner/LiveOrder'));
const KitchenDisplay = lazy(() => import('../pages/Staff/KitchenDisplay'));
const KitchenHistory = lazy(() => import('../pages/Staff/KitchenHistory'));
const KitchenReports = lazy(() => import('../pages/Staff/KitchenReports'));

// User
const Profile = lazy(() => import('../pages/Users/Profile'));

// Inventory & Menu
const BranchInventory = lazy(() => import('../pages/Owner/BranchInventory'));
const BranchProPriceSize = lazy(() => import('../pages/Owner/BranchProductSizes'));
const ProductModifier = lazy(() => import('../pages/Owner/ProductModifier'));
const ProductAttribute = lazy(() => import('../pages/Owner/AttributeManager'));
const RemarkManagement = lazy(() => import('../pages/Owner/RemarkManagement'));
const OwnerCategories = lazy(() => import('../pages/Owner/Categories'));
const OwnerProducts = lazy(() => import('../pages/Owner/Products'));
const OwnerTables = lazy(() => import('../pages/Owner/Tables'));


const Register = lazy(() => import('../pages/Auth/Register')); // Import Register

const routes = [
    { path: '/register', element: <Register />, layout: 'blank' },
    { path: '/login', element: <Login />, layout: 'blank' },
    { path: '/auth/forgot-password', element: <ForgotPassword />, layout: 'blank' },
    // Route for reset password with token (handled by params)
    { path: '/reset-password', element: <ResetPassword />, layout: 'blank' },
    { path: '/menu/scan/:token', element: <CustomerMenu />, layout: 'blank' },
    { path: '/menu/scan/:token', element: <CustomerMenu />, layout: 'blank' },
    { path: '/admin/unauthorized', element: <Unauthorized />, layout: 'blank' },
    { path: '/auth/account-deactivated', element: <AccountDeactivated />, layout: 'blank' },


    // --- Super Admin ---
    { path: '/super-admin/dashboard', element: <ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>, layout: 'default' },
    { path: '/super-admin/restaurants', element: <ProtectedRoute><RestaurantList /></ProtectedRoute>, layout: 'default' },
    { path: '/super-admin/restaurants', element: <ProtectedRoute><RestaurantList /></ProtectedRoute>, layout: 'default' },
    { path: '/super-admin/onboard-restaurant', element: <ProtectedRoute><OnboardRestaurant /></ProtectedRoute>, layout: 'default' },
    { path: '/super-admin/settings/landing-page', element: <ProtectedRoute><LandingPageSettings /></ProtectedRoute>, layout: 'default' },
    { path: '/super-admin/contact-messages', element: <ProtectedRoute><ContactSubmissions /></ProtectedRoute>, layout: 'default' },

    // --- POS & Orders (Granular) ---
    {
        path: '/admin/pos',
        element: <ProtectedRoute requiredPermission={{ module: 'orders', action: 'pos_access' }}><POSPage /></ProtectedRoute>,
        layout: 'default',
    },
    {
        path: '/admin/orders/history',
        element: <ProtectedRoute requiredPermission={{ module: 'orders', action: 'view_history' }}><OrderManagement /></ProtectedRoute>,
        layout: 'default',
    },
    {
        path: '/admin/live/orders',
        element: <ProtectedRoute requiredPermission={{ module: 'orders', action: 'view_live' }}><LiveOrder /></ProtectedRoute>,
        layout: 'default',
    },
    {
        path: '/admin/kitchen',
        element: <ProtectedRoute requiredPermission={{ module: 'kitchen', action: 'access_kds' }}><KitchenDisplay /></ProtectedRoute>,
        layout: 'kitchen',
    },
    {
        path: '/admin/kitchen/history',
        element: <ProtectedRoute requiredPermission={{ module: 'kitchen', action: 'access_kds' }}><KitchenHistory /></ProtectedRoute>,
        layout: 'kitchen',
    },
    {
        path: '/admin/kitchen/reports/shift',
        element: <ProtectedRoute requiredPermission={{ module: 'kitchen', action: 'access_kds' }}><KitchenReports /></ProtectedRoute>,
        layout: 'kitchen',
    },
    // --- Management (Owner Only) ---
    { path: '/admin/overview', element: <ProtectedRoute requiredPermission={{ module: 'management', action: 'view_business_insight' }}><OwnnerBranchOverview /></ProtectedRoute>, layout: 'default' },
    { path: '/admin/dashboard', element: <ProtectedRoute requiredPermission={{ module: 'orders', action: 'view_dashboard' }}><OwnerDashboard /></ProtectedRoute>, layout: 'default' },
    { path: '/admin/branches', element: <ProtectedRoute requiredPermission={{ module: 'management', action: 'manage_branches' }}><OwnerBranches /></ProtectedRoute>, layout: 'default' },
    { path: '/owner/branches/:id/content', element: <ProtectedRoute requiredPermission={{ module: 'management', action: 'manage_branches' }}><BranchContent /></ProtectedRoute>, layout: 'default' },
    { path: '/admin/staff', element: <ProtectedRoute requiredPermission={{ module: 'management', action: 'manage_staff' }}><StaffManagement /></ProtectedRoute>, layout: 'default' },
    { path: '/admin/delivery-partners', element: <ProtectedRoute requiredPermission={{ module: 'management', action: 'manage_delivery_partners' }}><DeliveryPartnerManagement /></ProtectedRoute>, layout: 'default' },
    { path: '/admin/settings/receipt', element: <ProtectedRoute><ReceiptSettings /></ProtectedRoute>, layout: 'default' },

    // --- User Profile ---
    { path: '/users/profile', element: <ProtectedRoute><Profile /></ProtectedRoute>, layout: 'default' },

    // --- Menu & Inventory (Granular) ---
    {
        path: '/admin/inventory',
        element: <ProtectedRoute requiredPermission={{ module: 'menu', action: 'manage_inventory' }}><BranchInventory /></ProtectedRoute>,
        layout: 'default',
    },
    {
        path: '/admin/price-size/:branchId/products/:productId/sizes',
        element: <ProtectedRoute requiredPermission={{ module: 'menu', action: 'manage_products' }}><BranchProPriceSize /></ProtectedRoute>,
        layout: 'default',
    },
    {
        path: '/admin/remark-presets',
        element: <ProtectedRoute requiredPermission={{ module: 'menu', action: 'manage_presets' }}><RemarkManagement /></ProtectedRoute>,
        layout: 'default',
    },
    {
        path: '/admin/product-modifier',
        element: <ProtectedRoute requiredPermission={{ module: 'menu', action: 'manage_addons' }}><ProductModifier /></ProtectedRoute>,
        layout: 'default',
    },
    {
        path: '/admin/product-attribute',
        element: <ProtectedRoute requiredPermission={{ module: 'menu', action: 'manage_attributes' }}><ProductAttribute /></ProtectedRoute>,
        layout: 'default',
    },
    {
        path: '/admin/categories',
        element: <ProtectedRoute requiredPermission={{ module: 'menu', action: 'manage_categories' }}><OwnerCategories /></ProtectedRoute>,
        layout: 'default',
    },
    {
        path: '/admin/products',
        element: <ProtectedRoute requiredPermission={{ module: 'menu', action: 'manage_products' }}><OwnerProducts /></ProtectedRoute>,
        layout: 'default',
    },
    {
        path: '/admin/tables',
        element: <ProtectedRoute requiredPermission={{ module: 'tables', action: 'manage_tables' }}><OwnerTables /></ProtectedRoute>,
        layout: 'default',
    },
    {
        path: '*',
        element: <Error />,
        layout: 'blank',
    },

    { path: '/', element: <Index />, layout: 'blank' },
];

export { routes };