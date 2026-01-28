import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  X, Sun, Moon, Phone, Mail,
  MapPin, Shield, Globe,
  User, Info, ExternalLink, Heart,
  Facebook, Send, Video, FileText
} from "lucide-react";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [viewingDoc, setViewingDoc] = useState<{ title: string; content: string } | null>(null);

  // Safely parse social links if string
  let socialLinks: any = {};
  try {
    socialLinks = typeof branch?.social_links === 'string'
      ? JSON.parse(branch.social_links)
      : (branch?.social_links || {});
  } catch (e) {
    console.error("Failed to parse social links", e);
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 [&>button]:hidden">
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
              <div className="space-y-8 mb-6">
                {/* User Profile Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg" style={{ color: primaryColor }}>Profile</h3>
                  <div className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${primaryColor}20` }}>
                    <div className="h-14 w-14 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: primaryColor }}>
                      <User className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-lg leading-tight truncate">Guest Customer</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-slate-500">Table</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          #{branch?.table_number || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preferences Section */}
                <div className="space-y-4">
                  <h3 className="font-bold text-lg" style={{ color: primaryColor }}>Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl"
                      style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${primaryColor}20` }}>
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
                        className="
                          data-[state=checked]:bg-slate-300
                          data-[state=unchecked]:bg-slate-300
                        "
                      />
                    </div>

                    {/* Restaurant Info Section */}
                    <div className="space-y-4 pt-4">
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
                              {branch?.contact_phone || '(+855) 12 345 678'}
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
                              {branch?.contact_email || 'contact@restaurant.com'}
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
                              {branch?.location || '123 Restaurant St, City, State 12345'}
                            </p>
                          </div>
                        </div>
                        {branch?.website && (
                          <div
                            className="flex items-center gap-3 p-3 rounded-lg"
                            style={{ backgroundColor: `${primaryColor}05`, border: `1px solid ${primaryColor}20` }}
                          >
                            <Globe className="h-5 w-5" style={{ color: primaryColor }} />
                            <div>
                              <p className="font-medium">Website</p>
                              <a href={branch.website} target="_blank" rel="noreferrer" className="text-sm text-slate-600 dark:text-slate-300 hover:underline">
                                {branch.website}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Legal / Support Section */}
                    {(branch?.is_tos_visible || branch?.is_privacy_visible) && (
                      <div className="space-y-4 pt-6 border-t" style={{ borderColor: `${primaryColor}20` }}>
                        <h3 className="font-bold text-lg" style={{ color: primaryColor }}>Legal</h3>
                        <div className="space-y-2">
                          {branch?.is_tos_visible && (
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              style={{ borderColor: primaryColor, color: primaryColor }}
                              onClick={() => setViewingDoc({ title: 'Terms of Service', content: branch?.terms_of_service || 'No content available.' })}
                            >
                              <FileText className="mr-3 h-5 w-5" />
                              Terms of Service
                            </Button>
                          )}
                          {branch?.is_privacy_visible && (
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              style={{ borderColor: primaryColor, color: primaryColor }}
                              onClick={() => setViewingDoc({ title: 'Privacy Policy', content: branch?.privacy_policy || 'No content available.' })}
                            >
                              <Shield className="mr-3 h-5 w-5" />
                              Privacy Policy
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* About Section */}
                    {branch?.is_about_visible && (
                      <div className="space-y-4 pt-6 border-t" style={{ borderColor: `${primaryColor}20` }}>
                        <h3 className="font-bold text-lg" style={{ color: primaryColor }}>About</h3>

                        {branch?.about_description ? (
                          <div
                            className="text-sm text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: branch.about_description }}
                          />
                        ) : (
                          <p className="text-sm text-slate-500 italic">No description available.</p>
                        )}

                        <div className="flex flex-wrap gap-2 pt-2">
                          {/* Social Icons */}
                          {socialLinks.facebook && (
                            <a href={socialLinks.facebook} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="icon" style={{ borderColor: primaryColor, color: primaryColor }}>
                                <svg fill="currentColor" className="h-4 w-4" viewBox="-7 -2 24 24" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin" class="jam jam-facebook"><path d='M2.046 3.865v2.748H.032v3.36h2.014v9.986H6.18V9.974h2.775s.26-1.611.386-3.373H6.197V4.303c0-.343.45-.805.896-.805h2.254V0H6.283c-4.34 0-4.237 3.363-4.237 3.865z' /></svg>
                              </Button>
                            </a>
                          )}
                          {socialLinks.telegram && (
                            <a href={socialLinks.telegram} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="icon" style={{ borderColor: primaryColor, color: primaryColor }}>
                                <svg xmlns="http://www.w3.org/2000/svg" className='h-4 w-4' viewBox="0 0 48 48" fill="currentColor"><path d="M41.4193 7.30899C41.4193 7.30899 45.3046 5.79399 44.9808 9.47328C44.8729 10.9883 43.9016 16.2908 43.1461 22.0262L40.5559 39.0159C40.5559 39.0159 40.3401 41.5048 38.3974 41.9377C36.4547 42.3705 33.5408 40.4227 33.0011 39.9898C32.5694 39.6652 24.9068 34.7955 22.2086 32.4148C21.4531 31.7655 20.5897 30.4669 22.3165 28.9519L33.6487 18.1305C34.9438 16.8319 36.2389 13.8019 30.8426 17.4812L15.7331 27.7616C15.7331 27.7616 14.0063 28.8437 10.7686 27.8698L3.75342 25.7055C3.75342 25.7055 1.16321 24.0823 5.58815 22.459C16.3807 17.3729 29.6555 12.1786 41.4193 7.30899Z" /></svg>
                              </Button>
                            </a>
                          )}
                          {socialLinks.tiktok && (
                            <a href={socialLinks.tiktok} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="icon" style={{ borderColor: primaryColor, color: primaryColor }}>
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 512 512" id="icons" xmlns="http://www.w3.org/2000/svg"><path d="M412.19,118.66a109.27,109.27,0,0,1-9.45-5.5,132.87,132.87,0,0,1-24.27-20.62c-18.1-20.71-24.86-41.72-27.35-56.43h.1C349.14,23.9,350,16,350.13,16H267.69V334.78c0,4.28,0,8.51-.18,12.69,0,.52-.05,1-.08,1.56,0,.23,0,.47-.05.71,0,.06,0,.12,0,.18a70,70,0,0,1-35.22,55.56,68.8,68.8,0,0,1-34.11,9c-38.41,0-69.54-31.32-69.54-70s31.13-70,69.54-70a68.9,68.9,0,0,1,21.41,3.39l.1-83.94a153.14,153.14,0,0,0-118,34.52,161.79,161.79,0,0,0-35.3,43.53c-3.48,6-16.61,30.11-18.2,69.24-1,22.21,5.67,45.22,8.85,54.73v.2c2,5.6,9.75,24.71,22.38,40.82A167.53,167.53,0,0,0,115,470.66v-.2l.2.2C155.11,497.78,199.36,496,199.36,496c7.66-.31,33.32,0,62.46-13.81,32.32-15.31,50.72-38.12,50.72-38.12a158.46,158.46,0,0,0,27.64-45.93c7.46-19.61,9.95-43.13,9.95-52.53V176.49c1,.6,14.32,9.41,14.32,9.41s19.19,12.3,49.13,20.31c21.48,5.7,50.42,6.9,50.42,6.9V131.27C453.86,132.37,433.27,129.17,412.19,118.66Z" /></svg>
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t" style={{ borderColor: `${primaryColor}20` }}>
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
          </div>
        </SheetContent>
      </Sheet>

      {/* Document Viewer Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.title}</DialogTitle>
          </DialogHeader>
          <div
            className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: viewingDoc?.content || '' }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SettingsSheet;