import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IRootState } from '../../store';
import { setPageTitle, toggleTheme } from '../../store/themeConfigSlice';
import { useEffect } from 'react';
import api from '@/util/api';
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { toast } = useToast();
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Recover Id Boxed'));
    }, [dispatch]);

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/forgot-password', { email });
            toast({ title: t('Success'), description: "Password reset link sent to your email." });
            // Optionally redirect or show a success state
        } catch (error: any) {
            toast({ variant: "destructive", title: t('Error'), description: error.response?.data?.email || "Failed to send reset link." });
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
                <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
                <img src="/assets/images/auth/coming-soon-object2.png" alt="image" className="absolute left-24 top-0 h-40 md:left-[30%]" />
                <img src="/assets/images/auth/coming-soon-object3.png" alt="image" className="absolute right-0 top-0 h-[300px]" />
                <img src="/assets/images/auth/polygon-object.svg" alt="image" className="absolute bottom-0 end-[28%]" />
                <div className="relative w-full max-w-[870px] rounded-md bg-[linear-gradient(45deg,#fff9f9_0%,rgba(255,255,255,0)_25%,rgba(255,255,255,0)_75%,_#fff9f9_100%)] p-2 dark:bg-[linear-gradient(52.22deg,#0e1726_0%,rgba(14,23,38,0)_18.66%,rgba(14,23,38,0)_51.04%,_#0e1726_80%)]">
                    <div className="relative flex flex-col justify-center rounded-md bg-white/60 px-6 py-20 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px]">
                        <div className="absolute top-6 end-6">
                            <div className="dropdown">
                                {/* Language dropdown if needed */}
                            </div>
                        </div>
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10 text-center">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Password Recovery</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Enter your email to recover your ID</p>
                            </div>
                            <form className="space-y-5" onSubmit={submitForm}>
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
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 10.5V12C22 16.714 2 16.714 2 12V10.5C2 7.186 2 5.529 3.172 4.545C4.343 3.561 6.314 3.561 10.257 3.561H13.743C17.686 3.561 19.657 3.561 20.828 4.545C22 5.529 22 7.186 22 10.5Z" stroke="currentColor" strokeWidth="1.5" />
                                                <path opacity="0.5" d="M22 10.5V11.5C22 13.985 2 13.985 2 11.5V10.5C2 7.515 2 6.022 3.172 5.136C4.343 4.25 6.314 4.25 10.257 4.25H13.743C17.686 4.25 19.657 4.25 20.828 5.136C22 6.022 22 7.515 22 10.5Z" fill="currentColor" />
                                                <path d="M6.5 20.5H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]" disabled={loading}>
                                    {loading ? 'Sending...' : 'RECOVER'}
                                </button>
                            </form>
                            <div className="mt-10 text-center dark:text-white">
                                Remembered your password?
                                <Link to="/login" className="font-bold text-primary hover:underline ltr:ml-1 rtl:mr-1">
                                    Sign In
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
