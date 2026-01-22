// resources/js/src/components/BranchSelector.tsx
import { useState, useEffect, useRef } from 'react';
import api from '@/util/api';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BranchSelector = () => {
    const { user, setUser } = useAuth(); 
    const { toast } = useToast();
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const hasFetched = useRef(false); //

    useEffect(() => {
        if (!hasFetched.current) {
            hasFetched.current = true;
            fetchBranches();
        }
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await api.get('/admin/branches');
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setBranches(data);
        } catch (error) {
            console.error("Failed to load branches");
        }
    };

    const handleBranchSwitch = async (branchId: string) => {
        setLoading(true);
        try {
            const res = await api.post('/user/switch-branch', { branch_id: branchId });
            if (user) {
                setUser({ ...user, branch_id: parseInt(branchId) });
            }
            toast({ title: "Branch Switched" });
            setTimeout(() => window.location.reload(), 300); 
        } catch (error) {
            toast({ variant: "destructive", title: "Switch Failed" });
        } finally {
            setLoading(false);
        }
    };

    if (branches.length === 0) return null;

    return (
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border">
            <div className="bg-white p-2 rounded-md shadow-sm">
                <Store size={16} className="text-primary" />
            </div>
            <Select value={user?.branch_id?.toString()} onValueChange={handleBranchSwitch} disabled={loading}>
                <SelectTrigger className="w-[200px] border-none bg-transparent focus:ring-0 font-bold uppercase tracking-tighter">
                    {loading ? <RefreshCw className="animate-spin h-4 w-4" /> : <SelectValue placeholder="Select Branch" />}
                </SelectTrigger>
                <SelectContent>
                    {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id.toString()} className="font-bold uppercase">
                            {/* FIX: Must use 'branch_name' to match your SQL */}
                            {branch.branch_name} 
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default BranchSelector;