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
                        <Link to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-8 ltr:-ml-1 rtl:-mr-1 inline" src="/assets/images/logo.svg" alt="logo" />
                            <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5  font-semibold  align-middle hidden md:inline dark:text-white-light transition-all duration-300">VRISTO</span>
                        </Link>
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
                                            className="text-danger flex items-center w-full px-4 py-3 font-black uppercase italic text-xs tracking-widest"
                                            onClick={logout}
                                        >
                                            <svg className="ltr:mr-2 rtl:ml-2 rotate-90" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="1.5" />
                                            </svg>
                                            {t('sign_out')}
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
                    {(role !== 'super_admin' && (role === 'owner' || canDo('orders', 'read'))) && (
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
                                {canDo('orders', 'create') && (
                                    <li>
                                        <NavLink to="/admin/pos">{t('POS Terminal')}</NavLink>
                                    </li>
                                )}
                                <li>
                                    <NavLink to="/admin/dashboard">{t('Overview')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/orders/history">{t('All Orders')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/live/orders">{t('Live Orders')}</NavLink>
                                </li>
                            </ul>
                        </li>
                    )}

                    {/* Menu Management Group */}
                    {(role !== 'super_admin' && (role === 'owner' || canDo('menu', 'read'))) && (
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
                                <li>
                                    <NavLink to="/admin/categories">{t('Categories')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/products">{t('Products')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/inventory">{t('Inventory')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/remark-presets">{t('Remark Presets')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/product-modifier">{t('Product Add on')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/product-attribute">{t('Tags & Sizes')}</NavLink>
                                </li>
                            </ul>
                        </li>
                    )}

                    {/* Management Group (Owner Only) */}
                    {role === 'owner' && (
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
                                <li>
                                    <NavLink to="/admin/overview">{t('Overview')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/branches">{t('Branches')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/staff">{t('Staff Team')}</NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/delivery-partners">{t('Delivery Partners')}</NavLink>
                                </li>
                            </ul>
                        </li>
                    )}

                    {/* Table Control */}
                    {(role !== 'super_admin' && (role === 'owner' || canDo('tables', 'read'))) && (
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

                    {/* Kitchen */}
                    {['owner', 'manager', 'chef'].includes(user?.role || '') && (
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
