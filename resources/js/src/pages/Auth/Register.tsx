import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import Dropdown from '../../components/Dropdown';
import { IRootState } from '../../store';
import i18next from 'i18next';
import api from '../../util/api';
import { Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const Register = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        restaurant_name: '',
        admin_name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Register'));
    }, [dispatch]);

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const [flag, setFlag] = useState(themeConfig.locale);

    const setLocale = (flag: string) => {
        setFlag(flag);
        if (flag.toLowerCase() === 'ae') {
            dispatch(toggleRTL('rtl'));
        } else {
            dispatch(toggleRTL('ltr'));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const submitForm = async (e: any) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await api.post('/register-tenant', {
                restaurant_name: formData.restaurant_name,
                admin_name: formData.admin_name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });

            setSuccess(true);
            toast({
                title: "Registration Successful",
                description: "Your account is pending verification. Please contact support."
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <div className="relative w-full max-w-[600px] rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 p-10 text-center shadow-lg">
                    <div className="mb-6 flex justify-center">
                        <img src="/assets/images/auth/logo-white.svg" alt="Logo" className="w-48" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-4">Registration Successful!</h2>
                    <p className="text-lg text-white-dark mb-8">
                        Thank you for registering your restaurant. Your account is currently <strong>Pending Verification</strong>.
                        <br />
                        Our team will review your application and activate your account shortly.
                    </p>
                    <Link to="/login" className="btn btn-primary w-full max-w-xs mx-auto">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
            </div>
            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <div className="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0">
                    <div className="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,rgba(239,18,98,1)_0%,rgba(67,97,238,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]">
                        <div className="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg]">
                            <Link to="/" className="w-48 block lg:w-72 ms-10">
                                <img src="/assets/images/auth/logo-white.svg" alt="Logo" className="w-full" />
                            </Link>
                            <div className="mt-24 hidden w-full max-w-[430px] lg:block">
                                <img src="/assets/images/auth/login.svg" alt="Cover Image" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="flex w-full max-w-[440px] items-center gap-2 lg:absolute lg:end-6 lg:top-6 lg:max-w-full">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="flex items-center gap-2.5 rounded-lg border border-white-dark/30 bg-white px-2 py-1.5 text-white-dark hover:border-primary hover:text-primary dark:bg-black"
                                button={
                                    <>
                                        <div>
                                            <img src={`/assets/images/flags/${flag.toUpperCase()}.svg`} alt="image" className="h-5 w-5 rounded-full object-cover" />
                                        </div>
                                        <div className="text-base font-bold uppercase">{flag}</div>
                                    </>
                                }
                            >
                                <ul className="!px-2 text-dark dark:text-white-dark grid grid-cols-2 gap-2 font-semibold dark:text-white-light/90 w-[280px]">
                                    {themeConfig.languageList.map((item: any) => (
                                        <li key={item.code}>
                                            <button
                                                type="button"
                                                className={`flex w-full hover:text-primary rounded-lg ${flag === item.code ? 'bg-primary/10 text-primary' : ''}`}
                                                onClick={() => {
                                                    i18next.changeLanguage(item.code);
                                                    setLocale(item.code);
                                                }}
                                            >
                                                <img src={`/assets/images/flags/${item.code.toUpperCase()}.svg`} alt="flag" className="w-5 h-5 object-cover rounded-full" />
                                                <span className="ltr:ml-3 rtl:mr-3">{item.name}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </Dropdown>
                        </div>
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Register</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Create your account to get started</p>
                            </div>

                            {error && <div className="mb-4 text-sm font-bold text-danger bg-danger/10 p-2 rounded">{error}</div>}

                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="restaurant_name">Restaurant Name</label>
                                    <input
                                        id="restaurant_name"
                                        type="text"
                                        placeholder="Enter Restaurant Name"
                                        className="form-input"
                                        value={formData.restaurant_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="admin_name">Admin Name</label>
                                    <input
                                        id="admin_name"
                                        type="text"
                                        placeholder="Enter Your Name"
                                        className="form-input"
                                        value={formData.admin_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="Enter Email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        id="phone"
                                        type="text"
                                        placeholder="Enter Phone Number"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password">Password</label>
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="Enter Password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirm_password">Confirm Password</label>
                                    <input
                                        id="confirm_password"
                                        type="password"
                                        placeholder="Confirm Password"
                                        className="form-input"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn shadow-none !mt-6 w-full border uppercase"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-4 w-4" /> Registering...
                                        </span>
                                    ) : 'Register'}
                                </button>
                            </form>
                            <div className="text-center mt-6">
                                <p className="text-white-dark">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-primary hover:underline font-bold">
                                        Sign In
                                    </Link>
                                </p>
                            </div>
                        </div>
                        <p className="absolute bottom-6 w-full text-center dark:text-white">© {new Date().getFullYear()}. Foodie All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
