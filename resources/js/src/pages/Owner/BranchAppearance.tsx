import { useState, useEffect } from 'react';
import api from '@/util/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ImagePicker from "@/components/ImagePicker";
import { 
  Loader2, 
  Smartphone, 
  Type, 
  Palette, 
  Save, 
  Eye,
  RefreshCw,
  PaintBucket,
  Text,
  Image as ImageIcon,
  SmartphoneIcon,
  Tablet,
  Monitor,
  Check,
  Globe
} from "lucide-react";

interface FontOption {
  value: string;
  label: string;
  preview?: string;
  category: 'sans' | 'serif' | 'display' | 'khmer';
  fontFamily: string; // Add this for CSS font-family
}

const FONT_OPTIONS: FontOption[] = [
  { value: 'font-sans', label: 'System Sans', category: 'sans', preview: 'Modern and clean', fontFamily: 'system-ui, -apple-system, sans-serif' },
  { value: 'font-inter', label: 'Inter', category: 'sans', preview: 'Modern sans-serif', fontFamily: 'Inter, system-ui, sans-serif' },
  { value: 'font-roboto', label: 'Roboto', category: 'sans', preview: 'Google sans-serif', fontFamily: 'Roboto, system-ui, sans-serif' },
  { value: 'font-opensans', label: 'Open Sans', category: 'sans', preview: 'Humanist sans-serif', fontFamily: 'Open Sans, system-ui, sans-serif' },
  { value: 'font-montserrat', label: 'Montserrat', category: 'sans', preview: 'Geometric sans-serif', fontFamily: 'Montserrat, system-ui, sans-serif' },
  { value: 'font-poppins', label: 'Poppins', category: 'sans', preview: 'Modern sans-serif', fontFamily: 'Poppins, system-ui, sans-serif' },
  { value: 'font-serif', label: 'System Serif', category: 'serif', preview: 'Traditional and elegant', fontFamily: 'Georgia, serif' },
  { value: 'font-times', label: 'Times New Roman', category: 'serif', preview: 'Classic serif', fontFamily: 'Times New Roman, serif' },
  { value: 'font-georgia', label: 'Georgia', category: 'serif', preview: 'Web-optimized serif', fontFamily: 'Georgia, serif' },
  { value: 'font-playfair', label: 'Playfair Display', category: 'serif', preview: 'Elegant serif', fontFamily: 'Playfair Display, serif' },
  { value: 'font-mono', label: 'System Mono', category: 'display', preview: 'Technical and code', fontFamily: 'monospace' },
  { value: 'font-robotomono', label: 'Roboto Mono', category: 'display', preview: 'Clean monospace', fontFamily: 'Roboto Mono, monospace' },
  { value: 'font-kantumruy', label: 'Kantumruy Pro', category: 'khmer', preview: 'Khmer font', fontFamily: 'Kantumruy Pro, sans-serif' },
  { value: 'font-moul', label: 'Moul', category: 'khmer', preview: 'Traditional Khmer', fontFamily: 'Moul, serif' },
  { value: 'font-dangrek', label: 'Dangrek', category: 'khmer', preview: 'Khmer font', fontFamily: 'Dangrek, serif' },
];

const COLOR_PRESETS = [
  { name: 'Primary Red', value: '#ef4444' },
  { name: 'Emerald Green', value: '#10b981' },
  { name: 'Sapphire Blue', value: '#3b82f6' },
  { name: 'Amber Orange', value: '#f59e0b' },
  { name: 'Violet Purple', value: '#8b5cf6' },
  { name: 'Rose Pink', value: '#ec4899' },
  { name: 'Slate Gray', value: '#64748b' },
  { name: 'Midnight Black', value: '#1e293b' },
];

