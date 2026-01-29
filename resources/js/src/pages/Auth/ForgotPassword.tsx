import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '@/util/api';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { toast } = useToast();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch(setPageTitle('Forgot Password'));
    }, [dispatch]);

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/forgot-password', { email });
            toast({ 
                title: t('Success'), 
                description: "Password reset link sent to your email.",
                className: "bg-green-50 text-green-800 border-green-200"
            });
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: t('Error'), 
                description: error.response?.data?.email || "Failed to send reset link." 
            });
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
                                <img src="/assets/images/auth/forgotpassword.svg" alt="Cover Image" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Reset Password</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">
                                    Enter your email address and we'll send you a link to reset your password
                                </p>
                            </div>

                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="Email">Email</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Email"
                                            type="email"
                                            placeholder="Enter your email address"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <Mail className="h-4 w-4" />
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-white-dark">
                                        You will receive a password reset link in your email
                                    </p>
                                </div>
                                
                                <Button
                                    type="submit"
                                    className="btn shadow-none !mt-6 w-full border uppercase"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending Reset Link...
                                        </span>
                                    ) : 'Send Reset Link'}
                                </Button>
                                
                                <div className="pt-4 text-center">
                                    <Link 
                                        to="/login" 
                                        className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Sign In
                                    </Link>
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

export default ForgotPassword;