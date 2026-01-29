import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { setPageTitle, toggleRTL } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import api from '../../util/api';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        dispatch(setPageTitle('Login'));
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

    const submitForm = async (e: any) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/login', { email, password });
            const { access_token, user } = response.data;

            await login(access_token, remember);

            // Smart Redirection
            if (user.role === 'owner') {
                navigate('/admin/dashboard');
            } else if (['manager', 'staff', 'chef'].includes(user.role)) {
                navigate(user.role === 'chef' ? '/admin/kitchen' : '/admin/dashboard');
            } else {
                navigate('/super-admin/dashboard');
            }
        } catch (err: any) {
            if (err.response && err.response.status === 403) {
                navigate('/auth/account-deactivated');
                return;
            }
            setError(err.response?.data?.message || 'Invalid login');
        } finally {
            setLoading(false);
        }
    };

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
                                <img src="/assets/images/auth/login.svg" alt="Cover Image" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Sign in</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Enter your email and password to login</p>
                            </div>

                            {error && <div className="mb-4 text-sm font-bold text-danger bg-danger/10 p-2 rounded">{error}</div>}

                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="Email">Email</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Email"
                                            type="email"
                                            placeholder="Enter Email"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <Mail className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="Password">Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Password"
                                            type="password"
                                            placeholder="Enter Password"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <Lock className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <label className="cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox"
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                        />
                                        <span className="text-white-dark">Remember me</span>
                                    </label>
                                    <Link to="/auth/forgot-password" className="text-white-dark hover:text-primary transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="btn shadow-none !mt-6 w-full border uppercase"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin h-4 w-4" /> Processing...
                                        </span>
                                    ) : 'Sign in'}
                                </Button>
                                <div className="text-center mt-6">
                                    <p className="text-white-dark">
                                        Don't have an account?{' '}
                                        <Link to="/register" className="text-primary hover:underline font-bold">
                                            Register
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </div>
                        <p className="absolute bottom-6 w-full text-center dark:text-white">© {new Date().getFullYear()}. DGS All Rights Reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;