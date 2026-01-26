import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useAuth } from '../../context/AuthContext';
import api from '../../util/api';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, User, Mail, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { user, setUser } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Profile Info State
    const [infoData, setInfoData] = useState({
        name: '',
        email: '',
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        dispatch(setPageTitle('Profile Settings'));
        if (user) {
            setInfoData({
                name: user.name || '',
                email: user.email || '',
            });
            // Construct full avatar URL if user has one, handling potential relative/absolute paths
            // Adjust this based on your actual backend response for avatar
            if (user.avatar) {
                // Assuming avatar comes as a filename or partial path
                setAvatarPreview(user.avatar.startsWith('http') ? user.avatar : `/storage/${user.avatar}`);
            }
        }
    }, [dispatch, user]);

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInfoData({ ...infoData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setAvatarPreview(objectUrl);

        // Upload immediately
        const formData = new FormData();
        formData.append('avatar', file);

        setLoading(true);
        try {
            const res = await api.post('/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Update context user
            setUser({ ...user!, avatar: res.data.avatar });
            toast({ title: t('Success'), description: "Profile picture updated successfully." });
        } catch (error: any) {
            toast({ variant: "destructive", title: t('Error'), description: error.response?.data?.message || "Failed to update avatar." });
        } finally {
            setLoading(false);
        }
    };

    const saveInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/profile/info', infoData);
            setUser({ ...user!, ...res.data.user });
            toast({ title: t('Success'), description: "Profile information updated." });
        } catch (error: any) {
            toast({ variant: "destructive", title: t('Error'), description: error.response?.data?.message || "Failed to update info." });
        } finally {
            setLoading(false);
        }
    };

    const savePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.password !== passwordData.password_confirmation) {
            toast({ variant: "destructive", title: "Validation Error", description: "New passwords do not match." });
            return;
        }

        setLoading(true);
        try {
            await api.put('/profile/password', passwordData);
            toast({ title: t('Success'), description: "Password changed successfully." });
            setPasswordData({ current_password: '', password: '', password_confirmation: '' });
        } catch (error: any) {
            toast({ variant: "destructive", title: t('Error'), description: error.response?.data?.message || "Failed to update password." });
        } finally {
            setLoading(false);
        }
    };

    const handleSendResetLink = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            await api.post('/forgot-password', { email: user.email });
            toast({ title: t('Success'), description: `Reset link sent to ${user.email}` });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('Error'),
                description: error.response?.data?.email || error.response?.data?.status || "Failed to send link."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <h1 className="text-2xl font-bold">{t('Profile Settings')}</h1>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left Column: Avatar & Summary */}
                <div className="xl:col-span-1">
                    <Card className="border-none shadow-md">
                        <CardHeader className="items-center pb-2">
                            <div className="relative group cursor-pointer mb-4" onClick={handleAvatarClick}>
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-muted flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="w-8 h-8 text-white" />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <CardTitle>{user?.name}</CardTitle>
                            <CardDescription>{user?.role?.toUpperCase()}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Settings Tabs */}
                <div className="xl:col-span-2">
                    <Tabs defaultValue="account" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="account">Account Info</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                        </TabsList>

                        {/* Account Info Tab */}
                        <TabsContent value="account">
                            <Card className="border-none shadow-md mt-4">
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>Update your personal details here.</CardDescription>
                                </CardHeader>
                                <form onSubmit={saveInfo}>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    value={infoData.name}
                                                    onChange={handleInfoChange}
                                                    className="pl-9"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={infoData.email}
                                                    onChange={handleInfoChange}
                                                    className="pl-9"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="justify-end">
                                        <Button type="submit" disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security">
                            <Card className="border-none shadow-md mt-4">
                                <CardHeader>
                                    <CardTitle>Password</CardTitle>
                                    <CardDescription>Change your password to keep your account secure.</CardDescription>
                                </CardHeader>
                                <form onSubmit={savePassword}>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="current_password">Current Password</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="current_password"
                                                    name="current_password"
                                                    type="password"
                                                    value={passwordData.current_password}
                                                    onChange={handlePasswordChange}
                                                    className="pl-9"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="password">New Password</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="password"
                                                        name="password"
                                                        type="password"
                                                        value={passwordData.password}
                                                        onChange={handlePasswordChange}
                                                        className="pl-9"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        id="password_confirmation"
                                                        name="password_confirmation"
                                                        type="password"
                                                        value={passwordData.password_confirmation}
                                                        onChange={handlePasswordChange}
                                                        className="pl-9"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="justify-end">
                                        <Button type="submit" disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Update Password
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>

                            <Card className="border-none shadow-md mt-4 border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                                            <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Forgot Password?</CardTitle>
                                            <CardDescription>If you're unable to update your password above or prefer to reset it via email.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardFooter>
                                    <Button
                                        variant="outline"
                                        onClick={handleSendResetLink}
                                        disabled={loading}
                                        className="w-full sm:w-auto"
                                    >
                                        Send Password Reset Link
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default Profile;
