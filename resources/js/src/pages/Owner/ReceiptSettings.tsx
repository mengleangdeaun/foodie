import React, { useState, useEffect, useRef } from 'react';
import {
    Printer,
    Save,
    Upload,
    Type,
    Palette,
    Maximize,
    Loader2,
    QrCode,
    ImageIcon,
    Download,
    Eye,
    Settings,
    PaintBucket,
    Layout,
    Smartphone,
    Tablet,
    Monitor
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useReactToPrint } from 'react-to-print';
import { ThermalReceipt } from '@/components/printing/ThermalReceipt';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/hooks/use-toast";
import api from '@/util/api';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ReceiptSettings = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
    const [brandingPresets, setBrandingPresets] = useState<any>({
        colors: [],
        fonts: [],
        store_name: ''
    });

    const [settings, setSettings] = useState({
        store_name: '',
        header_text: '',
        footer_text: '',
        primary_color: '#000000',
        font_size_base: 14,
        font_family: '',
        logo_size: 80,
        qr_code_size: 90,
        show_logo: true,
        show_qr: true,
        show_header: true,
        show_footer: true,
        show_border: false,
        show_customer_info: false,
        paper_width: 80,
        margin_size: 10,
        logo_url: null as string | null,
        qr_code_url: null as string | null,
        logo_file: null as File | null,
        qr_code_file: null as File | null
    });

    const componentRef = useRef<HTMLDivElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const qrInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings/receipt');
            if (res.data.settings) setSettings(res.data.settings);
            if (res.data.branding_presets) setBrandingPresets(res.data.branding_presets);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load receipt settings"
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({ contentRef: componentRef });

    const handleSave = async () => {
        setSaving(true);
        const formData = new FormData();

        Object.entries(settings).forEach(([key, value]) => {
            if (!key.includes('_url') && !key.endsWith('_file')) {
                let val = value;
                if (typeof value === 'boolean') val = value ? '1' : '0';
                formData.append(key, val === null ? '' : String(val));
            }
        });

        if (settings.logo_file) {
            formData.append('logo', settings.logo_file);
        }
        if (settings.qr_code_file) {
            formData.append('qr_code', settings.qr_code_file);
        }

        try {
            const res = await api.post('/admin/settings/receipt', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast({
                title: "Success",
                description: "Receipt settings saved successfully"
            });
            setSettings(res.data.settings);
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Could not save settings"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = (type: 'logo' | 'qr', file: File) => {
        const url = URL.createObjectURL(file);
        if (type === 'logo') {
            setSettings({
                ...settings,
                logo_file: file,
                logo_url: url
            });
        } else {
            setSettings({
                ...settings,
                qr_code_file: file,
                qr_code_url: url
            });
        }
    };

    const getDeviceDimensions = () => {
        switch (previewDevice) {
            case 'mobile': return {
                width: '320px',
                height: '860px',
                scale: 0.8
            };
            case 'tablet': return {
                width: '512px',
                height: '783px',
                scale: 0.7
            };
            case 'desktop': return {
                width: '720px',
                height: '680px',
                scale: 0.8
            };
            default: return {
                width: '280px',
                height: '560px',
                scale: 0.8
            };
        }
    };

    if (loading) return (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
            <p className="text-muted-foreground">Loading receipt settings...</p>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Printer className="h-8 w-8 text-primary" />
                        Receipt Designer
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Customize receipt appearance for {brandingPresets.store_name || 'your store'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => handlePrint()}
                        className="gap-2"
                    >
                        <Printer className="h-4 w-4" />
                        Test Print
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="gap-2 px-6"
                    >
                        {saving ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column - Settings (70%) */}
                <div className="lg:col-span-8 space-y-6">
                    <Tabs defaultValue="branding" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="branding" className="gap-2">
                                <PaintBucket className="h-3 w-3" />
                                Branding
                            </TabsTrigger>
                            <TabsTrigger value="layout" className="gap-2">
                                <Layout className="h-3 w-3" />
                                Layout
                            </TabsTrigger>
                            <TabsTrigger value="content" className="gap-2">
                                <Type className="h-3 w-3" />
                                Content
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="branding" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Palette className="h-4 w-4" />
                                        Color & Typography
                                    </CardTitle>
                                    <CardDescription>
                                        Match your receipt with your brand identity
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-base">Primary Color</Label>
                                            <Badge variant="outline" className="text-xs">
                                                Branch Colors Available
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                                            <Input
                                                type="color"
                                                value={settings.primary_color}
                                                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                                className="w-16 h-16 p-1 cursor-pointer rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <Label className="text-sm text-muted-foreground mb-2 block">
                                                    Color Value
                                                </Label>
                                                <Input
                                                    value={settings.primary_color}
                                                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                                    className="font-mono"
                                                />
                                            </div>
                                        </div>

                                        {/* Brand Color Presets */}
                                        {brandingPresets.colors.length > 0 && (
                                            <div className="space-y-3">
                                                <Label className="text-sm">Quick Select - Brand Colors</Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {brandingPresets.colors.map((color: string, index: number) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setSettings({ ...settings, primary_color: color })}
                                                            className={`relative w-10 h-10 rounded-full border-2 transition-all hover:scale-110 hover:shadow-md ${settings.primary_color === color
                                                                ? 'border-primary ring-2 ring-primary/20'
                                                                : 'border-muted'
                                                                }`}
                                                            style={{ backgroundColor: color }}
                                                            title={`Brand Color ${index + 1}`}
                                                        >
                                                            {settings.primary_color === color && (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <div className="w-4 h-4 bg-white rounded-full" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <Separator />

                                        <div className="space-y-4">
                                            <Label className="text-base">Typography</Label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-3">
                                                    <Label>Font Family</Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['font-mono', 'font-sans', 'font-serif','font-roboto', ...brandingPresets.fonts].map((font) => (
                                                            <Button
                                                                key={font}
                                                                variant={settings.font_family === font ? "default" : "outline"}
                                                                size="sm"
                                                                className={`text-xs ${font} transition-all`}
                                                                onClick={() => setSettings({ ...settings, font_family: font })}
                                                            >
                                                                {font.replace('font-', '').replace(/([A-Z])/g, ' $1').trim()}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <Label>Base Font Size: {settings.font_size_base}px</Label>
                                                    <Slider
                                                        value={[settings.font_size_base]}
                                                        min={10}
                                                        max={20}
                                                        step={1}
                                                        onValueChange={([v]) => setSettings({ ...settings, font_size_base: v })}
                                                    />
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>Small</span>
                                                        <span>Medium</span>
                                                        <span>Large</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Images & Assets
                                    </CardTitle>
                                    <CardDescription>
                                        Upload and customize logos and QR codes
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Logo Settings */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label>Logo</Label>
                                                <Switch
                                                    checked={settings.show_logo}
                                                    onCheckedChange={(checked) => setSettings({ ...settings, show_logo: checked })}
                                                />
                                            </div>
                                            <div
                                                onClick={() => logoInputRef.current?.click()}
                                                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors min-h-[180px]"
                                            >
                                                {settings.logo_url ? (
                                                    <>
                                                        <img
                                                            src={settings.logo_url}
                                                            alt="Logo preview"
                                                            className="max-h-24 object-contain mb-4"
                                                        />
                                                        <p className="text-sm text-muted-foreground">Click to change</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                                                        <p className="text-sm font-medium">Upload Logo</p>
                                                        <p className="text-xs text-muted-foreground mt-1 text-center">
                                                            PNG, JPG up to 5MB
                                                        </p>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    ref={logoInputRef}
                                                    hidden
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload('logo', file);
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Logo Size: {settings.logo_size}px</Label>
                                                <Slider
                                                    value={[settings.logo_size]}
                                                    min={40}
                                                    max={180}
                                                    step={10}
                                                    onValueChange={([v]) => setSettings({ ...settings, logo_size: v })}
                                                    disabled={!settings.show_logo}
                                                />
                                            </div>
                                        </div>

                                        {/* QR Code Settings */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label>QR Code</Label>
                                                <Switch
                                                    checked={settings.show_qr}
                                                    onCheckedChange={(checked) => setSettings({ ...settings, show_qr: checked })}
                                                />
                                            </div>
                                            <div
                                                onClick={() => qrInputRef.current?.click()}
                                                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors min-h-[180px]"
                                            >
                                                {settings.qr_code_url ? (
                                                    <>
                                                        <img
                                                            src={settings.qr_code_url}
                                                            alt="QR code preview"
                                                            className="max-h-24 object-contain mb-4"
                                                        />
                                                        <p className="text-sm text-muted-foreground">Click to change</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <QrCode className="h-12 w-12 text-muted-foreground mb-3" />
                                                        <p className="text-sm font-medium">Upload QR Code</p>
                                                        <p className="text-xs text-muted-foreground mt-1 text-center">
                                                            PNG, JPG up to 5MB
                                                        </p>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    ref={qrInputRef}
                                                    hidden
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload('qr', file);
                                                    }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>QR Code Size: {settings.qr_code_size}px</Label>
                                                <Slider
                                                    value={[settings.qr_code_size]}
                                                    min={40}
                                                    max={180}
                                                    step={10}
                                                    onValueChange={([v]) => setSettings({ ...settings, qr_code_size: v })}
                                                    disabled={!settings.show_qr}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="layout" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Layout Settings
                                    </CardTitle>
                                    <CardDescription>
                                        Configure receipt dimensions and structure
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <Label>Paper Width: {settings.paper_width}mm</Label>
                                            <Slider
                                                value={[settings.paper_width]}
                                                min={58}
                                                max={110}
                                                step={1}
                                                onValueChange={([v]) => setSettings({ ...settings, paper_width: v })}
                                            />
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>58mm (Standard)</span>
                                                <span>80mm (Wide)</span>
                                                <span>110mm (Extra Wide)</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label>Margin Size: {settings.margin_size}px</Label>
                                            <Slider
                                                value={[settings.margin_size]}
                                                min={5}
                                                max={30}
                                                step={1}
                                                onValueChange={([v]) => setSettings({ ...settings, margin_size: v })}
                                            />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="space-y-4">
                                        <Label className="text-base">Visibility Options</Label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                                <div className="space-y-0.5">
                                                    <Label>Show Header</Label>
                                                    <p className="text-xs text-muted-foreground">Store name & info</p>
                                                </div>
                                                <Switch
                                                    checked={settings.show_header}
                                                    onCheckedChange={(checked) => setSettings({ ...settings, show_header: checked })}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                                <div className="space-y-0.5">
                                                    <Label>Show Footer</Label>
                                                    <p className="text-xs text-muted-foreground">Thank you message</p>
                                                </div>
                                                <Switch
                                                    checked={settings.show_footer}
                                                    onCheckedChange={(checked) => setSettings({ ...settings, show_footer: checked })}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                                <div className="space-y-0.5">
                                                    <Label>Show Border</Label>
                                                    <p className="text-xs text-muted-foreground">Receipt border</p>
                                                </div>
                                                <Switch
                                                    checked={settings.show_border}
                                                    onCheckedChange={(checked) => setSettings({ ...settings, show_border: checked })}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                                <div className="space-y-0.5">
                                                    <Label>Show Table/Delivery Info</Label>
                                                    <p className="text-xs text-muted-foreground">Table Number and Delivery Info</p>
                                                </div>
                                                <Switch
                                                    checked={settings.show_customer_info}
                                                    onCheckedChange={(checked) => setSettings({ ...settings, show_customer_info: checked })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="content" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Type className="h-4 w-4" />
                                        Text Content
                                    </CardTitle>
                                    <CardDescription>
                                        Customize header and footer text
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Store Name</Label>
                                            <Input
                                                value={settings.store_name}
                                                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                                                placeholder="Enter store name"
                                                className="mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label>Header Text</Label>
                                            <Input
                                                value={settings.header_text}
                                                onChange={(e) => setSettings({ ...settings, header_text: e.target.value })}
                                                placeholder="Welcome to our store!"
                                                className="mt-2"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Appears at the top of the receipt
                                            </p>
                                        </div>
                                        <div>
                                            <Label>Footer Text</Label>
                                            <Input
                                                value={settings.footer_text}
                                                onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                                                placeholder="Thank you for your purchase!"
                                                className="mt-2"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Appears at the bottom of the receipt
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column - Preview (30%) */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Live Preview
                            </CardTitle>
                            <CardDescription>
                                See how your receipt will appear
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Device Toggle */}
                            <div className="flex justify-center gap-2">
                                <Button
                                    variant={previewDevice === "mobile" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPreviewDevice("mobile")}
                                    className="gap-2"
                                >
                                    <Smartphone className="h-3 w-3" />
                                    Mobile
                                </Button>
                                <Button
                                    variant={previewDevice === "tablet" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPreviewDevice("tablet")}
                                    className="gap-2"
                                >
                                    <Tablet className="h-3 w-3" />
                                    Tablet
                                </Button>
                                <Button
                                    variant={previewDevice === "desktop" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setPreviewDevice("desktop")}
                                    className="gap-2"
                                >
                                    <Monitor className="h-3 w-3" />
                                    Desktop
                                </Button>
                            </div>

                            {/* Preview Container */}
                            <div className="mt-4">
                                <div className="flex justify-center items-center min-h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-4">
                                    <div
                                        className="relative bg-white dark:bg-slate-800 overflow-hidden shadow-2xl mx-auto"
                                        style={{
                                            width: getDeviceDimensions().width,
                                            height: getDeviceDimensions().height,
                                            transform: `scale(${getDeviceDimensions().scale})`,
                                            transformOrigin: 'top center',
                                            border: settings.show_border ? '1px solid hsl(var(--border))' : 'none',
                                            borderRadius: '0.375rem',
                                        }}
                                    >
                                        {/* Receipt Preview */}
                                        <div
                                            className={`h-full flex flex-col p-4 ${settings.font_family}`}
                                            style={{
                                                fontSize: `${settings.font_size_base}px`,
                                                color: settings.primary_color,
                                                backgroundColor: 'white',
                                                maxWidth: `${settings.paper_width}mm`,
                                                margin: `${settings.margin_size}px auto`
                                            }}
                                        >
                                            {/* Logo Section */}
                                            {settings.show_logo && settings.logo_url && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    marginBottom: '10px',
                                                    width: '100%',
                                                    display: settings.show_logo ? 'block' : 'none'
                                                }}>
                                                    <img
                                                        src={settings.logo_url}
                                                        style={{
                                                            width: `${settings.logo_size}px`,
                                                            height: 'auto',
                                                            maxWidth: '100%',
                                                            display: 'block',
                                                            margin: '0 auto',
                                                            filter: 'grayscale(100%)'
                                                        }}
                                                        alt="Logo"
                                                    />
                                                </div>
                                            )}

                                            {/* Header Section */}
                                            {settings.show_header && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    width: '100%',
                                                    marginBottom: '10px',
                                                    display: settings.show_header ? 'block' : 'none'
                                                }}>
                                                    <h1 style={{
                                                        margin: '0 0 5px 0',
                                                        fontSize: `${(settings.font_size_base || 12) + 2}px`,
                                                        fontWeight: 'bold',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {settings.store_name || user?.branch?.branch_name || 'STORE NAME'}
                                                    </h1>

                                                    {/* Branch Address */}
                                                    {!!user?.branch?.location && (
                                                        <p style={{
                                                            margin: '3px 0',
                                                            fontSize: `${(settings.font_size_base || 12) - 1}px`,
                                                            lineHeight: '1.1'
                                                        }}>
                                                            📍 {user.branch.location}
                                                        </p>
                                                    )}

                                                    {/* Branch Contact */}
                                                    {!!user?.branch?.contact_phone && (
                                                        <p style={{
                                                            margin: '3px 0',
                                                            fontSize: `${(settings.font_size_base || 12) - 1}px`
                                                        }}>
                                                            📞 {user.branch.contact_phone}
                                                        </p>
                                                    )}

                                                    {settings.header_text && (
                                                        <p style={{
                                                            margin: '5px 0',
                                                            whiteSpace: 'pre-line',
                                                            fontSize: `${(settings.font_size_base || 12) - 1}px`
                                                        }}>
                                                            {settings.header_text}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>

                                            {/* Order Information */}
                                            <div style={{ marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                    <span>Date:</span>
                                                    <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                    <span>Order #:</span>
                                                    <span>ORD-001</span>
                                                </div>

                                                {/* Mock Table */}
                                                {settings.show_customer_info && (
                                                    <div style={{
                                                        marginTop: '5px',
                                                        padding: '3px 5px',
                                                        backgroundColor: '#f5f5f5',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '3px'
                                                    }}>
                                                        <div style={{ fontWeight: 'bold', textAlign: 'center' }}>
                                                            🪑 Table: 5
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Items Table */}
                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                marginBottom: '15px'
                                            }}>
                                                <thead>
                                                    <tr style={{ borderBottom: '1px solid #000' }}>
                                                        <th style={{ textAlign: 'left', paddingBottom: '5px' }}>Item</th>
                                                        <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Qty</th>
                                                        <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Price</th>
                                                        <th style={{ textAlign: 'right', paddingBottom: '5px' }}>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[
                                                        { name: 'Espresso Shot', price: 4.00, qty: 2, total: 8.00 },
                                                        { name: 'Cappuccino', price: 5.50, qty: 1, total: 5.50 },
                                                        { name: 'Blueberry Muffin', price: 3.75, qty: 1, total: 3.75 }
                                                    ].map((item, index) => (
                                                        <tr key={index} style={{ borderBottom: '1px dashed #ccc' }}>
                                                            <td style={{
                                                                verticalAlign: 'top',
                                                                padding: '4px 0',
                                                                maxWidth: '60%',
                                                                wordBreak: 'break-word'
                                                            }}>
                                                                {item.name}
                                                            </td>
                                                            <td style={{
                                                                textAlign: 'right',
                                                                verticalAlign: 'top',
                                                                padding: '4px 5px'
                                                            }}>
                                                                {item.qty}
                                                            </td>
                                                            <td style={{
                                                                textAlign: 'right',
                                                                verticalAlign: 'top',
                                                                padding: '4px 5px'
                                                            }}>
                                                                ${item.price.toFixed(2)}
                                                            </td>
                                                            <td style={{
                                                                textAlign: 'right',
                                                                verticalAlign: 'top',
                                                                padding: '4px 0',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                ${item.total.toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            {/* Totals Section */}
                                            <div style={{ borderTop: '2px solid #000', paddingTop: '10px', marginBottom: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Subtotal:</span>
                                                    <span>$17.25</span>
                                                </div>

                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    color: '#d32f2f',
                                                    marginBottom: '4px'
                                                }}>
                                                    <span>Discount:</span>
                                                    <span style={{ fontWeight: '600' }}>
                                                        -$1.73
                                                    </span>
                                                </div>

                                                {/* Tax Section - Real Data */}
                                                {!!user?.branch?.tax_is_active && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>{user.branch.tax_name || 'Tax'} ({user.branch.tax_rate || 0}%):</span>
                                                        <span>
                                                            {/* Mock calculation: (17.25 - 1.73) * rate% */}
                                                            ${((17.25 - 1.73) * ((user.branch.tax_rate || 0) / 100)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontWeight: 'bold',
                                                    fontSize: `${(settings.font_size_base || 12) + 1}px`,
                                                    marginTop: '5px',
                                                    borderTop: '1px dashed #000',
                                                    paddingTop: '5px'
                                                }}>
                                                    <span>TOTAL:</span>
                                                    <span>
                                                        ${((17.25 - 1.73) + ((user?.branch?.tax_is_active ? (17.25 - 1.73) * ((user?.branch?.tax_rate || 0) / 100) : 0))).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* QR Code Section */}
                                            {settings.show_qr && (settings.qr_code_file || settings.qr_code_url) && (
                                                <div style={{
                                                    marginTop: '15px',
                                                    paddingTop: '15px',
                                                    borderTop: '1px dashed #000',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    width: '100%'
                                                }}>
                                                    <img
                                                        src={settings.qr_code_url || ''}
                                                        style={{
                                                            width: `${settings.qr_code_size}px`,
                                                            height: `${settings.qr_code_size}px`,
                                                            imageRendering: 'crisp-edges',
                                                            display: 'block',
                                                            margin: '0 auto',
                                                            filter: 'grayscale(100%)'
                                                        }}
                                                        alt="QR Code"
                                                    />
                                                    <p style={{
                                                        fontSize: '9px',
                                                        fontWeight: 'bold',
                                                        marginTop: '5px',
                                                        textAlign: 'center'
                                                    }}>
                                                        SCAN TO PAY
                                                    </p>
                                                </div>
                                            )}

                                            {/* Footer Section */}
                                            {settings.show_footer && (
                                                <footer style={{
                                                    textAlign: 'center',
                                                    marginTop: '15px',
                                                    fontSize: `${(settings.font_size_base || 12) - 1}px`,
                                                    fontStyle: 'italic',
                                                    paddingTop: '10px',
                                                    borderTop: '1px dashed #000'
                                                }}>
                                                    {settings.footer_text || 'Thank you for your purchase!'}
                                                </footer>
                                            )}

                                            <div style={{
                                                textAlign: 'center',
                                                fontSize: '8px',
                                                marginTop: '10px',
                                                color: '#666'
                                            }}>
                                                Generated on {new Date().toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Info */}
                            <div className="text-center text-sm text-muted-foreground pt-2">
                                <p>Previewing: {previewDevice} view</p>
                                <p className="text-xs mt-1">
                                    Paper width: {settings.paper_width}mm • Font: {settings.font_size_base}px
                                </p>
                            </div>

                            {/* Print Preview Note */}
                            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <p className="text-xs text-primary text-center">
                                    <strong>Note:</strong> Thermal printers may render colors differently
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Hidden Print Component */}
            <div className="hidden">
                <ThermalReceipt
                    ref={componentRef}
                    settings={settings}
                    order={mockOrder}
                    branch={brandingPresets} // Pass branch info including contact_phone
                />
            </div>
        </div>
    );
};

// Update the mockOrder at the bottom of ReceiptSettings.tsx
const mockOrder = {
    order_code: '12345',
    total: '18.63',
    subtotal: '17.25',
    tax_amount: '1.38',
    tax_rate: '10',
    order_level_discount: '0',
    table_number: 'A5',
    created_at: new Date().toISOString(),
    items: [
        {
            quantity: 2,
            total: '8.00',
            product: {
                name: 'Espresso Shot',
                price: '4.00'
            },
            remark: 'Extra hot'
        },
        {
            quantity: 1,
            total: '5.50',
            product: {
                name: 'Cappuccino',
                price: '5.50'
            }
        },
        {
            quantity: 1,
            total: '3.75',
            product: {
                name: 'Blueberry Muffin',
                price: '3.75'
            }
        }
    ]
};

// When using ThermalReceipt in ReceiptSettings.tsx:


export default ReceiptSettings;