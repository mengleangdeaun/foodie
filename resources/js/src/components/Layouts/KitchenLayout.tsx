import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
    Volume2, VolumeX, MonitorPlay, History, 
    LogOut, Wifi, WifiOff, User, 
    BarChart3, Bell, Menu, X
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useKDSConnection } from '@/hooks/useKDSConnection';
import { motion } from "framer-motion";

const KitchenLayout = ({ children }: { children: React.ReactNode }) => {
    const { user, logout } = useAuth();
    const { isOnline, isSocketConnected } = useKDSConnection();
    const [isMuted, setIsMuted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    const navigation = [
        { to: "/admin/kitchen", label: "Active Orders", icon: MonitorPlay },
        { to: "/admin/kitchen/history", label: "History", icon: History },
        { to: "/admin/kitchen/reports/shift", label: "Reports", icon: BarChart3 },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-950 text-white">
            {/* Connection Status Banner */}
            {(!isOnline || !isSocketConnected) && (
                <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 to-red-700 p-3 text-center animate-pulse">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium">
                        <WifiOff size={16} />
                        <span>Connection Lost - Attempting to reconnect...</span>
                    </div>
                </div>
            )}

            {/* Enhanced Header */}
            <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-lg border-b border-slate-700/50">
                <div className="px-4 lg:px-6">
                    <div className="flex items-center justify-between h-16">
                        {/* Left Section */}
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="lg:hidden p-2 rounded-lg hover:bg-slate-800"
                            >
                                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                            
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
                                    <MonitorPlay size={20} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold leading-none">{user?.branch?.branch_name}</h1>
                                    <p className="text-xs text-slate-400 font-medium">Kitchen Display System</p>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.to;
                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive
                                            ? 'bg-white text-slate-900'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                        }`}
                                    >
                                        <Icon size={16} />
                                        {item.label}
                                    </NavLink>
                                );
                            })}
                        </nav>

                        {/* Right Section */}
                        <div className="flex items-center gap-2">
                            {/* Connection Status */}
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50">
                                <div className={`h-2 w-2 rounded-full ${isOnline && isSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-xs font-medium">
                                    {isOnline && isSocketConnected ? 'Connected' : 'Offline'}
                                </span>
                            </div>

                            {/* Sound Toggle */}
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`p-2 rounded-lg transition-colors ${
                                    isMuted
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-slate-800 hover:bg-slate-700'
                                }`}
                                title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>

                            {/* User Menu */}
                            <div className="relative group">
                                <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-slate-700 to-slate-600 flex items-center justify-center">
                                        <User size={16} />
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium">{user?.name}</p>
                                        <p className="text-xs text-slate-400">Head Chef</p>
                                    </div>
                                </button>
                                
                                {/* Dropdown Menu */}
                                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                    <div className="p-3 border-b border-slate-700">
                                        <p className="text-sm font-medium">{user?.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
                                    </div>
                                    <button
                                        onClick={logout}
                                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-b-lg"
                                    >
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <motion.nav
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="lg:hidden border-t border-slate-800"
                    >
                        <div className="px-4 py-3 space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.to;
                                return (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                                            isActive
                                            ? 'bg-white text-slate-900'
                                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                                        }`}
                                    >
                                        <Icon size={18} />
                                        {item.label}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </motion.nav>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                {React.cloneElement(children as React.ReactElement, { isMuted })}
            </main>

            {/* Status Bar */}
            <div className="hidden md:block sticky bottom-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-700/50">
                <div className="px-6 py-2">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                            <span className="text-slate-400 font-medium">
                                Branch: <span className="text-white">{user?.branch?.branch_name}</span>
                            </span>
                            <span className="text-slate-400 font-medium">
                                Terminal: <span className="text-white">KDS-{String(user?.id).slice(-4)}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-slate-400 font-medium">
                                Last Update: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <div className="flex items-center gap-1">
                                <Wifi size={12} className={isOnline && isSocketConnected ? 'text-green-500' : 'text-red-500'} />
                                <span className={isOnline && isSocketConnected ? 'text-green-500' : 'text-red-500'}>
                                    {isOnline && isSocketConnected ? 'Live' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KitchenLayout;