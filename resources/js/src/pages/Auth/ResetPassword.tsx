import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '@/util/api';
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t } = useTranslation();
    const { toast } = useToast();

    // Get token and email from URL parameters
    const token = searchParams.get('token') || '';
    const emailParam = searchParams.get('email') || '';

    const [email, setEmail] = useState(emailParam);
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Reset Password'));
        if (emailParam) setEmail(emailParam);
    }, [dispatch, emailParam]);

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (password !== passwordConfirmation) {
            toast({ variant: "destructive", title: "Validation Error", description: "Passwords do not match." });
            setLoading(false);
            return;
        }

        try {
            await api.post('/reset-password', {
                token,
                email,
                password,
                password_confirmation: passwordConfirmation,
            });
            toast({ title: t('Success'), description: "Password has been reset. Please login." });
            navigate('/login');
        } catch (error: any) {
            toast({ variant: "destructive", title: t('Error'), description: error.response?.data?.message || error.response?.data?.email || "Failed to reset password." });
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
                        <div className="mx-auto w-full max-w-[440px]">
                            <div className="mb-10 text-center">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Reset Password</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Enter your new password</p>
                            </div>
                            <form className="space-y-5" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="Email">Email</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Email"
                                            type="email"
                                            className="form-input ps-10 placeholder:text-white-dark bg-gray-100 cursor-not-allowed"
                                            value={email}
                                            readOnly
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 10.5V12C22 16.714 2 16.714 2 12V10.5C2 7.186 2 5.529 3.172 4.545C4.343 3.561 6.314 3.561 10.257 3.561H13.743C17.686 3.561 19.657 3.561 20.828 4.545C22 5.529 22 7.186 22 10.5Z" stroke="currentColor" strokeWidth="1.5" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="Password">New Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Password"
                                            type="password"
                                            placeholder="New Password"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={8}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 10V8C6 4.68629 8.68629 2 12 2C15.3137 2 18 4.68629 18 8V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                <path d="M17 16H7C5.89543 16 5 16.8954 5 18V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V18C19 16.8954 18.1046 16 17 16Z" stroke="currentColor" strokeWidth="1.5" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="PasswordConf">Confirm Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="PasswordConf"
                                            type="password"
                                            placeholder="Confirm Password"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={passwordConfirmation}
                                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                                            required
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M6 10V8C6 4.68629 8.68629 2 12 2C15.3137 2 18 4.68629 18 8V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                <path d="M17 16H7C5.89543 16 5 16.8954 5 18V20C5 21.1046 5.89543 22 7 22H17C18.1046 22 19 21.1046 19 20V18C19 16.8954 18.1046 16 17 16Z" stroke="currentColor" strokeWidth="1.5" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]" disabled={loading}>
                                    {loading ? 'Processing...' : 'RESET PASSWORD'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
