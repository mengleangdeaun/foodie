import { useState, useEffect } from 'react';
import api from '@/util/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const LandingPageSettings = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Flattened state for easier form handling
    const [settings, setSettings] = useState({
        logo: '',
        show_brand_name: true,

        hero_title: '',
        hero_subtitle: '',
        cta_text: '',
        cta_link: '',
        view_demo_link: '', // Added demo link

        features: '[]',
        about_title: '',
        about_content: '',
        about_image: '', // Added
        pricing_plans: '[]',

        contact_email: '',
        contact_phone: '',
        contact_address: '',

        footer_text: '',

        // JSON stored as objects in state for easy toggling
        section_visibility: {
            hero: true,
            features: true,
            about: true,
            pricing: true,
            cta: true,
            contact: true,
            footer_social: true
        },
        social_links: {
            facebook: '',
            telegram: '', // Changed from twitter
            instagram: ''
        }
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
    const [aboutImagePreview, setAboutImagePreview] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/landing-page');
                const data = res.data;

                // Parse JSON fields
                const visibility = data.section_visibility ? JSON.parse(data.section_visibility) : settings.section_visibility;
                const socials = data.social_links ? JSON.parse(data.social_links) : settings.social_links;
                const brandName = data.show_brand_name === '1' || data.show_brand_name === true || data.show_brand_name === 'true';

                setSettings(prev => ({
                    ...prev,
                    ...data,
                    show_brand_name: brandName,
                    section_visibility: visibility,
                    social_links: socials
                }));

                if (data.logo) {
                    setLogoPreview(data.logo.startsWith('http') ? data.logo : `/storage/${data.logo}`);
                }
                if (data.about_image) {
                    setAboutImagePreview(data.about_image.startsWith('http') ? data.about_image : `/storage/${data.about_image}`);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to load current settings." });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleVisibilityChange = (key: string, checked: boolean) => {
        setSettings(prev => ({
            ...prev,
            section_visibility: { ...prev.section_visibility, [key]: checked }
        }));
    };

    const handleSocialChange = (key: string, value: string) => {
        setSettings(prev => ({
            ...prev,
            social_links: { ...prev.social_links, [key]: value }
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleAboutImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAboutImageFile(file);
            setAboutImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Validations
            try { JSON.parse(settings.features); } catch { throw new Error("Invalid Features JSON"); }
            try { if (settings.pricing_plans) JSON.parse(settings.pricing_plans); } catch { throw new Error("Invalid Pricing JSON"); }

            const formData = new FormData();

            // Prepare payload
            const payload = {
                ...settings,
                show_brand_name: settings.show_brand_name ? '1' : '0',
                section_visibility: JSON.stringify(settings.section_visibility),
                social_links: JSON.stringify(settings.social_links)
            };

            formData.append('settings', JSON.stringify(payload));

            if (logoFile) {
                formData.append('logo', logoFile);
            }
            if (aboutImageFile) {
                formData.append('about_image', aboutImageFile);
            }

            formData.append('_method', 'PUT');

            await api.post('/super-admin/landing-page', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({ title: "Success", description: "Settings updated successfully." });
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save settings." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Landing Page Settings</h1>
                <Button onClick={handleSave} disabled={saving} size="lg">
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="branding">Branding</TabsTrigger>
                    <TabsTrigger value="hero">Hero & Visibility</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="contact">Contact & Social</TabsTrigger>
                </TabsList>

                {/* TAB 1: BRANDING */}
                <TabsContent value="branding" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Logo & Identity</CardTitle>
                            <CardDescription>Manage your site's visual identity.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-6">
                                <div className="border rounded-lg p-2 h-32 w-32 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <span className="text-muted-foreground text-xs">No Logo</span>
                                    )}
                                </div>
                                <div className="space-y-2 flex-1">
                                    <Label>Upload Logo</Label>
                                    <Input type="file" accept="image/*" onChange={handleFileChange} />
                                    <p className="text-xs text-muted-foreground">Recommended size: 200x50px. Max 2MB.</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Show Brand Name</Label>
                                    <p className="text-sm text-muted-foreground">Display text "Foodie" next to the logo.</p>
                                </div>
                                <Switch
                                    checked={settings.show_brand_name}
                                    onCheckedChange={(checked) => handleChange('show_brand_name', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 2: HERO & VISIBILITY */}
                <TabsContent value="hero" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Hero Section</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Hero Title</Label>
                                        <Input value={settings.hero_title} onChange={(e) => handleChange('hero_title', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Hero Subtitle</Label>
                                        <Textarea value={settings.hero_subtitle} onChange={(e) => handleChange('hero_subtitle', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>CTA Text</Label>
                                            <Input value={settings.cta_text} onChange={(e) => handleChange('cta_text', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>CTA Link</Label>
                                            <Input value={settings.cta_link} onChange={(e) => handleChange('cta_link', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>View Demo Link</Label>
                                        <Input value={settings.view_demo_link} onChange={(e) => handleChange('view_demo_link', e.target.value)} placeholder="/auth/cover-login" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Section Visibility</CardTitle>
                                    <CardDescription>Toggle sections on/off.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {Object.entries(settings.section_visibility).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between">
                                            <Label className="capitalize">{key.replace('_', ' ')}</Label>
                                            <Switch
                                                checked={value as boolean}
                                                onCheckedChange={(c) => handleVisibilityChange(key, c)}
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 3: CONTENT */}
                <TabsContent value="content" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>About Us</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={settings.about_title} onChange={(e) => handleChange('about_title', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Content</Label>
                                <Textarea className="h-32" value={settings.about_content} onChange={(e) => handleChange('about_content', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>About Image</Label>
                                <div className="flex items-center gap-6">
                                    <div className="border rounded-lg p-2 h-32 w-32 flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden">
                                        {aboutImagePreview ? (
                                            <img src={aboutImagePreview} alt="About" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-muted-foreground text-xs">No Image</span>
                                        )}
                                    </div>
                                    <Input type="file" accept="image/*" onChange={handleAboutImageChange} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Features (JSON)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea className="font-mono text-xs h-32" value={settings.features} onChange={(e) => handleChange('features', e.target.value)} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing Plans (JSON)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea className="font-mono text-xs h-32" value={settings.pricing_plans} onChange={(e) => handleChange('pricing_plans', e.target.value)} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Footer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>Footer Text</Label>
                                <Input value={settings.footer_text} onChange={(e) => handleChange('footer_text', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB 4: CONTACT & SOCIAL */}
                <TabsContent value="contact" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Contact Email</Label>
                                <Input value={settings.contact_email} onChange={(e) => handleChange('contact_email', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Phone</Label>
                                <Input value={settings.contact_phone} onChange={(e) => handleChange('contact_phone', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input value={settings.contact_address} onChange={(e) => handleChange('contact_address', e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Social Links</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Facebook</Label>
                                <Input value={settings.social_links.facebook} onChange={(e) => handleSocialChange('facebook', e.target.value)} placeholder="https://facebook.com/..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Telegram</Label>
                                <Input value={settings.social_links.telegram} onChange={(e) => handleSocialChange('telegram', e.target.value)} placeholder="https://t.me/..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Instagram</Label>
                                <Input value={settings.social_links.instagram} onChange={(e) => handleSocialChange('instagram', e.target.value)} placeholder="https://instagram.com/..." />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default LandingPageSettings;
