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
                            <img className="w-24 ml-[5px] flex-none" src="/assets/images/logo.svg" alt="logo" />
                        </NavLink>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">

                            {/* --- KITCHEN DISPLAY --- */}
                            {(role !== 'super_admin' && canDo('kitchen', 'access_kds')) && (
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
                            {role !== 'super_admin' && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px]">
                                        <span>{t('Operations')}</span>
                                    </h2>
                                    {canDo('orders', 'pos_access') && (
                                        <li className="menu nav-item !mt-1">
                                            <NavLink to="/admin/pos" className="nav-link group w-full bg-primary/10 text-primary border border-primary/20 mb-2">
                                                <ShoppingCart size={20} className='group-hover:!text-primary shrink-0' />
                                                <span className="ltr:pl-3 rtl:pr-3 font-black uppercase">{t('POS Terminal')}</span>
                                            </NavLink>
                                        </li>
                                    )}
                                    {canDo('orders', 'view_dashboard') && (
                                        <li className="menu nav-item">
                                            <NavLink to="/admin/dashboard" className="nav-link group w-full">
                                                <LayoutDashboard size={20} className='group-hover:!text-primary shrink-0' />
                                                <span className="ltr:pl-3 rtl:pr-3">{t('Overview')}</span>
                                            </NavLink>
                                        </li>
                                    )}
                                    {canDo('orders', 'view_history') && (
                                        <li className="menu nav-item">
                                            <NavLink to="/admin/orders/history" className="nav-link group w-full">
                                                <ClipboardList size={20} className='group-hover:!text-primary shrink-0' />
                                                <span className="ltr:pl-3 rtl:pr-3">{t('All Orders')}</span>
                                            </NavLink>
                                        </li>
                                    )}
                                    {canDo('orders', 'view_live') && (
                                        <li className="menu nav-item">
                                            <NavLink to="/admin/live/orders" className="nav-link group w-full">
                                                <RadioTower size={20} className='group-hover:!text-primary shrink-0' />
                                                <span className="ltr:pl-3 rtl:pr-3">{t('Live Orders')}</span>
                                            </NavLink>
                                        </li>
                                    )}
                                </>
                            )}

                            {/* --- MENU MANAGEMENT --- */}
                            {role !== 'super_admin' && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px]">
                                        <span>{t('Menu Management')}</span>
                                    </h2>
                                    {canDo('menu', 'manage_categories') && (
                                        <li className="menu nav-item !mt-1">
                                            <NavLink to="/admin/categories" className="nav-link group w-full">
                                                <List size={20} className='group-hover:!text-primary shrink-0' />
                                                <span className="ltr:pl-3 rtl:pr-3">{t('Categories')}</span>
                                            </NavLink>
                                        </li>
                                    )}
                                    {canDo('menu', 'manage_products') && (
                                        <li className="menu nav-item">
                                            <NavLink to="/admin/products" className="nav-link group w-full">
                                                <Utensils size={20} className='group-hover:!text-primary shrink-0' />
                                                <span className="ltr:pl-3 rtl:pr-3">{t('Products')}</span>
                                            </NavLink>
                                        </li>
                                    )}
                                    {canDo('menu', 'manage_inventory') && (
                                        <li className="menu nav-item">
                                            <NavLink to="/admin/inventory" className="nav-link group w-full">
                                                <Warehouse size={20} className='group-hover:!text-primary shrink-0' />
                                                <span className="ltr:pl-3 rtl:pr-3">{t('Inventory')}</span>
                                            </NavLink>
                                        </li>
                                    )}
                                    <li className="menu nav-item hidden">
                                        <NavLink to="/admin/price-size" className="nav-link group w-full">
                                            <Layers size={20} className='group-hover:!text-primary shrink-0' />
                                            <span className="ltr:pl-3 rtl:pr-3">{t('Product Price & Size')}</span>
                                        </NavLink>
                                    </li>
                                    {canDo('menu', 'manage_presets') && (
                                        <li className="menu nav-item">
                                            <NavLink to="/admin/remark-presets" className="nav-link group w-full">
                                                <Tag size={20} className='group-hover:!text-primary shrink-0' />
                                                <span className="ltr:pl-3 rtl:pr-3">{t('Remark Presets')}</span>
                                            </NavLink>
                                        </li>
                                    )}
                                    {canDo('menu', 'manage_addons') && (
                                        <li className="menu nav-item">
                                            <NavLink to="/admin/product-modifier" className="nav-link group w-full">
                                                <Dessert size={20} className='group-hover:!text-primary shrink-0' />
                                                <span className="ltr:pl-3 rtl:pr-3">{t('Product Add on')}</span>
                                            </NavLink>
                                        </li>
                                    )}
                                    {canDo('menu', 'manage_attributes') && (
                                        <li className="menu nav-item">
                                            <NavLink to="/admin/product-attribute" className="nav-link group w-full">
                                                <Tags size={20} className='group-hover:!text-primary shrink-0' />
                                                <span className="ltr:pl-3 rtl:pr-3">{t('Tags & Sizes')}</span>
                                            </NavLink>
                                        </li>
                                    )}
                                </>
                            )}

                            {/* --- TABLE & QR CONTROL --- */}
                            {(role !== 'super_admin' && canDo('tables', 'manage_tables')) && (
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
                            {(role !== 'super_admin' && (
                                canDo('management', 'view_business_insight') ||
                                canDo('management', 'manage_branches') ||
                                canDo('management', 'manage_staff') ||
                                canDo('management', 'manage_delivery_partners')
                            )) && (
                                    <>
                                        <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px]">
                                            <span>{t('Management')}</span>
                                        </h2>
                                        {canDo('management', 'view_business_insight') && (
                                            <li className="menu nav-item !mt-1">
                                                <NavLink to="/admin/overview" className="nav-link group w-full">
                                                    <LayoutDashboard size={20} className='group-hover:!text-primary shrink-0' />
                                                    <span className="ltr:pl-3 rtl:pr-3">{t('Overview')}</span>
                                                </NavLink>
                                            </li>
                                        )}
                                        {canDo('management', 'manage_branches') && (
                                            <li className="menu nav-item">
                                                <NavLink to="/admin/branches" className="nav-link group w-full">
                                                    <Store size={20} className='group-hover:!text-primary shrink-0' />
                                                    <span className="ltr:pl-3 rtl:pr-3">{t('Branches')}</span>
                                                </NavLink>
                                            </li>
                                        )}
                                        {canDo('management', 'manage_staff') && (
                                            <li className="menu nav-item">
                                                <NavLink to="/admin/staff" className="nav-link group w-full">
                                                    <Users size={20} className='group-hover:!text-primary shrink-0' />
                                                    <span className="ltr:pl-3 rtl:pr-3">{t('Staff Team')}</span>
                                                </NavLink>
                                            </li>
                                        )}
                                        {canDo('management', 'manage_delivery_partners') && (
                                            <li className="menu nav-item">
                                                <NavLink to="/admin/delivery-partners" className="nav-link group w-full">
                                                    <Bike size={20} className='group-hover:!text-primary shrink-0' />
                                                    <span className="ltr:pl-3 rtl:pr-3">{t('Delivery Partners')}</span>
                                                </NavLink>
                                            </li>
                                        )}
                                    </>
                                )}

                            {role !== 'super_admin' && (
                                <>
                                    <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px]">
                                        <span>{t('Settings')}</span>
                                    </h2>

                                    <li className="menu nav-item !mt-1">
                                        <button type="button" className={`${currentMenu === 'component' ? 'active' : ''} nav-link group w-full`} onClick={() => toggleMenu('component')}>
                                            <div className="flex items-center">
                                                <svg className="group-hover:!text-primary shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M14.2788 2.15224C13.9085 2 13.439 2 12.5 2C11.561 2 11.0915 2 10.7212 2.15224C10.2274 2.35523 9.83509 2.74458 9.63056 3.23463C9.53719 3.45834 9.50065 3.7185 9.48635 4.09799C9.46534 4.65568 9.17716 5.17189 8.69017 5.45093C8.20318 5.72996 7.60864 5.71954 7.11149 5.45876C6.77318 5.2813 6.52789 5.18262 6.28599 5.15102C5.75609 5.08178 5.22018 5.22429 4.79616 5.5472C4.47814 5.78938 4.24339 6.1929 3.7739 6.99993C3.30441 7.80697 3.06967 8.21048 3.01735 8.60491C2.94758 9.1308 3.09118 9.66266 3.41655 10.0835C3.56506 10.2756 3.77377 10.437 4.0977 10.639C4.57391 10.936 4.88032 11.4419 4.88029 12C4.88026 12.5581 4.57386 13.0639 4.0977 13.3608C3.77372 13.5629 3.56497 13.7244 3.41645 13.9165C3.09108 14.3373 2.94749 14.8691 3.01725 15.395C3.06957 15.7894 3.30432 16.193 3.7738 17C4.24329 17.807 4.47804 18.2106 4.79606 18.4527C5.22008 18.7756 5.75599 18.9181 6.28589 18.8489C6.52778 18.8173 6.77305 18.7186 7.11133 18.5412C7.60852 18.2804 8.2031 18.27 8.69012 18.549C9.17714 18.8281 9.46533 19.3443 9.48635 19.9021C9.50065 20.2815 9.53719 20.5417 9.63056 20.7654C9.83509 21.2554 10.2274 21.6448 10.7212 21.8478C11.0915 22 11.561 22 12.5 22C13.439 22 13.9085 22 14.2788 21.8478C14.7726 21.6448 15.1649 21.2554 15.3694 20.7654C15.4628 20.5417 15.4994 20.2815 15.5137 19.902C15.5347 19.3443 15.8228 18.8281 16.3098 18.549C16.7968 18.2699 17.3914 18.2804 17.8886 18.5412C18.2269 18.7186 18.4721 18.8172 18.714 18.8488C19.2439 18.9181 19.7798 18.7756 20.2038 18.4527C20.5219 18.2105 20.7566 17.807 21.2261 16.9999C21.6956 16.1929 21.9303 15.7894 21.9827 15.395C22.0524 14.8691 21.9088 14.3372 21.5835 13.9164C21.4349 13.7243 21.2262 13.5628 20.9022 13.3608C20.4261 13.0639 20.1197 12.558 20.1197 11.9999C20.1197 11.4418 20.4261 10.9361 20.9022 10.6392C21.2263 10.4371 21.435 10.2757 21.5836 10.0835C21.9089 9.66273 22.0525 9.13087 21.9828 8.60497C21.9304 8.21055 21.6957 7.80703 21.2262 7C20.7567 6.19297 20.522 5.78945 20.2039 5.54727C19.7799 5.22436 19.244 5.08185 18.7141 5.15109C18.4722 5.18269 18.2269 5.28136 17.8887 5.4588C17.3915 5.71959 16.7969 5.73002 16.3099 5.45096C15.8229 5.17191 15.5347 4.65566 15.5136 4.09794C15.4993 3.71848 15.4628 3.45833 15.3694 3.23463C15.1649 2.74458 14.7726 2.35523 14.2788 2.15224Z" fill="currentColor"/>
                                                    <path d="M15.5227 12C15.5227 13.6569 14.1694 15 12.4999 15C10.8304 15 9.47705 13.6569 9.47705 12C9.47705 10.3431 10.8304 9 12.4999 9C14.1694 9 15.5227 10.3431 15.5227 12Z" fill="currentColor"/>
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
                                                {canDo('management', 'manage_receipt_settings') && (
                                                    <li>
                                                        <NavLink to="/admin/settings/receipt">{t('Receipt Setting')}</NavLink>
                                                    </li>
                                                )}
                                            </ul>
                                        </AnimateHeight>
                                    </li>
                                </>
                            )}

                            <h2 className="py-3 px-7 flex items-center uppercase font-extrabold bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08] -mx-4 mb-1 text-[11px]">
                                <span>{t('System')}</span>
                            </h2>
                            <li className="menu nav-item !mt-1">
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