import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import Dropdown from '../../components/Dropdown';
import { IRootState } from '../../store';
import i18next from 'i18next';
import api from '../../util/api';
import { Loader2, Building2, User, Mail, Phone, Lock, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';

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
        setError(''); // Clear error when user starts typing
    };

    const submitForm = async (e: any) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
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
                description: "Your account is pending verification. Please contact support.",
                className: "bg-green-50 text-green-800 border-green-200"
            });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 
                               err.response?.data?.error || 
                               'Registration failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div>
                <div className="absolute inset-0">
                    <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
                </div>
                <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                    <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0e1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,_#0e1726_80%)]">
                        <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50">
                            <div className="mx-auto w-full max-w-[440px] text-center">
                                <div className="mb-8">
                                    <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                    <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl mb-4">Registration Successful!</h1>
                                    <p className="text-lg text-white-dark mb-6">
                                        Thank you for registering <strong className="text-primary">{formData.restaurant_name}</strong>.
                                    </p>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
                                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                                            ⓘ Your account is currently <strong className="underline">Pending Verification</strong>.
                                        </p>
                                        <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                                            Our team will review your application and activate your account shortly. You will receive an email once verified.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Link to="/login" className="btn btn-primary w-full max-w-xs mx-auto block">
                                        Back to Login
                                    </Link>
                                    <Link to="/" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                                        <ArrowLeft className="h-4 w-4" />
                                        Return to Homepage
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <p className="absolute bottom-6 w-full text-center dark:text-white">© {new Date().getFullYear()}. DGS All Rights Reserved.</p>
                    </div>
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
                    <div className="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,rgba(151, 18, 239, 1)_0%,rgba(67,97,238,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]">
                        <div className="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg]">
                            <Link to="/" className="w-48 block lg:w-72 ms-10">
                                <img src="/assets/images/auth/logo-white.svg" alt="Logo" className="w-full" />
                            </Link>
                            <div className="mt-24 hidden w-full max-w-[430px] lg:block">
                                <img src="/assets/images/auth/register.svg" alt="Cover Image" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Create Account</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Register your restaurant to get started</p>
                            </div>

                            {error && <div className="mb-4 text-sm font-bold text-danger bg-danger/10 p-2 rounded border border-danger/20">{error}</div>}

                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="restaurant_name" className="block mb-2">Restaurant Name</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="restaurant_name"
                                            type="text"
                                            placeholder="Enter Restaurant Name"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={formData.restaurant_name}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <Building2 className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="admin_name" className="block mb-2">Admin Name</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="admin_name"
                                            type="text"
                                            placeholder="Enter Your Full Name"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={formData.admin_name}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <User className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block mb-2">Email Address</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="email"
                                            type="email"
                                            placeholder="Enter Email Address"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <Mail className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block mb-2">Phone Number</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="phone"
                                            type="tel"
                                            placeholder="Enter Phone Number"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <Phone className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block mb-2">Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="password"
                                            type="password"
                                            placeholder="Enter Password (min. 8 characters)"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                            minLength={6}
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <Lock className="h-4 w-4" />
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-white-dark">Must be at least 8 characters long</p>
                                </div>
                                <div>
                                    <label htmlFor="confirm_password" className="block mb-2">Confirm Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="confirm_password"
                                            type="password"
                                            placeholder="Confirm Your Password"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            required
                                            minLength={6}
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <Lock className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="btn shadow-none !mt-6 w-full border uppercase"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="animate-spin h-4 w-4" /> Creating Account...
                                            </span>
                                        ) : 'Create Account'}
                                    </Button>
                                </div>
                            </form>
                            <div className="mt-8 text-center">
                                <p className="text-white-dark">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-primary hover:underline font-bold">
                                        Sign In
                                    </Link>
                                </p>
                                <div className="mt-4">
                                    <Link 
                                        to="/" 
                                        className="inline-flex items-center gap-2 text-sm text-white-dark hover:text-primary transition-colors"
                                    >
                                        <ArrowLeft className="h-3 w-3" />
                                        Back to Homepage
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <p className="absolute bottom-6 w-full text-center dark:text-white">© {new Date().getFullYear()}. DGS All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;