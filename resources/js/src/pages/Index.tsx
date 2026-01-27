import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/util/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
    ChefHat,
    QrCode,
    BarChart3,
    Users,
    ArrowRight,
    CheckCircle2,
    UtensilsCrossed,
    Smartphone,
    ShieldCheck,
    Loader2,
    Check,
    Facebook,
    MessageCircle, // Telegram replacement
    Instagram,
    Mail,
    MapPin,
    Phone, // Added Phone
    Send,
    Moon,
    Sun
} from "lucide-react";

// Helper to map string icon names to Lucide components
const IconMap: { [key: string]: any } = {
    QrCode, Users, BarChart3, ChefHat, Smartphone, ShieldCheck
};

const Index = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // Default settings
    const [settings, setSettings] = useState({
        logo: '',
        show_brand_name: true,
        hero_title: 'Streamline Your Restaurant Operations & Growth',
        hero_subtitle: 'From generic QR ordering to staff management and advanced analytics. Foodie gives you everything you need to run a successful restaurant.',
        cta_text: 'Start Free Trial',
        cta_link: '/auth/cover-register',
        view_demo_link: '', // Added
        features: '[]',
        about_title: '',
        about_content: '',
        about_image: '', // Added 
        pricing_plans: '[]',
        footer_text: `© ${new Date().getFullYear()} Foodie. All rights reserved.`,
        contact_email: '',
        contact_phone: '',
        contact_address: '',
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
            telegram: '',
            instagram: ''
        }
    });

    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        // Theme initialization
        const localTheme = localStorage.getItem('theme');
        if (localTheme === 'dark' || (!localTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        } else {
            setTheme('light');
            document.documentElement.classList.remove('dark');
        }

        const fetchSettings = async () => {
            try {
                const res = await api.get('/landing-page');
                if (res.data) {
                    const data = res.data;
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
                }
            } catch (error) {
                console.error("Failed to load landing page settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const featuresList = (() => {
        try {
            const parsed = JSON.parse(settings.features);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    })();

    const pricingList = (() => {
        try {
            const parsed = JSON.parse(settings.pricing_plans || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    })();

    const getLogoUrl = (path: string) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `/storage/${path}`;
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            await api.post('/public/contact', contactForm);
            toast({ title: "Message Sent", description: "We'll get back to you shortly!" });
            setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to send message." });
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
            {/* Navigation */}
            <header className="border-b sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-primary">
                        {settings.logo ? (
                            <img src={getLogoUrl(settings.logo)!} alt="Logo" className="h-8 w-auto" />
                        ) : (
                            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                                <UtensilsCrossed className="h-5 w-5" />
                            </div>
                        )}
                        {settings.show_brand_name && <span>Foodie</span>}
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={toggleTheme}>
                            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </Button>
                        <Link to="/login">
                            <Button variant="ghost">Login</Button>
                        </Link>
                        <Link to={settings.cta_link || '/register'}>
                            <Button>Get Started</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                {settings.section_visibility.hero && (
                    <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-b from-background to-muted/20">
                        <div className="container mx-auto px-4 text-center relative z-10">
                            <Badge variant="outline" className="mb-6 py-1.5 px-4 text-sm border-primary/20 bg-primary/5 text-primary">
                                The Future of Restaurant Management
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight" dangerouslySetInnerHTML={{ __html: settings.hero_title.replace('\n', '<br/>') }}>
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                                {settings.hero_subtitle}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to={settings.cta_link}>
                                    <Button size="lg" className="h-12 px-8 text-lg shadow-lg shadow-primary/20">
                                        {settings.cta_text} <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to={settings.view_demo_link || '/auth/cover-login'}>
                                    <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                                        View Demo
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
                    </section>
                )}

                {/* About Section */}
                {settings.section_visibility.about && settings.about_title && settings.about_content && (
                    <section className="py-20 bg-background">
                        <div className="container mx-auto px-4">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h2 className="text-3xl font-bold mb-6">{settings.about_title}</h2>
                                    <div className="prose dark:prose-invert text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
                                        {settings.about_content}
                                    </div>
                                </div>
                                <div className="relative">
                                    <div className="aspect-video bg-muted rounded-xl overflow-hidden shadow-xl flex items-center justify-center">
                                        {settings.about_image ? (
                                            <img src={getLogoUrl(settings.about_image)!} alt="About Us" className="h-full w-full object-cover" />
                                        ) : (
                                            <ChefHat className="h-24 w-24 text-muted-foreground/20" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Features Grid */}
                {settings.section_visibility.features && featuresList.length > 0 && (
                    <section className="py-20 bg-muted/30">
                        <div className="container mx-auto px-4">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
                                <p className="text-muted-foreground text-lg">
                                    Powerful tools designed to help you manage your restaurant more efficiently.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {featuresList.map((feature: any, i: number) => {
                                    const IconComponent = IconMap[feature.icon] || CheckCircle2;
                                    return (
                                        <Card key={i} className="border-none shadow-md hover:shadow-xl transition-shadow duration-300">
                                            <CardHeader>
                                                <div className="h-12 w-12 rounded-lg bg-background border flex items-center justify-center mb-4 shadow-sm">
                                                    <IconComponent className="h-6 w-6 text-primary" />
                                                </div>
                                                <CardTitle className="text-xl">{feature.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-muted-foreground leading-relaxed">
                                                    {feature.description}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* Pricing Section */}
                {settings.section_visibility.pricing && pricingList.length > 0 && (
                    <section className="py-20 bg-background">
                        <div className="container mx-auto px-4">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
                                <p className="text-muted-foreground text-lg">
                                    Choose the plan that's right for your business.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                                {pricingList.map((plan: any, i: number) => (
                                    <Card key={i} className={`flex flex-col ${plan.isPopular ? 'border-primary shadow-lg scale-105 relative z-10' : 'border-border'}`}>
                                        {plan.isPopular && (
                                            <div className="absolute top-0 right-0 -mt-3 -mr-3">
                                                <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm">Most Popular</Badge>
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardTitle className="text-2xl">{plan.title}</CardTitle>
                                            <div className="mt-4">
                                                <span className="text-4xl font-bold">{plan.price}</span>
                                                <span className="text-muted-foreground">/month</span>
                                            </div>
                                            <CardDescription className="mt-2">{plan.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1">
                                            <ul className="space-y-3">
                                                {plan.features?.map((feat: string, j: number) => (
                                                    <li key={j} className="flex items-start gap-2">
                                                        <Check className="h-5 w-5 text-green-500 shrink-0" />
                                                        <span className="text-sm">{feat}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            <Link to="/auth/cover-register" className="w-full">
                                                <Button className="w-full" variant={plan.isPopular ? 'default' : 'outline'}>
                                                    Choose Plan
                                                </Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Contact Section */}
                {settings.section_visibility.contact && (
                    <section className="py-20 bg-muted/50">
                        <div className="container mx-auto px-4">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
                                <p className="text-muted-foreground text-lg">
                                    Have questions? We'd love to hear from you.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Send us a Message</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleContactSubmit} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Input
                                                        placeholder="Name"
                                                        value={contactForm.name}
                                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Input
                                                        type="email"
                                                        placeholder="Email"
                                                        value={contactForm.email}
                                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="Phone Number (Optional)"
                                                    value={contactForm.phone}
                                                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Input
                                                    placeholder="Subject"
                                                    value={contactForm.subject}
                                                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Textarea
                                                    placeholder="Your Message"
                                                    className="h-32"
                                                    value={contactForm.message}
                                                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <Button type="submit" className="w-full" disabled={sending}>
                                                {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                                Send Message
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>

                                <div className="space-y-8 flex flex-col justify-center">
                                    {settings.contact_email && (
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <Mail className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Email Us</h3>
                                                <p className="text-muted-foreground">{settings.contact_email}</p>
                                            </div>
                                        </div>
                                    )}
                                    {settings.contact_phone && (
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <Phone className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Call Us</h3>
                                                <p className="text-muted-foreground">{settings.contact_phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {settings.contact_address && (
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <MapPin className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">Visit Us</h3>
                                                <p className="text-muted-foreground">{settings.contact_address}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-6 bg-primary/5 rounded-xl border border-primary/10">
                                        <p className="text-sm font-medium leading-relaxed">
                                            "Foodie has completely transformed how we manage our kitchen and staff. The support team is incredible!"
                                        </p>
                                        <div className="mt-4 flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                                            <div className="text-sm">
                                                <span className="font-bold block">Jane Doe</span>
                                                <span className="text-muted-foreground">Owner, Tasty Bites</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* CTA Section */}
                {settings.section_visibility.cta && (
                    <section className="py-20">
                        <div className="container mx-auto px-4">
                            <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-16 text-center shadow-2xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Transform Your Business?</h2>
                                    <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                                        Join thousands of restaurant owners who trust Foodie for their operations.
                                    </p>
                                    <Link to={settings.cta_link}>
                                        <Button size="lg" variant="secondary" className="h-14 px-10 text-lg font-semibold text-primary">
                                            Get Started Now
                                        </Button>
                                    </Link>
                                </div>
                                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                            </div>
                        </div>
                    </section>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-muted/50 py-12 border-t">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 font-bold text-xl mb-4 text-primary">
                                {settings.logo ? (
                                    <img src={getLogoUrl(settings.logo)!} alt="Logo" className="h-6 w-auto grayscale opacity-80" />
                                ) : (
                                    <UtensilsCrossed className="h-5 w-5" />
                                )}
                                {settings.show_brand_name && <span>Foodie</span>}
                            </div>
                            <p className="text-muted-foreground mb-4">
                                The ultimate restaurant management solution for modern businesses.
                            </p>

                            {settings.section_visibility.footer_social && (
                                <div className="flex items-center gap-4">
                                    {settings.social_links.facebook && (
                                        <a href={settings.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                            <Facebook className="h-5 w-5" />
                                        </a>
                                    )}
                                    {settings.social_links.telegram && (
                                        <a href={settings.social_links.telegram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className='h-5 w-5' viewBox="0 0 48 48" fill="currentColor"><path d="M41.4193 7.30899C41.4193 7.30899 45.3046 5.79399 44.9808 9.47328C44.8729 10.9883 43.9016 16.2908 43.1461 22.0262L40.5559 39.0159C40.5559 39.0159 40.3401 41.5048 38.3974 41.9377C36.4547 42.3705 33.5408 40.4227 33.0011 39.9898C32.5694 39.6652 24.9068 34.7955 22.2086 32.4148C21.4531 31.7655 20.5897 30.4669 22.3165 28.9519L33.6487 18.1305C34.9438 16.8319 36.2389 13.8019 30.8426 17.4812L15.7331 27.7616C15.7331 27.7616 14.0063 28.8437 10.7686 27.8698L3.75342 25.7055C3.75342 25.7055 1.16321 24.0823 5.58815 22.459C16.3807 17.3729 29.6555 12.1786 41.4193 7.30899Z"/></svg> 
                                        </a>
                                    )}
                                    {settings.social_links.instagram && (
                                        <a href={settings.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                                            <Instagram className="h-5 w-5" />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-muted-foreground">
                                <li>
                                    <Link to="#" className="hover:text-foreground">Features</Link>
                                </li>
                                <li>
                                    <Link to="#" className="hover:text-foreground">Pricing</Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-muted-foreground">
                                <li>
                                    <Link to="#" className="hover:text-foreground">About Us</Link>
                                </li>
                                <li>
                                    <Link to="/public/contact" className="hover:text-foreground">Contact</Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Legal</h4>
                            <ul className="space-y-2 text-muted-foreground">
                                <li>Privacy Policy</li>
                                <li>Terms of Service</li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t text-center text-muted-foreground">
                        <p>{settings.footer_text}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Index;
