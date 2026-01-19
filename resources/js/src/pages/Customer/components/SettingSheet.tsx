import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  X, Sun, Moon, Phone, Mail,
  MapPin, MessageSquare, Shield, Globe,
  Bell, Volume2, User, CreditCard,
  HelpCircle, Info, ExternalLink, Heart
} from "lucide-react";
import { Label } from "@/components/ui/label";

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  branch: any;
  primaryColor: string;
  token?: string;
}

const SettingsSheet = ({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode,
  branch,
  primaryColor,
  token
}: SettingsSheetProps) => {
  const accentColor = branch?.accent_color || '#10b981';
  
  // Mock settings states
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [language, setLanguage] = useState('English');
  const [currency, setCurrency] = useState('USD');

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div
            className="p-6 border-b"
            style={{
              borderColor: `${primaryColor}20`,
              backgroundColor: `${primaryColor}05`
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-2xl font-bold"
                  style={{ color: primaryColor }}
                >
                  Settings
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Customize your experience
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                style={{ color: primaryColor }}
              >
                <X size={20} />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              {/* User Profile Section */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg" style={{ color: primaryColor }}>Profile</h3>
                <div className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${primaryColor}20` }}>
                  <div className="h-12 w-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}>
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Guest Customer</p>
                    <p className="text-sm text-slate-500">Table: #{token?.split('-')[0] || 'Unknown'}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    Sign In
                  </Button>
                </div>
              </div>

              {/* Preferences Section */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg" style={{ color: primaryColor }}>Preferences</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <div className="flex items-center gap-3">
                      {darkMode ? <Moon className="h-5 w-5" style={{ color: primaryColor }} /> : <Sun className="h-5 w-5" style={{ color: primaryColor }} />}
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Switch between themes
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={darkMode}
                      onCheckedChange={onToggleDarkMode}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5" style={{ color: primaryColor }} />
                      <div>
                        <p className="font-medium">Notifications</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Order updates and promotions
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5" style={{ color: primaryColor }} />
                      <div>
                        <p className="font-medium">Sounds</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Order confirmation sounds
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={sounds}
                      onCheckedChange={setSounds}
                    />
                  </div>
                </div>
              </div>

              {/* Restaurant Info Section */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg" style={{ color: primaryColor }}>Restaurant Info</h3>
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${primaryColor}20` }}
                  >
                    <Phone className="h-5 w-5" style={{ color: primaryColor }} />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {branch?.contact_phone || '+1 (555) 123-4567'}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${primaryColor}20` }}
                  >
                    <Mail className="h-5 w-5" style={{ color: primaryColor }} />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {branch?.email || 'contact@restaurant.com'}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${primaryColor}20` }}
                  >
                    <MapPin className="h-5 w-5" style={{ color: primaryColor }} />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {branch?.address || '123 Restaurant St, City, State 12345'}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${primaryColor}20` }}
                  >
                    <Globe className="h-5 w-5" style={{ color: primaryColor }} />
                    <div>
                      <p className="font-medium">Website</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {branch?.website || 'www.restaurant.com'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support Section */}
              <div className="space-y-4 pt-6 border-t" style={{ borderColor: `${primaryColor}20` }}>
                <h3 className="font-bold text-lg" style={{ color: primaryColor }}>Support</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    <MessageSquare className="mr-3 h-5 w-5" />
                    Contact Support
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    <Shield className="mr-3 h-5 w-5" />
                    Privacy Policy
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    <HelpCircle className="mr-3 h-5 w-5" />
                    Help Center
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    <Info className="mr-3 h-5 w-5" />
                    Terms of Service
                  </Button>
                </div>
              </div>

              {/* App Info */}
              <div className="space-y-4 pt-6 border-t" style={{ borderColor: `${primaryColor}20` }}>
                <h3 className="font-bold text-lg" style={{ color: primaryColor }}>About</h3>
                <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>App Version</span>
                    <span className="font-medium">2.1.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Build Date</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Restaurant ID</span>
                    <span className="font-medium">{branch?.id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Table Number</span>
                    <span className="font-medium">#{token?.split('-')[0] || 'Unknown'}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Rate App
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t" style={{ borderColor: `${primaryColor}20` }}>
            <Button
              variant="outline"
              className="w-full"
              style={{ borderColor: `${primaryColor}50`, color: primaryColor }}
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              Clear All Data
            </Button>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
              © {new Date().getFullYear()} {branch?.branch_name || 'Restaurant'} • All rights reserved
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

import { useState } from 'react';
export default SettingsSheet;