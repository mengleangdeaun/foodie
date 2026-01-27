import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import api from '@/util/api';
import { Restaurant } from './RestaurantList';
import { useToast } from "@/hooks/use-toast";

interface EditTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurant: Restaurant | null;
    onSuccess: (updatedRestaurant: Restaurant) => void;
}

const EditTenantModal = ({ isOpen, onClose, restaurant, onSuccess }: EditTenantModalProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        restaurant_name: '',
        admin_name: '',
        email: '',
        password: '',
        is_active: false,
    });

    useEffect(() => {
        if (isOpen && restaurant) {
            setFormData({
                restaurant_name: restaurant.name,
                admin_name: restaurant.admin_name || '',
                email: restaurant.email || '',
                password: '',
                is_active: Boolean(restaurant.is_active),
            });
        }
    }, [isOpen, restaurant]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!restaurant) return;
        setLoading(true);
        try {
            const response = await api.put(`/super-admin/tenants/${restaurant.id}`, formData);
            toast({ title: "Success", description: "Tenant updated successfully." });
            onSuccess(response.data.owner);
            onClose();
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to update tenant." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Tenant</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="restaurant_name">Restaurant Name</Label>
                        <Input id="restaurant_name" value={formData.restaurant_name} onChange={handleChange} required />
                    </div>
                    <div>
                        <Label htmlFor="admin_name">Admin Name</Label>
                        <Input id="admin_name" value={formData.admin_name} onChange={handleChange} required placeholder="Update admin name" />
                    </div>
                    <div>
                        <Label htmlFor="email">Admin Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} required placeholder="Update email" />
                    </div>
                    <div>
                        <Label htmlFor="password">New Password (Optional)</Label>
                        <Input id="password" type="password" value={formData.password} onChange={handleChange} placeholder="Leave blank to keep current" />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label htmlFor="is_active">Active Status</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditTenantModal;
