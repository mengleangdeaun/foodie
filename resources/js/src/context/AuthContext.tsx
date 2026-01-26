import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/util/api';

interface Branch {
    id: number;
    branch_name: string;
    primary_color: string;
    font_family: string;
    logo_path: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    branch_id: number | null;
    branch?: Branch; // Optional branch data
    permissions: Record<string, Record<string, boolean>>;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (token: string, remember?: boolean) => Promise<void>;
    logout: () => void;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // Fetch the user data from Laravel /api/user
            const res = await api.get('/user');
            setUser(res.data);
        } catch (error) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (token: string, remember: boolean = false) => {
        if (remember) {
            localStorage.setItem('token', token);
        } else {
            sessionStorage.setItem('token', token);
        }

        setLoading(true); // Show loader while we fetch the fresh user data
        try {
            const res = await api.get('/user');
            setUser(res.data);
        } catch (error) {
            console.error("Login verification failed", error);
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};

// This is the "useAuth" hook we will import in other files
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};