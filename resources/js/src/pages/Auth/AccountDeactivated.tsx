import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { UserX, ArrowLeft, Home, Mail } from "lucide-react";

const AccountDeactivated = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
            <div className="relative mb-10">
                {/* Background pulse effect */}
                <div className="absolute inset-0 bg-yellow-100 rounded-full scale-150 animate-pulse opacity-50"></div>
                <div className="relative bg-white p-6 rounded-full shadow-xl border border-yellow-100">
                    <UserX className="h-16 w-16 text-yellow-600" />
                </div>
            </div>

            <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
                Account Inactive
            </h1>

            <div className="flex items-center gap-2 mb-6 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-100">
                <span className="text-yellow-700 text-sm font-bold uppercase tracking-widest">
                    Pending Verification or Suspended
                </span>
            </div>

            <p className="text-slate-600 max-w-md mb-8 leading-relaxed">
                Your account is currently inactive. This could be because your registration is pending approval or your account has been suspended.
                Please contact support or your administrator for assistance.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Button
                    variant="outline"
                    className="flex-1 h-12 font-bold border-2"
                    asChild
                >
                    <Link to="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                    </Link>
                </Button>

                <Button
                    variant="default"
                    className="flex-1 h-12 font-bold"
                    asChild
                >
                    <a href="mailto:support@foodie.com">
                        <Mail className="mr-2 h-4 w-4" /> Contact Support
                    </a>
                </Button>
            </div>

            <div className="mt-12 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                Foodie Multi-Tenant System
            </div>
        </div>
    );
};

export default AccountDeactivated;
