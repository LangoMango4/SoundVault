import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, Key, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import lockScreenImage from "@/assets/website_locked.svg";
import { useAuth } from "@/hooks/use-auth";

// PIN for unlocking the screen (only admins can unlock)
const ADMIN_PIN = "2012";

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [error, setError] = useState("");
  const [showUnlockOptions, setShowUnlockOptions] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  // Fetch lock status and reason when component mounts
  useEffect(() => {
    const fetchLockStatus = async () => {
      try {
        const response = await fetch('/api/settings/lock');
        const data = await response.json();
        if (data.reason) {
          setLockReason(data.reason);
        }
      } catch (error) {
        console.error('Failed to fetch lock status:', error);
      }
    };
    
    fetchLockStatus();
  }, []);

  const handleAdminUnlockAttempt = async () => {
    // Double check that user is an admin before proceeding
    if (!isAdmin) {
      setError("You must be an admin to use this feature.");
      return;
    }
    
    if (pin === ADMIN_PIN) {
      try {
        // API request to unlock the screen for everyone using the dedicated endpoint
        await apiRequest("POST", "/api/settings/lock/unlock-all", { pin: ADMIN_PIN });
        
        // Clear any temporary unlock flag when doing a global unlock
        sessionStorage.removeItem('temporaryUnlock');
        
        toast({
          title: "Screen Unlocked",
          description: "The website has been unlocked successfully for everyone.",
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

  const handleAdminOnlyUnlock = async () => {
    // Double check that user is an admin before proceeding
    if (!isAdmin) {
      setError("You must be an admin to use this feature.");
      return;
    }
    
    if (adminPin === ADMIN_PIN) {
      try {
        // This doesn't change the global lock state, just unlocks for this admin
        // We don't make an API request to change locked state for everyone
        
        // Store in sessionStorage that this is a temporary admin-only unlock
        sessionStorage.setItem('temporaryUnlock', 'true');
        
        toast({
          title: "Admin Access Granted",
          description: "The website has been unlocked for your admin session only.",
        });
        setAdminPin("");
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
      setError("Incorrect PIN. Please try again.");
      setAdminPin("");
    }
  };

  // Main lock screen
  if (!showUnlockOptions) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="max-w-xl w-full px-4"> {/* Increased from max-w-md to max-w-xl */}
          <div className="flex flex-col items-center text-center">
            {/* Display the image which already contains the lock icon and text */}
            <img 
              src={lockScreenImage} 
              alt="Locked Screen" 
              className="w-full max-w-xl object-contain mb-4" /* Made image larger with max-w-xl instead of max-w-md */
            />
            
            {lockReason && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 w-full max-w-md">
                <p className="text-amber-800 font-medium text-sm">Reason for lock:</p>
                <p className="text-amber-900">{lockReason}</p>
              </div>
            )}
            
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
                  <LogOut className="mr-2 h-4 w-4" />
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
          
          {lockReason && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-2 w-full max-w-md">
              <p className="text-amber-800 font-medium text-sm">Reason for lock:</p>
              <p className="text-amber-900">{lockReason}</p>
            </div>
          )}
          
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
                        Enter the admin PIN to unlock the screen for your session only. 
                        The website will remain locked for other users.
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
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
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
                        setAdminPin("");
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAdminOnlyUnlock}
                      className="flex-1"
                    >
                      Unlock with PIN
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