const OwnerBranchAppearance = ({ branch, onUpdate }: { branch: any, onUpdate: () => void }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(branch.logo_path || null);
  const [previewFaviconUrl, setPreviewFaviconUrl] = useState<string | null>(branch.favicon_path || null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("colors");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  
const [config, setConfig] = useState({
  primary_color: branch.primary_color || '#3b82f6',
  secondary_color: branch.secondary_color || '#f59e0b',
  accent_color: branch.accent_color || '#10b981',
  font_family: branch.font_family || 'font-sans',
  font_family_headings: branch.font_family_headings || 'font-sans',
  logo_url: branch.logo_url || '',
  favicon_url: branch.favicon_url || '',
});

useEffect(() => {
  if (branch) {
    setConfig({
      primary_color: branch.primary_color || '#3b82f6',
      secondary_color: branch.secondary_color || '#f59e0b',
      accent_color: branch.accent_color || '#10b981',
      font_family: branch.font_family || 'font-sans',
      font_family_headings: branch.font_family_headings || branch.font_family || 'font-sans',
      logo_url: branch.logo_url || '',
      favicon_url: branch.favicon_url || '',
    });
    // Set preview URL - prefer full URL if available, otherwise construct from path
    if (branch.logo_url) {
      setPreviewUrl(branch.logo_url);
    } else if (branch.logo_path) {
      setPreviewUrl(`/storage/${branch.logo_path}`);
    } else {
      setPreviewUrl(null);
    }
    
    // Same for favicon
    if (branch.favicon_url) {
      setPreviewFaviconUrl(branch.favicon_url);
    } else if (branch.favicon_path) {
      setPreviewFaviconUrl(`/storage/${branch.favicon_path}`);
    } else {
      setPreviewFaviconUrl(null);
    }
  }
}, [branch]);


// Add this helper function
const getLogoUrl = () => {
  if (previewUrl) return previewUrl; // If we have a preview (from upload)
  if (branch.logo_url) return branch.logo_url; // If backend returns full URL
  if (branch.logo_path) return `/storage/${branch.logo_path}`; // Construct from path
  return null;
};

const getFaviconUrl = () => {
  if (previewFaviconUrl) return previewFaviconUrl;
  if (branch.favicon_url) return branch.favicon_url;
  if (branch.favicon_path) return `/storage/${branch.favicon_path}`;
  return null;
};

  // Get font family CSS value
  const getFontFamilyValue = (fontValue: string): string => {
    const fontOption = FONT_OPTIONS.find(f => f.value === fontValue);
    return fontOption?.fontFamily || 'system-ui, -apple-system, sans-serif';
  };

const handleFileChange = (file: File | null) => {
  setLogoFile(file);
  if (file) {
    setPreviewUrl(URL.createObjectURL(file));
  }
};

const handleFaviconChange = (file: File | null) => {
  setFaviconFile(file);
  if (file) {
    setPreviewFaviconUrl(URL.createObjectURL(file));
  }
};

const handleSave = async () => {
  setLoading(true);
  const formData = new FormData();
  
  formData.append('primary_color', config.primary_color);
  formData.append('secondary_color', config.secondary_color);
  formData.append('accent_color', config.accent_color);
  formData.append('font_family', config.font_family);
  formData.append('font_family_headings', config.font_family_headings);
  
  if (logoFile) {
    formData.append('logo', logoFile);
  }

  if (faviconFile) { // Add this section
    formData.append('favicon', faviconFile);
  }

  try {
    await api.post(`/admin/branches/${branch.id}/appearance`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    toast({ 
      title: "Appearance Updated", 
      description: "Branch brand identity has been saved successfully." 
    });
    onUpdate();
  } catch (error: any) {
    toast({ 
      variant: "destructive", 
      title: "Save Failed", 
      description: error.response?.data?.message || "Failed to save appearance settings." 
    });
  } finally { 
    setLoading(false); 
  }
};

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.post(`/admin/branches/${branch.id}/appearance/reset`);
      toast({ 
        title: "Appearance Reset", 
        description: "Brand identity has been reset to default values." 
      });
      onUpdate();
      setShowResetDialog(false);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Reset Failed", 
        description: "Failed to reset appearance settings." 
      });
    } finally { 
      setLoading(false); 
    }
  };

  const applyColorPreset = (color: string) => {
    setConfig({...config, primary_color: color});
  };

  // Get device dimensions with proper scaling
