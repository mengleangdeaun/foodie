// resources/js/src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import KitchenLayout from '../components/Layouts/KitchenLayout'; // Import your new layout
import { routes } from './routes';

const finalRoutes = routes.map((route) => {
    return {
        ...route,
        element: 
            route.layout === 'blank' ? (
                <BlankLayout>{route.element}</BlankLayout>
            ) : route.layout === 'kitchen' ? ( // Add this condition
                <KitchenLayout>{route.element}</KitchenLayout>
            ) : (
                <DefaultLayout>{route.element}</DefaultLayout>
            ),
    };
});

const router = createBrowserRouter(finalRoutes);

export default router;