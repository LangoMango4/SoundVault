import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import lockScreenImage from "@/assets/security_lock_screen.png";
import websiteDownIcon from "@/assets/website_down_icon.svg";
import { useAuth } from "@/hooks/use-auth";

// PIN for unlocking the screen (only admins can unlock)
const ADMIN_PIN = "2012";
// Admin password for direct unlock
const ADMIN_PASSWORD = "alarms12";

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [showUnlockOptions, setShowUnlockOptions] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleAdminUnlockAttempt = async () => {
    // Double check that user is an admin before proceeding
    if (!isAdmin) {
      setError("You must be an admin to use this feature.");
      return;
    }
    
    if (pin === ADMIN_PIN) {
      try {
        // API request to unlock the screen (server-side)
        await apiRequest("POST", "/api/settings/lock", { locked: false });
        toast({
          title: "Screen Unlocked",
          description: "The website has been unlocked successfully.",
        });
        setPin("");
        setError("");
        onUnlock();
      } catch (error) {
        toast({
          title: "Unlock Failed",
          description: "Failed to unlock the screen. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
    }
  };

  const handleAdminPasswordUnlock = async () => {
    // Double check that user is an admin before proceeding
    if (!isAdmin) {
      setError("You must be an admin to use this feature.");
      return;
    }
    
    if (adminPassword === ADMIN_PASSWORD) {
      try {
        // This doesn't change the global lock state, just unlocks for this admin
        // We don't make an API request to change locked state for everyone
        toast({
          title: "Admin Access Granted",
          description: "The website has been unlocked for your admin session only.",
        });
        setAdminPassword("");
        setError("");
        setShowUnlockOptions(false);
        onUnlock(); // Just unlock the UI for this admin user
      } catch (error) {
        toast({
          title: "Unlock Failed",
          description: "Failed to unlock the screen. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      setError("Incorrect admin password. Please try again.");
      setAdminPassword("");
    }
  };

  // Main lock screen
  if (!showUnlockOptions) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="max-w-xl w-full px-4">
          <div className="flex flex-col items-center text-center">
            {/* Display the Red X and "Website Down" text */}
            <img 
              src={websiteDownIcon} 
              alt="Website Down" 
              className="w-40 h-40 object-contain mb-4"
            />
            <h2 className="text-3xl font-bold text-red-600 mb-8">Website Down</h2>
            
            <div className="flex flex-col gap-3">
              {isAdmin ? (
                <Button 
                  variant="default" 
                  onClick={() => setShowUnlockOptions(true)}
                  className="mt-4"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Admin Unlock Options
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Logout the current user
                    apiRequest("POST", "/api/logout")
                      .then(() => {
                        // Redirect to auth page
                        window.location.href = "/auth";
                      })
                      .catch(error => {
                        toast({
                          title: "Logout Failed",
                          description: "Failed to log out. Please try again.",
                          variant: "destructive",
                        });
                      });
                  }}
                  className="mt-2"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Logout (Change User)
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin-only unlock options screen
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <div className="max-w-xl w-full px-4"> {/* Increased from max-w-md to max-w-xl */}
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Lock icon with fixed dimensions, increased size */}
          <div className="w-48 h-48 flex items-center justify-center"> {/* Increased from w-32 h-32 to w-48 h-48 */}
            <img 
              src={lockScreenImage} 
              alt="Locked Screen" 
              className="object-contain max-w-full max-h-full"
            />
          </div>
          
          <div className="space-y-4 w-full max-w-xl">
            <Tabs 
              defaultValue="pin" 
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="pin">
                  <Lock className="mr-2 h-4 w-4" />
                  Unlock for Everyone
                </TabsTrigger>
                <TabsTrigger value="password">
                  <Key className="mr-2 h-4 w-4" />
                  Unlock for Admins Only
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pin" className="space-y-4">
                <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="text-amber-800 text-sm">
                      <p className="font-medium">Global Unlock - Admin Access Required</p>
                      <p>
                        Enter the admin PIN to permanently unlock the website for ALL users.
                        This will remove the lock for everyone.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Input
                      type="password"
                      maxLength={4}
                      placeholder="Enter 4-digit PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="text-center"
                    />
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowUnlockOptions(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAdminUnlockAttempt}
                      className="flex-1"
                    >
                      Unlock with PIN
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="password" className="space-y-4">
                <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-800 text-sm">
                      <p className="font-medium">Admin Only Access</p>
                      <p>
                        Enter the admin password to unlock the screen for your session only. 
                        The website will remain locked for other users.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Input
                      type="password"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="text-center"
                    />
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowUnlockOptions(false);
                        setError("");
                        setAdminPassword("");
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAdminPasswordUnlock}
                      className="flex-1"
                    >
                      Unlock with Password
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}