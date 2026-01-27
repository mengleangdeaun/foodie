import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/context/AuthContext'; //
import AnimateHeight from 'react-animate-height';
import {
    LayoutDashboard, Store, ClipboardList, Layers,
    Utensils, Hash, Users, Bike, UserCircle, ShoppingCart, List,
    ChefHat, Monitor, Warehouse,
    Dessert,
    Tag,
    Tags,
    RadioTower, Mail
} from 'lucide-react';

const Sidebar = () => {
    const [currentMenu, setCurrentMenu] = useState<string>('');
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { canDo, role } = usePermission();
    const { user } = useAuth(); //

    const toggleMenu = (value: string) => {
        setCurrentMenu((oldValue) => {
            return oldValue === value ? '' : value;
        });
    };

    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}>
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-white-light dark:border-dark">
                        <NavLink to="/" className="main-logo flex items-center shrink-0">
                            <img className="w-8 ml-[5px] flex-none" src="/assets/images/logo.svg" alt="logo" />
                            <span className="text-2xl ltr:ml-1.5 rtl:mr-1.5 font-black align-middle lg:inline dark:text-white-light uppercase ">{t('Foodie')}</span>
                        </NavLink>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">

                            {['owner', 'manager', 'chef'].includes(user?.role || '') && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px] ">
                                        <span>{t('Kitchen Display')}</span>
                                    </h2>
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/kitchen" className="nav-link group w-full">
                                            <Monitor size={20} className=" group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3 font-black uppercase ">{t('Live KDS Terminal')}</span>
                                        </NavLink>
                                    </li>
                                </>
                            )}


                            {/* --- SUPER ADMIN SECTION --- */}
                            {role === 'super_admin' && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1  text-[11px]">
                                        <span>{t('SaaS Management')}</span>
                                    </h2>
                                    <li className="menu nav-item">
                                        <NavLink to="/super-admin/dashboard" className="nav-link group w-full">
                                            <LayoutDashboard size={20} className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Dashboard')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/super-admin/onboard-restaurant" className="nav-link group w-full">
                                            <LayoutDashboard size={20} className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Onboard Restaurant')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/super-admin/restaurants" className="nav-link group w-full">
                                            <Store size={20} className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Manage Restaurants')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/super-admin/settings/landing-page" className="nav-link group w-full">
                                            <Monitor size={20} className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Landing Page')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/super-admin/contact-messages" className="nav-link group w-full">
                                            <Mail size={20} className="group-hover:!text-primary shrink-0" />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Contact Messages')}</span>
                                        </NavLink>
                                    </li>
                                </>
                            )}

                            {/* --- RESTAURANT OPERATIONS --- */}
                            {(role !== 'super_admin' && (role === 'owner' || canDo('orders', 'read'))) && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px]">
                                        <span>{t('Operations')}</span>
                                    </h2>
                                    {canDo('orders', 'create') && (
                                        <li className="menu nav-item !mt-1">
                                            <NavLink to="/admin/pos" className="nav-link group w-full bg-primary/10 text-primary border border-primary/20 mb-2">
                                                <ShoppingCart size={20} className='group-hover:!text-primary shrink-0' />
                                                <span className="ltr:pl-3 rtl:pr-3 font-black uppercase">{t('POS Terminal')}</span>
                                            </NavLink>
                                        </li>
                                    )}
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/dashboard" className="nav-link group w-full">
                                            <LayoutDashboard size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Overview')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/orders/history" className="nav-link group w-full">
                                            <ClipboardList size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('All Orders')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/live/orders" className="nav-link group w-full">
                                            <RadioTower size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Live Orders')}</span>
                                        </NavLink>
                                    </li>
                                </>
                            )}

                            {/* --- MENU MANAGEMENT --- */}
                            {(role !== 'super_admin' && (role === 'owner' || canDo('menu', 'read'))) && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px]">
                                        <span>{t('Menu Management')}</span>
                                    </h2>
                                    <li className="menu nav-item !mt-1">
                                        <NavLink to="/admin/categories" className="nav-link group w-full">
                                            <List size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Categories')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/products" className="nav-link group w-full">
                                            <Utensils size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Products')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/inventory" className="nav-link group w-full">
                                            <Warehouse size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Inventory')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item hidden">
                                        <NavLink to="/admin/price-size" className="nav-link group w-full">
                                            <Layers size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Product Price & Size')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/remark-presets" className="nav-link group w-full">
                                            <Tag size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Remark Presets')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/product-modifier" className="nav-link group w-full">
                                            <Dessert size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Product Add on')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/product-attribute" className="nav-link group w-full">
                                            <Tags size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Tags & Sizes')}</span>
                                        </NavLink>
                                    </li>
                                </>
                            )}

                            {/* --- TABLE & QR CONTROL --- */}
                            {(role !== 'super_admin' && (role === 'owner' || canDo('tables', 'read'))) && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px]">
                                        <span>{t('Table Control')}</span>
                                    </h2>
                                    <li className="menu nav-item !mt-1">
                                        <NavLink to="/admin/tables" className="nav-link group w-full">
                                            <Hash size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Tables & QR')}</span>
                                        </NavLink>
                                    </li>
                                </>
                            )}

                            {/* --- BUSINESS MANAGEMENT --- */}
                            {role === 'owner' && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px]">
                                        <span>{t('Management')}</span>
                                    </h2>
                                    <li className="menu nav-item !mt-1">
                                        <NavLink to="/admin/overview" className="nav-link group w-full">
                                            <LayoutDashboard size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Overview')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/branches" className="nav-link group w-full">
                                            <Store size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Branches')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/staff" className="nav-link group w-full">
                                            <Users size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Staff Team')}</span>
                                        </NavLink>
                                    </li>
                                    <li className="menu nav-item">
                                        <NavLink to="/admin/delivery-partners" className="nav-link group w-full">
                                            <Bike size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Delivery Partners')}</span>
                                        </NavLink>
                                    </li>
                                </>
                            )}


                            {role !== 'super_admin' && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px]">
                                        <span>{t('Settings')}</span>
                                    </h2>

                                    <li className="menu nav-item">
                                        <button type="button" className={`${currentMenu === 'component' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('component')}>
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path
                                                        d="M8.42229 20.6181C10.1779 21.5395 11.0557 22.0001 12 22.0001V12.0001L2.63802 7.07275C2.62423 7.09491 2.6107 7.11727 2.5974 7.13986C2 8.15436 2 9.41678 2 11.9416V12.0586C2 14.5834 2 15.8459 2.5974 16.8604C3.19479 17.8749 4.27063 18.4395 6.42229 19.5686L8.42229 20.6181Z"
                                                        fill="currentColor"
                                                    />
                                                    <path
                                                        opacity="0.7"
                                                        d="M17.5774 4.43152L15.5774 3.38197C13.8218 2.46066 12.944 2 11.9997 2C11.0554 2 10.1776 2.46066 8.42197 3.38197L6.42197 4.43152C4.31821 5.53552 3.24291 6.09982 2.6377 7.07264L11.9997 12L21.3617 7.07264C20.7564 6.09982 19.6811 5.53552 17.5774 4.43152Z"
                                                        fill="currentColor"
                                                    />
                                                    <path
                                                        opacity="0.5"
                                                        d="M21.4026 7.13986C21.3893 7.11727 21.3758 7.09491 21.362 7.07275L12 12.0001V22.0001C12.9443 22.0001 13.8221 21.5395 15.5777 20.6181L17.5777 19.5686C19.7294 18.4395 20.8052 17.8749 21.4026 16.8604C22 15.8459 22 14.5834 22 12.0586V11.9416C22 9.41678 22 8.15436 21.4026 7.13986Z"
                                                        fill="currentColor"
                                                    />
                                                </svg>
                                                <span className="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">{t('Settings')}</span>
                                            </div>

                                            <div className={currentMenu === 'component' ? 'rotate-90' : 'rtl:rotate-180'}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M9 5L15 12L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </button>

                                        <AnimateHeight duration={300} height={currentMenu === 'component' ? 'auto' : 0}>
                                            <ul className="sub-menu text-gray-500">
                                                <li>
                                                    <NavLink to="/users/profile">{t('Profile Setting')}</NavLink>
                                                </li>
                                                <li>
                                                    <NavLink to="/admin/settings/receipt">{t('Receipt Setting')}</NavLink>
                                                </li>
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                </>
                            )}

                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px]">
                                <span>{t('System')}</span>
                            </h2>
                            <li className="menu nav-item">
                                <NavLink to="/users/profile" className="nav-link group w-full">
                                    <UserCircle size={20} className='group-hover:!text-primary shrink-0' />
                                    <span className="ltr:pl-3 rtl:pr-3">{t('My Profile')}</span>
                                </NavLink>
                            </li>
                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;