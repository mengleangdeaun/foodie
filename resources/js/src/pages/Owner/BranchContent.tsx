import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/util/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    Save,
    Loader2,
    Shield,
    Info,
    Facebook,
    Send,
    Video,
} from "lucide-react";
import { CustomQuillEditor } from '@/components/custom-quill-editor';
import { Skeleton } from '@/components/ui/skeleton';

interface Branch {
    id: number;
    branch_name: string;
    about_description: string;
    is_about_visible: boolean;
    terms_of_service: string;
    is_tos_visible: boolean;
    privacy_policy: string;
    is_privacy_visible: boolean;
    social_links?: {
        facebook?: string;
        telegram?: string;
        tiktok?: string;
    };
}

interface FormData {
    about_description: string;
    is_about_visible: boolean;
    facebook: string;
    telegram: string;
    tiktok: string;
    terms_of_service: string;
    is_tos_visible: boolean;
    privacy_policy: string;
    is_privacy_visible: boolean;
}

const BranchContent = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [branch, setBranch] = useState<Branch | null>(null);

    const [formData, setFormData] = useState<FormData>({
        about_description: '',
        is_about_visible: false,
        facebook: '',
        telegram: '',
        tiktok: '',
        terms_of_service: '',
        is_tos_visible: false,
        privacy_policy: '',
        is_privacy_visible: false
    });

    useEffect(() => {
        if (id) fetchBranch();
    }, [id]);

    const fetchBranch = async () => {
        try {
            const res = await api.get(`/admin/branches/${id}`);
            const data: Branch = res.data;
            setBranch(data);

            const social = data.social_links || {};

            setFormData({
                about_description: data.about_description || '',
                is_about_visible: Boolean(data.is_about_visible),
                facebook: social.facebook || '',
                telegram: social.telegram || '',
                tiktok: social.tiktok || '',
                terms_of_service: data.terms_of_service || '',
                is_tos_visible: Boolean(data.is_tos_visible),
                privacy_policy: data.privacy_policy || '',
                is_privacy_visible: Boolean(data.is_privacy_visible),
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load branch data'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...branch,
                about_description: formData.about_description,
                is_about_visible: formData.is_about_visible ? 1 : 0,
                terms_of_service: formData.terms_of_service,
                is_tos_visible: formData.is_tos_visible ? 1 : 0,
                privacy_policy: formData.privacy_policy,
                is_privacy_visible: formData.is_privacy_visible ? 1 : 0,
                social_links: {
                    facebook: formData.facebook,
                    telegram: formData.telegram,
                    tiktok: formData.tiktok
                },
            };

            // Remove undefined fields
            Object.keys(payload).forEach(key => {
                if (payload[key as keyof typeof payload] === undefined) {
                    delete payload[key as keyof typeof payload];
                }
            });

            await api.put(`/admin/branches/${id}`, payload);

            toast({
                title: 'Success',
                description: 'Content updated successfully'
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update content'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="ml-auto h-10 w-32" />
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/admin/branches')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
                    <p className="text-muted-foreground">
                        Manage dynamic content for {branch?.branch_name}
                    </p>
                </div>
                <div className="ml-auto">
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="about" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="about" className="gap-2">
                        <Info className="h-4 w-4" /> About & Socials
                    </TabsTrigger>
                    <TabsTrigger value="legal" className="gap-2">
                        <Shield className="h-4 w-4" /> Legal & Support
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="about" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>About Section</CardTitle>
                                    <CardDescription>Restaurant description and social media links</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="is_about_visible" className="cursor-pointer">Visible</Label>
                                    <Switch
                                        id="is_about_visible"
                                        checked={formData.is_about_visible}
                                        onCheckedChange={(checked) => 
                                            setFormData({ ...formData, is_about_visible: checked })
                                        }
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>About Us Description</Label>
                                <CustomQuillEditor
                                    value={formData.about_description}
                                    onChange={(value) => setFormData({ ...formData, about_description: value })}
                                    variant="default"
                                    insideCard={true}
                                    placeholder="Write about your restaurant..."
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-base">Social Media Links</Label>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Facebook className="h-4 w-4 text-blue-600" /> 
                                            Facebook URL
                                        </Label>
                                        <Input
                                            placeholder="https://facebook.com/yourpage"
                                            value={formData.facebook}
                                            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Send className="h-4 w-4 text-sky-500" /> 
                                            Telegram Channel/Group
                                        </Label>
                                        <Input
                                            placeholder="https://t.me/yourchannel"
                                            value={formData.telegram}
                                            onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Video className="h-4 w-4 text-pink-600" /> 
                                            TikTok URL
                                        </Label>
                                        <Input
                                            placeholder="https://tiktok.com/@yourprofile"
                                            value={formData.tiktok}
                                            onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="legal" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Terms of Service</CardTitle>
                                    <CardDescription>Define your service terms and conditions</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="is_tos_visible" className="cursor-pointer">Visible</Label>
                                    <Switch
                                        id="is_tos_visible"
                                        checked={formData.is_tos_visible}
                                        onCheckedChange={(checked) => 
                                            setFormData({ ...formData, is_tos_visible: checked })
                                        }
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CustomQuillEditor
                                value={formData.terms_of_service}
                                onChange={(value) => setFormData({ ...formData, terms_of_service: value })}
                                placeholder="Write your terms of service here..."
                                variant="default"
                                insideCard={true}
                
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Privacy Policy</CardTitle>
                                    <CardDescription>Explain how you handle data</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="is_privacy_visible" className="cursor-pointer">Visible</Label>
                                    <Switch
                                        id="is_privacy_visible"
                                        checked={formData.is_privacy_visible}
                                        onCheckedChange={(checked) => 
                                            setFormData({ ...formData, is_privacy_visible: checked })
                                        }
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CustomQuillEditor
                                value={formData.privacy_policy}
                                onChange={(value) => setFormData({ ...formData, privacy_policy: value })}
                                placeholder="Write your privacy policy here..."
                                variant="default"
                                insideCard={true}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default BranchContent;