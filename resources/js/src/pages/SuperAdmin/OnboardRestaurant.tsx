import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/util/api'; // Using your alias
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react"; // Optional: for loading spinner

const OnboardRestaurant = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<any>(null);
    const [formData, setFormData] = useState({
        restaurant_name: '',
        admin_name: '',
        email: '',
        password: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors(null);

        try {
            await api.post('/super-admin/onboard-restaurant', formData);
            // Optional: Use a Toast here instead of alert
            alert('Restaurant Created Successfully!');
            navigate('/super-admin/dashboard'); 
        } catch (error: any) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({ general: ['An unexpected error occurred. Please try again.'] });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center p-6">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Onboard New Restaurant</CardTitle>
                    <CardDescription>
                        Register a new tenant and create their administrative account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* General Error Alert */}
                        {errors?.general && (
                            <Alert variant="destructive">
                                <AlertDescription>{errors.general[0]}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="restaurant_name">Restaurant Name</Label>
                            <Input 
                                id="restaurant_name" 
                                placeholder="Lotus Garden" 
                                value={formData.restaurant_name}
                                onChange={(e) => setFormData({...formData, restaurant_name: e.target.value})}
                                className={errors?.restaurant_name ? "border-destructive" : ""}
                            />
                            {errors?.restaurant_name && <p className="text-xs text-destructive">{errors.restaurant_name[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="admin_name">Owner Full Name</Label>
                            <Input 
                                id="admin_name" 
                                placeholder="John Doe" 
                                value={formData.admin_name}
                                onChange={(e) => setFormData({...formData, admin_name: e.target.value})}
                                className={errors?.admin_name ? "border-destructive" : ""}
                            />
                            {errors?.admin_name && <p className="text-xs text-destructive">{errors.admin_name[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Admin Email</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="owner@example.com" 
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className={errors?.email ? "border-destructive" : ""}
                            />
                            {errors?.email && <p className="text-xs text-destructive">{errors.email[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input 
                                id="password" 
                                type="password" 
                                placeholder="••••••••" 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                className={errors?.password ? "border-destructive" : ""}
                            />
                            {errors?.password && <p className="text-xs text-destructive">{errors.password[0]}</p>}
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Creating..." : "Create Restaurant Account"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default OnboardRestaurant;