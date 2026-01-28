import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/util/api';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    Save,
    Loader2,
    FileText,
    Shield,
    Info,
    Facebook,
    Send,
    Video
} from "lucide-react";
import { CustomQuillEditor } from '@/components/custom-quill-editor';


const BranchContent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [branch, setBranch] = useState<any>(null);

    const [formData, setFormData] = useState({
        // About
        about_description: '',
        is_about_visible: false,
        facebook: '',
        telegram: '',
        tiktok: '',

        // Legal
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
            const data = res.data;
            setBranch(data);

            // Parse social links if needed, or default to empty
            const social = data.social_links || {};

            setFormData({
                about_description: data.about_description || '',
                is_about_visible: data.is_about_visible == 1,

                facebook: social.facebook || '',
                telegram: social.telegram || '',
                tiktok: social.tiktok || '',

                terms_of_service: data.terms_of_service || '',
                is_tos_visible: data.is_tos_visible == 1,
                privacy_policy: data.privacy_policy || '',
                is_privacy_visible: data.is_privacy_visible == 1,
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
                // Must include required fields from validation if 'update' endpoint validates all
                // Assuming we use the same 'update' endpoint which might require other fields or we construct a specific payload
                // The Update Branch endpoint usually allows partial updates if we use merge/patch, but our controller validates 'required' fields.
                // We need to fetch the branch and send back ALL required fields OR refactor controller to allow partials.
                // For now, let's assume we're sending a partial update or we need to include everything.
                // Wait, the controller validates 'branch_name', 'is_active' etc as REQUIRED.
                // So we should construct a full payload merging existing branch data with new data.

                ...branch, // Spread existing
                ...formData, // Override with form data

                // Construct social_links array/object
                social_links: {
                    facebook: formData.facebook,
                    telegram: formData.telegram,
                    tiktok: formData.tiktok
                },

                // Ensure booleans are 1/0 for backend validation if it expects in:0,1
                is_about_visible: formData.is_about_visible ? 1 : 0,
                is_tos_visible: formData.is_tos_visible ? 1 : 0,
                is_privacy_visible: formData.is_privacy_visible ? 1 : 0,

                // Fix potentially missing fields or incompatible types from spread
                _method: 'PUT'
            };

            await api.post(`/admin/branches/${id}`, payload);

            toast({
                title: 'Success',
                description: 'Content updated successfully'
            });
            fetchBranch(); // Refetch to sync
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

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

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
                    <TabsTrigger value="about" className="gap-2"><Info className="h-4 w-4" /> About & Socials</TabsTrigger>
                    <TabsTrigger value="legal" className="gap-2"><Shield className="h-4 w-4" /> Legal & Support</TabsTrigger>
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
                                    <Label className='mb-0' htmlFor="is_about_visible">Visible</Label>
                                    <Switch
                                        id="is_about_visible"
                                        checked={formData.is_about_visible}
                                        onCheckedChange={(c) => setFormData({ ...formData, is_about_visible: c })}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>About Us Description</Label>
                                <div className="prose-sm max-w-none">
                                    <CustomQuillEditor
                                        value={formData.about_description}
                                        onChange={(value) => setFormData({ ...formData, about_description: value })}
                                        variant="seamless"
                                        minHeight={200}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-base">Social Media Links</Label>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><Facebook className="h-4 w-4 text-blue-600" /> Facebook URL</Label>
                                        <Input
                                            placeholder="https://facebook.com/yourpage"
                                            value={formData.facebook}
                                            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><Send className="h-4 w-4 text-sky-500" /> Telegram Channel/Group</Label>
                                        <Input
                                            placeholder="https://t.me/yourchannel"
                                            value={formData.telegram}
                                            onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2"><Video className="h-4 w-4 text-pink-600" /> TikTok URL</Label>
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
                                    <Label className="mb-0" htmlFor="is_tos_visible">Visible</Label>
                                    <Switch
                                        id="is_tos_visible"
                                        checked={formData.is_tos_visible}
                                        onCheckedChange={(c) => setFormData({ ...formData, is_tos_visible: c })}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CustomQuillEditor
                                value={formData.terms_of_service}
                                onChange={(value) => setFormData({ ...formData, terms_of_service: value })}
                                placeholder="Write your terms of service here..."
                                variant="seamless"
                                insideCard={true}
                                minHeight={200}
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
                                    <Label className='mb-0' htmlFor="is_privacy_visible">Visible</Label>
                                    <Switch
                                        id="is_privacy_visible"
                                        checked={formData.is_privacy_visible}
                                        onCheckedChange={(c) => setFormData({ ...formData, is_privacy_visible: c })}
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
                                minHeight={200}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default BranchContent;
