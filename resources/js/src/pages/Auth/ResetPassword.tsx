import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IRootState } from '../../store';
import { setPageTitle } from '../../store/themeConfigSlice';
import api from '@/util/api';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Mail, Lock, KeyRound, ArrowLeft, Eye, EyeOff } from 'lucide-react';

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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState(true);

    useEffect(() => {
        dispatch(setPageTitle('Reset Password'));
        if (emailParam) setEmail(emailParam);
        
        // Check if token exists in URL
        if (!token) {
            setIsValidToken(false);
            toast({
                variant: "destructive",
                title: "Invalid Reset Link",
                description: "The password reset link is invalid or has expired."
            });
        }
    }, [dispatch, emailParam, token, toast]);

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!isValidToken) {
            toast({
                variant: "destructive",
                title: "Invalid Link",
                description: "Please request a new password reset link."
            });
            setLoading(false);
            return;
        }

        if (password !== passwordConfirmation) {
            toast({ variant: "destructive", title: "Validation Error", description: "Passwords do not match." });
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            toast({ variant: "destructive", title: "Validation Error", description: "Password must be at least 6 characters long." });
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
            
            toast({
                title: "Success",
                description: "Your password has been reset successfully!",
                className: "bg-green-50 text-green-800 border-green-200"
            });
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 
                           error.response?.data?.email || 
                           "Failed to reset password. The link may have expired.";
            
            toast({
                variant: "destructive",
                title: "Error",
                description: errorMsg
            });
            
            if (error.response?.status === 400 || error.response?.status === 422) {
                setIsValidToken(false);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isValidToken) {
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
                                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                        <KeyRound className="w-12 h-12 text-red-600" />
                                    </div>
                                    <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl mb-4">Invalid Reset Link</h1>
                                    <p className="text-lg text-white-dark mb-6">
                                        This password reset link is invalid or has expired.
                                    </p>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
                                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                                            ⓘ Password reset links are only valid for 24 hours.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Link to="/auth/forgot-password" className="btn btn-primary w-full max-w-xs mx-auto block">
                                        Request New Reset Link
                                    </Link>
                                    <Link to="/login" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Login
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
                                <img src="/assets/images/auth/resetpassword.svg" alt="Cover Image" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">New Password</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Create a new password for your account</p>
                            </div>
                            
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <p className="text-blue-800 dark:text-blue-300 text-sm">
                                    <strong>Reset Link For:</strong> <span className="font-bold text-primary">{email}</span>
                                    <br />
                                    <span className="text-xs mt-1 block">Enter a new password below to complete the reset process.</span>
                                </p>
                            </div>

                            <form className="space-y-5 dark:text-white" onSubmit={submitForm}>
                                <div>
                                    <label htmlFor="Email" className="block mb-2">Email Address</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Email"
                                            type="email"
                                            className="form-input ps-10 placeholder:text-white-dark bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                                            value={email}
                                            readOnly
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <Mail className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label htmlFor="Password" className="block mb-2">New Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter new password (min. 8 characters)"
                                            className="form-input ps-10 pr-10 placeholder:text-white-dark"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={8}
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <Lock className="h-4 w-4" />
                                        </span>
                                        <button
                                            type="button"
                                            className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-xs text-white-dark">Must be at least 8 characters long</p>
                                </div>
                                
                                <div>
                                    <label htmlFor="PasswordConf" className="block mb-2">Confirm New Password</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="PasswordConf"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm new password"
                                            className="form-input ps-10 pr-10 placeholder:text-white-dark"
                                            value={passwordConfirmation}
                                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                                            required
                                            minLength={6}
                                        />
                                        <span className="absolute start-3 top-1/2 -translate-y-1/2">
                                            <Lock className="h-4 w-4" />
                                        </span>
                                        <button
                                            type="button"
                                            className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
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
                                            Resetting Password...
                                        </span>
                                    ) : 'Reset Password'}
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

export default ResetPassword;