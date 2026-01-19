// resources/js/src/hooks/useKDSConnection.ts
import { useState, useEffect } from 'react';

export const useKDSConnection = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSocketConnected, setIsSocketConnected] = useState(true);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Monitor Echo/Socket Connection
        if (window.Echo) {
            window.Echo.connector.pusher.connection.bind('state_change', (states: any) => {
                setIsSocketConnected(states.current === 'connected');
            });
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, isSocketConnected };
};