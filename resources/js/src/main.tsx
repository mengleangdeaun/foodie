import './util/echo';
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './context/AuthContext';

// Perfect Scrollbar
import 'react-perfect-scrollbar/dist/css/styles.css';

// Tailwind css
import './tailwind.css';

// i18n (needs to be bundled)
import './i18n';

// Router
import { RouterProvider } from 'react-router-dom';
import router from './router/index';

// Redux
import { Provider } from 'react-redux';
import store from './store/index';


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Suspense>
            <Provider store={store}>
                <AuthProvider> 
                    <RouterProvider router={router} />
                </AuthProvider>
            </Provider>
        </Suspense>
    </React.StrictMode>
);

