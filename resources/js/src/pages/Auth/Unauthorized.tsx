import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
            <div className="relative mb-10">
                {/* Background pulse effect */}
                <div className="absolute inset-0 bg-red-100 rounded-full scale-150 animate-pulse opacity-50"></div>
                <div className="relative bg-white p-6 rounded-full shadow-xl border border-red-100">
                    <ShieldAlert className="h-16 w-16 text-red-600" />
                </div>
            </div>

            <h1 className="text-4xl font-black text-slate-900 mb-2 italic uppercase tracking-tighter">
                Access Denied
            </h1>
            
            <div className="flex items-center gap-2 mb-6 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                <Lock className="h-4 w-4 text-red-600" />
                <span className="text-red-700 text-sm font-bold uppercase tracking-widest">
                    403 - Forbidden
                </span>
            </div>

            <p className="text-slate-600 max-w-md mb-8 leading-relaxed">
                You do not have the required permissions to access this module. 
                If you believe this is an error, please contact your <span className="font-bold text-slate-900">Branch Manager</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Button 
                    variant="outline" 
                    className="flex-1 h-12 font-bold border-2"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
                
                <Button 
                    className="flex-1 h-12 font-bold bg-slate-900 hover:bg-slate-800"
                    asChild
                >
                    <Link to="/admin/dashboard">
                        <Home className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                </Button>
            </div>

            <div className="mt-12 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                DGS Multi-Tenant Security System
            </div>
        </div>
    );
};

export default Unauthorized;