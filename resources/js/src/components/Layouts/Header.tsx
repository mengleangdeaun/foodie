import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { IRootState } from '../../store';
import { toggleRTL, toggleTheme, toggleSidebar } from '../../store/themeConfigSlice';
import { useTranslation } from 'react-i18next';
import Dropdown from '../Dropdown';
import { useAuth } from '../../context/AuthContext'; //
import api from '../../util/api';
import { useToast, toast } from "@/hooks/use-toast";
import { usePermission } from '@/hooks/usePermission';
import {
    LayoutDashboard, Store, ClipboardList, Layers,
    Utensils, Hash, Users, Bike, UserCircle, ShoppingCart, List,
    ChefHat, Monitor, Warehouse,
    Dessert,
    Tag,
    Tags,
    RadioTower
} from 'lucide-react';

const Header = () => {
    const { user, logout, setUser } = useAuth(); //
    const { canDo, role } = usePermission();
    const location = useLocation();
    const [branches, setBranches] = useState<any[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    useEffect(() => {
        const selector = document.querySelector('ul.horizontal-menu a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
            for (let i = 0; i < all.length; i++) {
                all[0]?.classList.remove('active');
            }
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
                if (ele) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele?.classList.add('active');
                    });
                }
            }
        }
    }, [location]);

    useEffect(() => {
        if (user?.role === 'owner') {
            api.get('/admin/branches').then((res) => setBranches(res.data));
        }
    }, [user]);

    const switchBranch = async (branchId: number) => {
        try {
            const res = await api.post(`/admin/branches/${branchId}/switch`);
            setUser({ ...user!, branch_id: branchId, branch: res.data.branch });
            window.location.reload();
        } catch (error: any) {
            // This will now show the debug message from the controller
            console.error("Switch Error:", error.response?.data);
            toast({
                variant: "destructive",
                title: "Switch Failed",
                description: error.response?.data?.message || "Check console for details."
            });
        }
    };

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();



    const [flag, setFlag] = useState(themeConfig.locale);

    const { t } = useTranslation();

    return (
        <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
            <div className="shadow-sm">
                <div className="relative bg-white flex w-full items-center px-5 py-2.5 dark:bg-black">
                    <div className="horizontal-logo flex lg:hidden justify-between items-center ltr:mr-2 rtl:ml-2">
                        <NavLink to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-24 ml-[5px] flex-none" src="/assets/images/logo.svg" alt="logo" />
                        </NavLink>
                        <button
                            type="button"
                            className="collapse-icon flex-none dark:text-[#d0d2d6] hover:text-primary dark:hover:text-primary flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:bg-white-light/90 dark:hover:bg-dark/60"
                            onClick={() => {
                                dispatch(toggleSidebar());
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 7L4 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path opacity="0.5" d="M20 12L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M20 17L4 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>


                    <div className="sm:flex-1 ltr:sm:ml-0 ltr:ml-auto sm:rtl:mr-0 rtl:mr-auto flex items-center justify-end space-x-1.5 lg:space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
                        <div className="flex items-center gap-2">
                            {(role !== 'super_admin') && (
                                <>
                                    {user?.role === 'owner' ? (
                                        <div className="dropdown shrink-0">
                                            <Dropdown
                                                offset={[10, 0]}
                                                placement={isRtl ? 'bottom-start' : 'bottom-end'}
                                                btnClassName="flex items-center gap-2 p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                                                button={
                                                    <>
                                                        <span className="text-xs font-black uppercase tracking-tighter hidden md:block">
                                                            {user?.branch?.branch_name || 'Select Branch'}
                                                        </span>
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M7 17l5-5 5 5M7 7l5 5 5-5" />
                                                        </svg>
                                                    </>
                                                }
                                            >
                                                <ul className=" text-dark dark:text-white-dark w-[200px] font-semibold">
                                                    {branches.map((b) => (
                                                        <li key={b.id}>
                                                            <button
                                                                type="button"
                                                                className={`flex items-center w-full px-4 py-2 hover:bg-primary/10 ${user?.branch_id === b.id ? 'text-primary' : ''}`}
                                                                onClick={() => switchBranch(b.id)}
                                                            >
                                                                <span className="ltr:mr-2 rtl:ml-2 h-2 w-2 rounded-full" style={{ backgroundColor: b.primary_color }} />
                                                                {b.branch_name}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </Dropdown>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                            <Store size={16} />
                                            <span className="text-xs font-black uppercase tracking-tighter hidden md:block">
                                                {user?.branch?.branch_name || 'No Branch'}
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div>
                            {themeConfig.theme === 'light' ? (
                                <button
                                    className={`${themeConfig.theme === 'light' &&
                                        'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60'
                                        }`}
                                    onClick={() => {
                                        dispatch(toggleTheme('dark'));
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
                                        <path d="M12 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M12 20V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M4 12L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M22 12L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M19.7778 4.22266L17.5558 6.25424" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M4.22217 4.22266L6.44418 6.25424" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M6.44434 17.5557L4.22211 19.7779" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M19.7778 19.7773L17.5558 17.5551" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            ) : (
                                ''
                            )}
                            {themeConfig.theme === 'dark' && (
                                <button
                                    className={`${themeConfig.theme === 'dark' &&
                                        'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60'
                                        }`}
                                    onClick={() => {
                                        dispatch(toggleTheme('system'));
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M21.0672 11.8568L20.4253 11.469L21.0672 11.8568ZM12.1432 2.93276L11.7553 2.29085V2.29085L12.1432 2.93276ZM21.25 12C21.25 17.1086 17.1086 21.25 12 21.25V22.75C17.9371 22.75 22.75 17.9371 22.75 12H21.25ZM12 21.25C6.89137 21.25 2.75 17.1086 2.75 12H1.25C1.25 17.9371 6.06294 22.75 12 22.75V21.25ZM2.75 12C2.75 6.89137 6.89137 2.75 12 2.75V1.25C6.06294 1.25 1.25 6.06294 1.25 12H2.75ZM15.5 14.25C12.3244 14.25 9.75 11.6756 9.75 8.5H8.25C8.25 12.5041 11.4959 15.75 15.5 15.75V14.25ZM20.4253 11.469C19.4172 13.1373 17.5882 14.25 15.5 14.25V15.75C18.1349 15.75 20.4407 14.3439 21.7092 12.2447L20.4253 11.469ZM9.75 8.5C9.75 6.41182 10.8627 4.5828 12.531 3.57467L11.7553 2.29085C9.65609 3.5593 8.25 5.86509 8.25 8.5H9.75ZM12 2.75C11.9115 2.75 11.8077 2.71008 11.7324 2.63168C11.6686 2.56527 11.6538 2.50244 11.6503 2.47703C11.6461 2.44587 11.6482 2.35557 11.7553 2.29085L12.531 3.57467C13.0342 3.27065 13.196 2.71398 13.1368 2.27627C13.0754 1.82126 12.7166 1.25 12 1.25V2.75ZM21.7092 12.2447C21.6444 12.3518 21.5541 12.3539 21.523 12.3497C21.4976 12.3462 21.4347 12.3314 21.3683 12.2676C21.2899 12.1923 21.25 12.0885 21.25 12H22.75C22.75 11.2834 22.1787 10.9246 21.7237 10.8632C21.286 10.804 20.7293 10.9658 20.4253 11.469L21.7092 12.2447Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </button>
                            )}
                            {themeConfig.theme === 'system' && (
                                <button
                                    className={`${themeConfig.theme === 'system' &&
                                        'flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60'
                                        }`}
                                    onClick={() => {
                                        dispatch(toggleTheme('light'));
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M3 9C3 6.17157 3 4.75736 3.87868 3.87868C4.75736 3 6.17157 3 9 3H15C17.8284 3 19.2426 3 20.1213 3.87868C21 4.75736 21 6.17157 21 9V14C21 15.8856 21 16.8284 20.4142 17.4142C19.8284 18 18.8856 18 17 18H7C5.11438 18 4.17157 18 3.58579 17.4142C3 16.8284 3 15.8856 3 14V9Z"
                                            stroke="currentColor"
                                            strokeWidth="1.5"
                                        />
                                        <path opacity="0.5" d="M22 21H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M15 15H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div>
                            <button
                                className="flex items-center p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:text-primary hover:bg-white-light/90 dark:hover:bg-dark/60"
                                onClick={() => {
                                    if (isFullscreen) {
                                        document.exitFullscreen();
                                    } else {
                                        document.documentElement.requestFullscreen();
                                    }
                                }}
                            >
                                {isFullscreen ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.5" d="M2 13C2 13 2 16 5 16C8 16 8 13 8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M14 22C14 18.2288 14 16.3431 15.1716 15.1716C16.3431 14 18.2288 14 22 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                        <path opacity="0.5" d="M2 14C5.77124 14 7.65685 14 8.82843 15.1716C10 16.3431 10 18.2288 10 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                        <path d="M2 10C5.77124 10 7.65685 10 8.82843 8.82843C10 7.65685 10 5.77124 10 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                        <path opacity="0.5" d="M22 10C18.2288 10 16.3431 10 15.1716 8.82843C14 7.65685 14 5.77124 14 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path opacity="0.5" d="M22 14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M10 22C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path opacity="0.5" d="M10 2C6.22876 2 4.34315 2 3.17157 3.17157C2 4.34315 2 6.22876 2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M14 2C17.7712 2 19.6569 2 20.8284 3.17157C22 4.34315 22 6.22876 22 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <div className="dropdown shrink-0 flex">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="relative group block"
                                button={<img className="w-9 h-9 rounded-full object-cover saturate-50 group-hover:saturate-100" src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `/storage/${user.avatar}`) : "/assets/images/user-profile.jpeg"} alt="userProfile" />}
                            >
                                <ul className="text-dark dark:text-white-dark !py-0 w-[230px] font-semibold dark:text-white-light/90">
                                    <li>
                                        <div className="flex items-center px-4 py-4">
                                            <img className="rounded-md w-10 h-10 object-cover" src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `/storage/${user.avatar}`) : "/assets/images/user-profile.jpeg"} alt="userProfile" />
                                            <div className="ltr:pl-4 rtl:pr-4 truncate">
                                                <h4 className="text-base">
                                                    <p className="text-xs font-black uppercase tracking-tighter leading-none">{user?.name}</p>
                                                </h4>
                                                <button type="button" className="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-white">
                                                    <p className="text-[10px] text-slate-400">{user?.email?.replace('_', ' ')}</p>
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                    <li>
                                        <Link to="/users/profile" className="dark:hover:text-white">
                                            <svg className="ltr:mr-2 rtl:ml-2 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="12" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
                                                <path
                                                    opacity="0.5"
                                                    d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                />
                                            </svg>
                                            Profile
                                        </Link>
                                    </li>
                                    <li className="border-t border-white-light dark:border-white-light/10">
                                        <button
                                            type="button"
                                            className="text-danger flex items-center w-full px-4 py-3 font-black text-xs tracking-widest"
                                            onClick={logout}
                                        >
                                            <svg className="ltr:mr-2 rtl:ml-2 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path opacity="0.5" d="M9.00195 7C9.01406 4.82497 9.11051 3.64706 9.87889 2.87868C10.7576 2 12.1718 2 15.0002 2L16.0002 2C18.8286 2 20.2429 2 21.1215 2.87868C22.0002 3.75736 22.0002 5.17157 22.0002 8L22.0002 16C22.0002 18.8284 22.0002 20.2426 21.1215 21.1213C20.2429 22 18.8286 22 16.0002 22H15.0002C12.1718 22 10.7576 22 9.87889 21.1213C9.11051 20.3529 9.01406 19.175 9.00195 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                                                <path d="M15 12L2 12M2 12L5.5 9M2 12L5.5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                            </svg>

                                            {t('Sign Out')}
                                        </button>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* horizontal menu */}
                <ul className="horizontal-menu hidden py-1.5 font-semibold px-6 lg:space-x-1.5 xl:space-x-8 rtl:space-x-reverse bg-white border-t border-[#ebedf2] dark:border-[#191e3a] dark:bg-black text-black dark:text-white-dark">

                    {/* SaaS Management (Super Admin) */}
                    {role === 'super_admin' && (
                        <li className="menu nav-item relative">
                            <button type="button" className="nav-link">
                                <div className="flex items-center">
                                    <LayoutDashboard size={20} className="shrink-0" />
                                    <span className="px-1">{t('SaaS Management')}</span>
                                </div>
                                <div className="right_arrow">
                                    <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>
                            <ul className="sub-menu">
                                <li>
                                    <NavLink to="/super-admin/dashboard">{t('Dashboard')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/super-admin/onboard-restaurant">{t('Onboard Restaurant')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/super-admin/restaurants">{t('Manage Restaurants')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/super-admin/settings/landing-page">{t('Landing Page')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/super-admin/contact-messages">{t('Contact Messages')}</NavLink>
                                </li>
                            </ul>
                        </li>
                    )}

                    {/* Operations Group */}
                    {/* Operations Group */}
                    {(role !== 'super_admin' && (role === 'owner' ||
                        canDo('orders', 'pos_access') ||
                        canDo('orders', 'view_dashboard') ||
                        canDo('orders', 'view_history') ||
                        canDo('orders', 'view_live')
                    )) && (
                            <li className="menu nav-item relative">
                                <button type="button" className="nav-link">
                                    <div className="flex items-center">
                                        <LayoutDashboard size={20} className="shrink-0" />
                                        <span className="px-1">{t('Operations')}</span>
                                    </div>
                                    <div className="right_arrow">
                                        <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </button>
                                <ul className="sub-menu">
                                    {canDo('orders', 'pos_access') && (
                                        <li>
                                            <NavLink to="/admin/pos">{t('POS Terminal')}</NavLink>
                                        </li>
                                    )}
                                    {canDo('orders', 'view_dashboard') && (
                                        <li>
                                            <NavLink to="/admin/dashboard">{t('Overview')}</NavLink>
                                        </li>
                                    )}
                                    {canDo('orders', 'view_history') && (
                                        <li>
                                            <NavLink to="/admin/orders/history">{t('All Orders')}</NavLink>
                                        </li>
                                    )}
                                    {canDo('orders', 'view_live') && (
                                        <li>
                                            <NavLink to="/admin/live/orders">{t('Live Orders')}</NavLink>
                                        </li>
                                    )}
                                </ul>
                            </li>
                        )}

                    {/* Menu Management Group */}
                    {/* Menu Management Group */}
                    {(role !== 'super_admin' && (role === 'owner' ||
                        canDo('menu', 'manage_categories') ||
                        canDo('menu', 'manage_products') ||
                        canDo('menu', 'manage_inventory') ||
                        canDo('menu', 'manage_presets') ||
                        canDo('menu', 'manage_addons') ||
                        canDo('menu', 'manage_attributes')
                    )) && (
                            <li className="menu nav-item relative">
                                <button type="button" className="nav-link">
                                    <div className="flex items-center">
                                        <Utensils size={20} className="shrink-0" />
                                        <span className="px-1">{t('Menu')}</span>
                                    </div>
                                    <div className="right_arrow">
                                        <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </button>
                                <ul className="sub-menu">
                                    {canDo('menu', 'manage_categories') && (
                                        <li>
                                            <NavLink to="/admin/categories">{t('Categories')}</NavLink>
                                        </li>
                                    )}
                                    {canDo('menu', 'manage_products') && (
                                        <li>
                                            <NavLink to="/admin/products">{t('Products')}</NavLink>
                                        </li>
                                    )}
                                    {canDo('menu', 'manage_inventory') && (
                                        <li>
                                            <NavLink to="/admin/inventory">{t('Inventory')}</NavLink>
                                        </li>
                                    )}
                                    {canDo('menu', 'manage_presets') && (
                                        <li>
                                            <NavLink to="/admin/remark-presets">{t('Remark Presets')}</NavLink>
                                        </li>
                                    )}
                                    {canDo('menu', 'manage_addons') && (
                                        <li>
                                            <NavLink to="/admin/product-modifier">{t('Product Add on')}</NavLink>
                                        </li>
                                    )}
                                    {canDo('menu', 'manage_attributes') && (
                                        <li>
                                            <NavLink to="/admin/product-attribute">{t('Tags & Sizes')}</NavLink>
                                        </li>
                                    )}
                                </ul>
                            </li>
                        )}

                    {/* Management Group */}
                    {(role === 'owner' ||
                        canDo('management', 'view_business_insight') ||
                        canDo('management', 'manage_branches') ||
                        canDo('management', 'manage_staff') ||
                        canDo('management', 'manage_delivery_partners')) && (
                            <li className="menu nav-item relative">
                                <button type="button" className="nav-link">
                                    <div className="flex items-center">
                                        <Store size={20} className="shrink-0" />
                                        <span className="px-1">{t('Management')}</span>
                                    </div>
                                    <div className="right_arrow">
                                        <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </button>
                                <ul className="sub-menu">
                                    {canDo('management', 'view_business_insight') && (
                                        <li>
                                            <NavLink to="/admin/overview">{t('Overview')}</NavLink>
                                        </li>
                                    )}
                                    {canDo('management', 'manage_branches') && (
                                        <li>
                                            <NavLink to="/admin/branches">{t('Branches')}</NavLink>
                                        </li>
                                    )}
                                    {canDo('management', 'manage_staff') && (
                                        <li>
                                            <NavLink to="/admin/staff">{t('Staff Team')}</NavLink>
                                        </li>
                                    )}
                                    {canDo('management', 'manage_delivery_partners') && (
                                        <li>
                                            <NavLink to="/admin/delivery-partners">{t('Delivery Partners')}</NavLink>
                                        </li>
                                    )}
                                </ul>
                            </li>
                        )}

                    {/* Table Control */}
                    {/* Table Control */}
                    {(role !== 'super_admin' && (role === 'owner' || canDo('tables', 'manage_tables'))) && (
                        <li className="menu nav-item relative">
                            <button type="button" className="nav-link">
                                <div className="flex items-center">
                                    <Hash size={20} className="shrink-0" />
                                    <span className="px-1">{t('Tables')}</span>
                                </div>
                                <div className="right_arrow">
                                    <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>
                            <ul className="sub-menu">
                                <li>
                                    <NavLink to="/admin/tables">{t('Tables & QR')}</NavLink>
                                </li>
                            </ul>
                        </li>
                    )}

                    {/* Settings Group */}
                    {(role !== 'super_admin' && (role === 'owner' || canDo('management', 'manage_receipt_settings'))) && (
                        <li className="menu nav-item relative">
                            <button type="button" className="nav-link">
                                <div className="flex items-center">
                                    <svg className="shrink-0 group-hover:!text-primary" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8.42229 20.6181C10.1779 21.5395 11.0557 22.0001 12 22.0001V12.0001L2.63802 7.07275C2.62423 7.09491 2.6107 7.11727 2.5974 7.13986C2 8.15436 2 9.41678 2 11.9416V12.0586C2 14.5834 2 15.8459 2.5974 16.8604C3.19479 17.8749 4.27063 18.4395 6.42229 19.5686L8.42229 20.6181Z" fill="currentColor" />
                                        <path opacity="0.7" d="M17.5774 4.43152L15.5774 3.38197C13.8218 2.46066 12.944 2 11.9997 2C11.0554 2 10.1776 2.46066 8.42197 3.38197L6.42197 4.43152C4.31821 5.53552 3.24291 6.09982 2.6377 7.07264L11.9997 12L21.3617 7.07264C20.7564 6.09982 19.6811 5.53552 17.5774 4.43152Z" fill="currentColor" />
                                        <path opacity="0.5" d="M21.4026 7.13986C21.3893 7.11727 21.3758 7.09491 21.362 7.07275L12 12.0001V22.0001C12.9443 22.0001 13.8221 21.5395 15.5777 20.6181L17.5777 19.5686C19.7294 18.4395 20.8052 17.8749 21.4026 16.8604C22 15.8459 22 14.5834 22 12.0586V11.9416C22 9.41678 22 8.15436 21.4026 7.13986Z" fill="currentColor" />
                                    </svg>
                                    <span className="px-1">{t('Settings')}</span>
                                </div>
                                <div className="right_arrow">
                                    <svg className="rotate-90" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </button>
                            <ul className="sub-menu">
                                <li>
                                    <NavLink to="/users/profile">{t('Profile Setting')}</NavLink>
                                </li>
                                {canDo('management', 'manage_receipt_settings') && (
                                    <li>
                                        <NavLink to="/admin/settings/receipt">{t('Receipt Setting')}</NavLink>
                                    </li>
                                )}
                            </ul>
                        </li>
                    )}

                    {/* Kitchen */}
                    {(role === 'owner' || canDo('kitchen', 'access_kds')) && (
                        <li className="menu nav-item relative">
                            <NavLink to="/admin/kitchen" className="nav-link">
                                <div className="flex items-center">
                                    <Monitor size={20} className="shrink-0" />
                                    <span className="px-1">{t('KDS')}</span>
                                </div>
                            </NavLink>
                        </li>
                    )}
                </ul>
            </div>
        </header>
    );
};

export default Header;
