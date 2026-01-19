import React, { useState, useEffect, useRef } from 'react';
import { Printer, Save, Upload, Type, Palette, Maximize, Loader2, QrCode, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useReactToPrint } from 'react-to-print';
import { ThermalReceipt } from '@/components/printing/ThermalReceipt';
// POINT: Using shadcn toast instead of sonner
import { useToast } from "@/hooks/use-toast";
import api from '@/util/api';

const ReceiptSettings = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [brandingPresets, setBrandingPresets] = useState<any>({ colors: [], fonts: [], store_name: '' });
    
    const [settings, setSettings] = useState({
        store_name: '',
        header_text: '',
        footer_text: '',
        primary_color: '#000000',
        font_size_base: 14,
        font_family: 'font-mono', 
        logo_size: 80,
        qr_code_size: 90,
        show_logo: true,
        logo_url: null,
        qr_code_url: null
    });

    const componentRef = useRef<HTMLDivElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const qrInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings/receipt');
            if (res.data.settings) setSettings(res.data.settings);
            if (res.data.branding_presets) setBrandingPresets(res.data.branding_presets);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to load settings" });
        } finally { setLoading(false); }
    };

    const handlePrint = useReactToPrint({ contentRef: componentRef });

    const handleSave = async () => {
        setSaving(true);
        const formData = new FormData();
        
        Object.entries(settings).forEach(([key, value]) => {
            if (!key.includes('_url') && !key.endsWith('_file')) {
                let val = value;
                // POINT: Boolean to '1'/'0' conversion for Laravel
                if (typeof value === 'boolean') val = value ? '1' : '0';
                formData.append(key, val === null ? '' : String(val));
            }
        });

        if (settings['logo_file' as keyof typeof settings]) {
            formData.append('logo', settings['logo_file' as keyof typeof settings]);
        }
        if (settings['qr_code_file' as keyof typeof settings]) {
            formData.append('qr_code', settings['qr_code_file' as keyof typeof settings]);
        }

        try {
            const res = await api.post('/admin/settings/receipt', formData, { 
                headers: { 'Content-Type': 'multipart/form-data' } 
            });
            toast({ title: "Success", description: "Receipt settings updated!" });
            setSettings(res.data.settings);
        } catch (error) { 
            toast({ variant: "destructive", title: "Error", description: "Could not save settings" });
        } finally { 
            setSaving(false); 
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Receipt Designer</h1>
                    <p className="text-slate-500 italic">Branch: {brandingPresets.store_name}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => handlePrint()} className="gap-2"><Printer size={18} /> Test Print</Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2 px-8">
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Palette size={18}/> Branding & Presets</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <Label>Primary Color (Select a circle to use branch brand)</Label>
                                <div className="flex flex-wrap gap-3 items-center p-3 border rounded-lg bg-slate-50/50">
                                    <Input type="color" value={settings.primary_color} onChange={(e) => setSettings({...settings, primary_color: e.target.value})} className="w-12 h-10 p-1 cursor-pointer" />
                                    <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                                    {brandingPresets.colors.map((color: string) => (
                                        <button key={color} onClick={() => setSettings({...settings, primary_color: color})} className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${settings.primary_color === color ? 'border-slate-900 ring-2 ring-slate-200' : 'border-white'}`} style={{ backgroundColor: color }} />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Font Styles (Including Branch Fonts)</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['font-mono', 'font-sans', 'font-serif', ...brandingPresets.fonts].map((font) => (
                                        <Button key={font} variant={settings.font_family === font ? 'default' : 'outline'} size="sm" className={`text-xs ${font}`} onClick={() => setSettings({...settings, font_family: font})}>
                                            {font.replace('font-', '').toUpperCase()}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Maximize size={18}/> Asset Sizes</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <Label>Logo Width: {settings.logo_size}px</Label>
                                <div onClick={() => logoInputRef.current?.click()} className="border-2 border-dashed rounded-xl h-24 flex items-center justify-center cursor-pointer bg-slate-50">
                                    {settings.logo_url ? <img src={settings.logo_url} className="h-full object-contain p-2" /> : <Upload className="text-slate-400" />}
                                    <input type="file" ref={logoInputRef} hidden onChange={(e) => { 
                                        const file = e.target.files?.[0]; 
                                        if (file) setSettings({...settings, logo_file: file, logo_url: URL.createObjectURL(file)}); 
                                    }} />
                                </div>
                                <Slider value={[settings.logo_size]} min={40} max={180} onValueChange={([v]) => setSettings({...settings, logo_size: v})} />
                            </div>
                            <div className="space-y-4">
                                <Label>QR Width: {settings.qr_code_size}px</Label>
                                <div onClick={() => qrInputRef.current?.click()} className="border-2 border-dashed rounded-xl h-24 flex items-center justify-center cursor-pointer bg-slate-50">
                                    {settings.qr_code_url ? <img src={settings.qr_code_url} className="h-full object-contain p-2" /> : <QrCode className="text-slate-400" />}
                                    <input type="file" ref={qrInputRef} hidden onChange={(e) => { 
                                        const file = e.target.files?.[0]; 
                                        if (file) setSettings({...settings, qr_code_file: file, qr_code_url: URL.createObjectURL(file)}); 
                                    }} />
                                </div>
                                <Slider value={[settings.qr_code_size]} min={40} max={180} onValueChange={([v]) => setSettings({...settings, qr_code_size: v})} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-5 sticky top-6">
                    <div className="bg-slate-100 rounded-[2.5rem] p-8 border-8 border-slate-200 shadow-inner flex justify-center">
                        <div className={`bg-white w-[280px] min-h-[450px] shadow-xl p-6 relative ${settings.font_family}`} style={{ fontSize: `${settings.font_size_base}px`, color: settings.primary_color }}>
                            <div className="text-center mb-6">
                                {settings.logo_url && <img src={settings.logo_url} style={{ width: `${settings.logo_size}px` }} className="mx-auto mb-2" />}
                                <h2 className="font-black uppercase">{settings.store_name || 'STORE NAME'}</h2>
                            </div>
                            <div className="border-y border-dashed py-4 border-slate-300 text-[11px] space-y-2">
                                <div className="flex justify-between"><span>2x Espresso Shot</span><span>$4.00</span></div>
                            </div>
                            {settings.qr_code_url && (
                                <div className="mt-6 flex flex-col items-center">
                                    <img src={settings.qr_code_url} style={{ width: `${settings.qr_code_size}px` }} className="grayscale" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ThermalReceipt ref={componentRef} settings={settings} order={mockOrder} />
        </div>
    );
};

const mockOrder = { total: '4.00', items: [{ quantity: 2, total: '4.00', product: { name: 'Espresso Shot' } }] };

export default ReceiptSettings;