const getDeviceDimensions = () => {
  switch (previewDevice) {
    case 'mobile': return { 
      width: '280px', // Slightly smaller to fit better
      height: '560px',
      scale: 1, // Increased scale
      fontSize: '9px',
      borderSize: '12px'
    };
    case 'tablet': return { 
      width: '512px', // Reduced from 768px
      height: '683px', // Reduced from 1024px
      scale: 0.8, // Increased scale for better visibility
      fontSize: '16px',
      borderSize: '14px'
    };
    case 'desktop': return { 
      width: '720px', // Reduced from 1024px
      height: '480px', // Reduced from 768px
      scale: 0.8, // Increased scale
      fontSize: '18px',
      borderSize: '16px'
    };
    default: return { 
      width: '280px', 
      height: '560px',
      scale: 1,
      fontSize: '14px',
      borderSize: '12px'
    };
  }
};

  const deviceConfig = getDeviceDimensions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PaintBucket className="h-6 w-6 text-primary" />
            Branch Appearance
          </h3>
          <p className="text-muted-foreground">
            Customize the look and feel for {branch.branch_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowResetDialog(true)}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors" className="gap-2">
            <Palette className="h-3 w-3" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="typography" className="gap-2">
            <Type className="h-3 w-3" />
            Typography
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <ImageIcon className="h-3 w-3" />
            Branding
          </TabsTrigger>
        </TabsList>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
  {/* LEFT COLUMN: Settings (Colors, Typography, Branding) */}
  <div className="mt-2">
    <TabsContent value="colors" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Color Scheme</CardTitle>
          <CardDescription>
            Choose primary and secondary colors for your branch theme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color" className="flex items-center gap-2">
                  <div 
                    className="h-4 w-4 rounded-sm" 
                    style={{ backgroundColor: config.primary_color }}
                  />
                  Primary Color
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    value={config.primary_color}
                    onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                    className="font-mono"
                  />
                  <Input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                    className="w-12 cursor-pointer p-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    value={config.secondary_color}
                    onChange={(e) => setConfig({...config, secondary_color: e.target.value})}
                    className="font-mono"
                  />
                  <Input
                    type="color"
                    value={config.secondary_color}
                    onChange={(e) => setConfig({...config, secondary_color: e.target.value})}
                    className="w-12 cursor-pointer p-1"
                  />
                </div>
              </div>
                <div className="space-y-2">
                <Label htmlFor="secondary_color">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="accent_color"
                    value={config.accent_color}
                    onChange={(e) => setConfig({...config, accent_color: e.target.value})}
                    className="font-mono"
                  />
                  <Input
                    type="color"
                    value={config.accent_color}
                    onChange={(e) => setConfig({...config, accent_color: e.target.value})}
                    className="w-12 cursor-pointer p-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Color Presets</Label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className="aspect-square rounded-md border flex items-center justify-center transition-transform hover:scale-105"
                    style={{ backgroundColor: color.value }}
                    onClick={() => applyColorPreset(color.value)}
                    title={color.name}
                  >
                    {config.primary_color === color.value && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Color Preview</Label>
            <div className="grid grid-cols-3 gap-4">
              <div 
                className="h-24 rounded-lg flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: config.primary_color }}
              >
                Primary
              </div>
              <div 
                className="h-24 rounded-lg flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: config.secondary_color }}
              >
                Secondary
              </div>
              <div 
                className="h-24 rounded-lg flex items-center justify-center font-medium border"
                style={{ 
                  color: config.primary_color,
                  backgroundColor: `${config.primary_color}15`
                }}
              >
                Light Variant
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    <Card>
      <CardHeader>
        <CardTitle>Quick Tips</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ backgroundColor: config.primary_color + '20' }}>
            <Palette className="h-3 w-3" style={{ color: config.primary_color }} />
          </div>
          <div>
            <div className="font-medium">Color Contrast</div>
            <p className="text-muted-foreground">Ensure text is readable on your chosen colors</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ backgroundColor: config.primary_color + '20' }}>
            <Type className="h-3 w-3" style={{ color: config.primary_color }} />
          </div>
          <div>
            <div className="font-medium">Font Pairing</div>
            <p className="text-muted-foreground">Use contrasting fonts for headings and body text</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="h-5 w-5 rounded-full flex items-center justify-center" style={{ backgroundColor: config.primary_color + '20' }}>
            <ImageIcon className="h-3 w-3" style={{ color: config.primary_color }} />
          </div>
          <div>
            <div className="font-medium">Logo Quality</div>
            <p className="text-muted-foreground">Use high-resolution logos for best appearance</p>
          </div>
        </div>
      </CardContent>
    </Card>

    </TabsContent>

    <TabsContent value="typography" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Choose fonts for body text and headings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="font_family">Body Font</Label>
              <Select
                value={config.font_family} 
                onValueChange={(val) => setConfig({...config, font_family: val})}
              >
                <SelectTrigger className='py-6' >
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent  >
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem 
                      key={font.value} 
                      value={font.value}
                      style={{ fontFamily: font.fontFamily }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{font.label}</span>
                        {font.preview && (
                          <span className="text-xs text-muted-foreground">
                            {font.preview}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font_family_headings">Heading Font</Label>
              <Select 
                value={config.font_family_headings} 
                onValueChange={(val) => setConfig({...config, font_family_headings: val})}
              >
                <SelectTrigger className='py-6' >
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem 
                      key={font.value} 
                      value={font.value}
                      style={{ fontFamily: font.fontFamily }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{font.label}</span>
                        {font.preview && (
                          <span className="text-xs text-muted-foreground">
                            {font.preview}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Typography Preview</Label>
            <div 
              className="p-6 rounded-lg border space-y-4"
              style={{ 
                fontFamily: getFontFamilyValue(config.font_family)
              }}
            >
              <h1 
                className="text-3xl font-bold" 
                style={{ 
                  fontFamily: getFontFamilyValue(config.font_family_headings)
                }}
              >
                The quick brown fox jumps over the lazy dog
              </h1>
              <p className="text-lg">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <p className="text-sm text-muted-foreground">
                This is smaller text with less emphasis, showing how body copy will appear.
              </p>
              <button 
                className="px-4 py-2 rounded-md text-white font-medium"
                style={{ backgroundColor: config.primary_color }}
              >
                Button Example
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>

<TabsContent value="branding" className="space-y-6">
  <Card>
    <CardHeader>
      <CardTitle>Brand Assets</CardTitle>
      <CardDescription>
        Upload logos and icons for your branch
      </CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col md:flex-row gap-6">
      <div className="space-y-4 flex-1">
        <Label>Branch Logo</Label>
        <ImagePicker
          onImageSelect={handleFileChange}
          currentImage={getLogoUrl() || undefined}
          label="Logo Image"
          description="Upload your branch logo. Recommended: 500x500px, PNG with transparency."
          aspectRatio="square"
          maxSizeMB={10}
        />
      </div>

      <div className="space-y-4 flex-1">
        <Label>Favicon</Label>
        <ImagePicker
          onImageSelect={handleFaviconChange}
          currentImage={getFaviconUrl() || undefined}
          label="Favicon Icon"
          description="Square icon for browser tabs. Recommended: 32x32px or 64x64px."
          aspectRatio="square"
          maxSizeMB={1}
          accept=".ico,.png,.jpg"
        />
      </div>
    </CardContent>
  </Card>
</TabsContent>

    <div className="pt-4">
      <Button 
        onClick={handleSave} 
        disabled={loading}
        className="w-full gap-2"
        size="lg"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save Appearance Settings
      </Button>
    </div>
  </div>

 {/* RIGHT COLUMN: Live Preview - Now 50% width */}
<div className="mt-4">
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Eye className="h-4 w-4" />
        Live Preview
      </CardTitle>
      <CardDescription>
        See how your changes will appear on different devices
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {/* Device selector - fixed position */}
      <div className="sticky top-0 z-10 bg-card py-2">
        <div className="flex justify-center gap-2">
          <Button
            variant={previewDevice === "mobile" ? "default" : "outline"}
            size="sm"
            onClick={() => setPreviewDevice("mobile")}
            className="gap-2"
          >
            <SmartphoneIcon className="h-3 w-3" />
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
      </div>

      {/* Device preview container - with proper isolation */}
      <div className="relative mt-4">
        <div className="flex justify-center items-center min-h-[500px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-4">
          <div 
            className="relative bg-white dark:bg-slate-800 overflow-hidden shadow-2xl mx-auto"
            style={{
              width: deviceConfig.width,
              height: deviceConfig.height,
              transform: `scale(${deviceConfig.scale})`,
              transformOrigin: 'top center',
              border: `${deviceConfig.borderSize} solid hsl(var(--border))`,
              borderRadius: previewDevice === 'mobile' ? '2rem' : '1rem',
              // Ensure preview stays below device selector
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Device Screen */}
            <div 
              className="h-full flex flex-col"
              style={{ 
                fontFamily: getFontFamilyValue(config.font_family),
                fontSize: deviceConfig.fontSize
              }}
            >
              {/* Header */}
              <div 
                className="p-4 border-b flex items-center gap-3"
                style={{ backgroundColor: config.primary_color + '10' }}
              >
                {previewUrl  ? (
                  <img 
                    src={getLogoUrl()} 
                    alt="Logo" 
                    className="h-10 w-10 rounded-lg object-contain"
                  />
                ) : (
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    {branch.branch_name.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div 
                    className="font-bold truncate text-lg"
                    style={{ 
                      fontFamily: getFontFamilyValue(config.font_family_headings),
                      color: config.primary_color 
                    }}
                  >
                    {branch.branch_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Open • Closes at 10 PM
                  </div>
                </div>
              </div>

              {/* Content - Adjusts based on device */}
              <div className="flex-1 p-4 space-y-4 overflow-auto">
                {/* Product Card */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full" style={{ backgroundColor: config.secondary_color }} />
                    </div>
                    <div className="flex-1">
                      <div 
                        className="font-semibold mb-1 text-sm"
                        style={{ fontFamily: getFontFamilyValue(config.font_family_headings) }}
                      >
                        Signature Dish
                      </div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        A delicious meal prepared with fresh ingredients and special sauce.
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-base" style={{ color: config.primary_color }}>
                          $12.99
                        </span>
                        <button 
                          className="px-3 py-1 rounded-md text-white text-sm font-medium"
                          style={{ backgroundColor: config.primary_color }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Section - Adjusts columns based on device */}
                <div>
                  <div 
                    className="font-bold mb-2 text-lg"
                    style={{ fontFamily: getFontFamilyValue(config.font_family_headings) }}
                  >
                    Categories
                  </div>
                  <div className={`grid gap-2 ${
                    previewDevice === 'mobile' ? 'grid-cols-2' : 
                    previewDevice === 'tablet' ? 'grid-cols-3' : 
                    'grid-cols-4'
                  }`}>
                    {['Appetizers', 'Main Course', 'Desserts', 'Drinks', 'Specials', 'Chef\'s Picks'].slice(
                      0, previewDevice === 'mobile' ? 4 : 
                         previewDevice === 'tablet' ? 6 : 6
                    ).map((cat) => (
                      <span 
                        key={cat}
                        className="px-3 py-1 rounded-full text-sm border truncate"
                        style={{ 
                          borderColor: config.primary_color + '40',
                          color: config.primary_color,
                          backgroundColor: config.primary_color + '10'
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Button Example */}
                <div className="pt-4">
                  <button 
                    className="w-full py-3 rounded-lg font-bold text-white shadow-lg transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: config.primary_color }}
                  >
                    View Cart • $24.99
                  </button>
                </div>
              </div>

              {/* Footer - Adjusts for different devices */}
              <div className="p-4 border-t flex justify-around">
                {['Home', 'Menu', 'Cart', 'Profile', 'Orders'].slice(
                  0, previewDevice === 'mobile' ? 4 : 5
                ).map((item) => (
                  <button 
                    key={item}
                    className="flex flex-col items-center text-xs"
                    style={{ color: config.primary_color }}
                  >
                    <div className="h-6 w-6 rounded-full mb-1 flex items-center justify-center"
                         style={{ backgroundColor: config.primary_color + '20' }}>
                      {item === 'Home' && '🏠'}
                      {item === 'Menu' && '📋'}
                      {item === 'Cart' && '🛒'}
                      {item === 'Profile' && '👤'}
                      {item === 'Orders' && '📦'}
                    </div>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground pt-4">
        Previewing: {previewDevice.charAt(0).toUpperCase() + previewDevice.slice(1)} view
        {previewDevice !== 'mobile' && ' (Scaled for preview)'}
      </div>
    </CardContent>
  </Card>
</div>
        </div>

      </Tabs>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Appearance Settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all custom appearance settings (colors, fonts, logo) for {branch.branch_name} to their default values. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReset}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reset Appearance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OwnerBranchAppearance;