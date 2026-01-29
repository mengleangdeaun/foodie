import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useAuth } from '../../context/AuthContext';
import api from '../../util/api';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, User, Mail, Lock, Save, Shield, Key, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const Profile = () => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { user, setUser } = useAuth();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState({
        info: false,
        password: false,
        avatar: false,
        reset: false
    });
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
        dispatch(setPageTitle(t('Profile Settings')));
        if (user) {
            setInfoData({
                name: user.name || '',
                email: user.email || '',
            });

            // Handle avatar URL construction
            if (user.avatar) {
                const avatarUrl = user.avatar.startsWith('http')
                    ? user.avatar
                    : `${import.meta.env.VITE_API_BASE_URL || ''}/storage/${user.avatar}`;
                setAvatarPreview(avatarUrl);
            }
        }
    }, [dispatch, user, t]);

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

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            toast({
                variant: "destructive",
                title: t('Invalid File'),
                description: "Please select an image file."
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                variant: "destructive",
                title: t('File Too Large'),
                description: "Image size should be less than 5MB."
            });
            return;
        }

        // Preview
        const objectUrl = URL.createObjectURL(file);
        setAvatarPreview(objectUrl);

        // Upload
        const formData = new FormData();
        formData.append('avatar', file);

        setLoading(prev => ({ ...prev, avatar: true }));
        try {
            const res = await api.post('/profile/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Update context user
            setUser({ ...user!, avatar: res.data.avatar });

            // Revoke object URL to prevent memory leaks
            if (objectUrl) URL.revokeObjectURL(objectUrl);

            toast({
                title: t('Success'),
                description: t('Profile picture updated successfully.'),
                className: "bg-success text-success-foreground border-success"
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('Error'),
                description: error.response?.data?.message || t("Failed to update avatar.")
            });
        } finally {
            setLoading(prev => ({ ...prev, avatar: false }));
            // Clean up file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const saveInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(prev => ({ ...prev, info: true }));
        try {
            const res = await api.put('/profile/info', infoData);
            setUser({ ...user!, ...res.data.user });
            toast({
                title: t('Success'),
                description: t("Profile information updated."),
                className: "bg-success text-success-foreground border-success"
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('Error'),
                description: error.response?.data?.message || t("Failed to update info.")
            });
        } finally {
            setLoading(prev => ({ ...prev, info: false }));
        }
    };

    const savePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (passwordData.password.length < 8) {
            toast({
                variant: "destructive",
                title: t('Validation Error'),
                description: t("Password must be at least 8 characters long.")
            });
            return;
        }

        if (passwordData.password !== passwordData.password_confirmation) {
            toast({
                variant: "destructive",
                title: t('Validation Error'),
                description: t("New passwords do not match.")
            });
            return;
        }

        setLoading(prev => ({ ...prev, password: true }));
        try {
            await api.put('/profile/password', passwordData);
            toast({
                title: t('Success'),
                description: t("Password changed successfully."),
                className: "bg-success text-success-foreground border-success"
            });
            setPasswordData({ current_password: '', password: '', password_confirmation: '' });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('Error'),
                description: error.response?.data?.message || t("Failed to update password.")
            });
        } finally {
            setLoading(prev => ({ ...prev, password: false }));
        }
    };

    const handleSendResetLink = async () => {
        if (!user?.email) return;
        setLoading(prev => ({ ...prev, reset: true }));
        try {
            await api.post('/forgot-password', { email: user.email });
            toast({
                title: t('Success'),
                description: t('Reset link sent to ') + user.email,
                className: "bg-success text-success-foreground border-success"
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t('Error'),
                description: error.response?.data?.email || error.response?.data?.status || t("Failed to send link.")
            });
        } finally {
            setLoading(prev => ({ ...prev, reset: false }));
        }
    };

    const getUserInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('Profile Settings')}</h1>
                    <p className="text-muted-foreground">
                        {t('Manage your account settings and preferences')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Profile Summary */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="overflow-hidden border-border">
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 dark:from-primary/20 dark:to-primary/10">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative group mb-4">
                                    <Avatar
                                        className="h-32 w-32 border-4 border-background shadow-lg cursor-pointer"
                                        onClick={handleAvatarClick}
                                    >
                                        <AvatarImage
                                            src={avatarPreview || undefined}
                                            alt={user?.name}
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="text-2xl bg-primary/10">
                                            {user?.name ? getUserInitials(user.name) : <User className="h-12 w-12" />}
                                        </AvatarFallback>
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                            <Camera className="h-8 w-8 text-white" />
                                            <span className="sr-only">{t('Change avatar')}</span>
                                        </div>
                                    </Avatar>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={loading.avatar}
                                    />
                                    {loading.avatar && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold">{user?.name || <Skeleton className="h-8 w-40" />}</h2>
                                    <div className="flex items-center justify-center gap-2">
                                        <Badge variant="secondary" className="font-medium">
                                            {user?.role ? user.role.toUpperCase() : <Skeleton className="h-5 w-16" />}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground flex items-center justify-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {user?.email || <Skeleton className="h-5 w-48" />}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Account Created</p>
                                        <p className="font-medium">
                                            {user?.created_at
                                                ? new Date(user.created_at).toLocaleDateString()
                                                : <Skeleton className="h-5 w-24" />
                                            }
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">Last Updated</p>
                                        <p className="font-medium">
                                            {user?.updated_at
                                                ? new Date(user.updated_at).toLocaleDateString()
                                                : <Skeleton className="h-5 w-24" />
                                            }
                                        </p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <p className="text-sm text-muted-foreground">Account Status</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="font-medium text-green-600 dark:text-green-400">Active</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    {/* <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <UserCircle className="h-5 w-5" />
                                Account Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-primary">0</p>
                                    <p className="text-sm text-muted-foreground">Sessions</p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-primary">0</p>
                                    <p className="text-sm text-muted-foreground">Devices</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card> */}
                </div>

                {/* Right Column: Settings */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="account" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="account" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Account
                            </TabsTrigger>
                            <TabsTrigger value="security" className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Security
                            </TabsTrigger>
                        </TabsList>

                        {/* Account Tab */}
                        <TabsContent value="account" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Information</CardTitle>
                                    <CardDescription>
                                        Update your personal details and contact information
                                    </CardDescription>
                                </CardHeader>
                                <form onSubmit={saveInfo}>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    Full Name
                                                </Label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    value={infoData.name}
                                                    onChange={handleInfoChange}
                                                    placeholder="Enter your full name"
                                                    className="bg-background"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    Email Address
                                                </Label>
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    value={infoData.email}
                                                    onChange={handleInfoChange}
                                                    placeholder="Enter your email address"
                                                    className="bg-background"
                                                    required
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Your email address is used for account notifications and password resets
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between border-t px-6 py-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Changes will be reflected across all devices
                                            </p>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={loading.info}
                                            className="min-w-32"
                                        >
                                            {loading.info ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security" className="space-y-4 mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Change Password</CardTitle>
                                    <CardDescription>
                                        Update your password to keep your account secure
                                    </CardDescription>
                                </CardHeader>
                                <form onSubmit={savePassword}>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="current_password" className="flex items-center gap-2">
                                                    <Key className="h-4 w-4" />
                                                    Current Password
                                                </Label>
                                                <Input
                                                    id="current_password"
                                                    name="current_password"
                                                    type="password"
                                                    value={passwordData.current_password}
                                                    onChange={handlePasswordChange}
                                                    placeholder="Enter current password"
                                                    className="bg-background"
                                                    required
                                                />
                                            </div>
                                            <Separator />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="password">New Password</Label>
                                                    <Input
                                                        id="password"
                                                        name="password"
                                                        type="password"
                                                        value={passwordData.password}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Enter new password"
                                                        className="bg-background"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                                                    <Input
                                                        id="password_confirmation"
                                                        name="password_confirmation"
                                                        type="password"
                                                        value={passwordData.password_confirmation}
                                                        onChange={handlePasswordChange}
                                                        placeholder="Confirm new password"
                                                        className="bg-background"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-sm text-muted-foreground space-y-1">
                                                <p>Password requirements:</p>
                                                <ul className="list-disc list-inside space-y-1">
                                                    <li>Minimum 8 characters</li>
                                                    <li>Include uppercase and lowercase letters</li>
                                                    <li>Include at least one number</li>
                                                    <li>Include special characters for better security</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-between border-t px-6 py-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Use a strong, unique password
                                            </p>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={loading.password}
                                            className="min-w-32"
                                        >
                                            {loading.password ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    Update Password
                                                </>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>

                            {/* Password Reset Section */}
                            <Alert variant="warning" className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                                        <Lock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                                    </div>
                                    <div className="flex-1">
                                        <AlertTitle className="text-yellow-800 dark:text-yellow-400">
                                            Need help with your password?
                                        </AlertTitle>
                                        <AlertDescription className="text-yellow-700 dark:text-yellow-300 mt-2">
                                            If you're unable to update your password above, we can send a reset link to your registered email address.
                                        </AlertDescription>
                                        <div className="mt-4">
                                            <Button
                                                variant="outline"
                                                onClick={handleSendResetLink}
                                                disabled={loading.reset}
                                                className="border-yellow-500 text-yellow-700 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
                                            >
                                                {loading.reset ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        Send Reset Link
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Alert>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default Profile;