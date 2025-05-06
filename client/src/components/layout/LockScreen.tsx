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
      <div className="fixed inset-0 bg-slate-200 flex flex-col items-center justify-center z-50">
        <div className="max-w-xl w-full px-4"> 
          <div className="flex flex-col items-center text-center">
            {/* Windows-style error dialog */}
            <div className="bg-white border border-gray-300 shadow-md w-full max-w-xl">
              {/* Title bar */}
              <div className="bg-red-600 text-white p-1.5 flex justify-between items-center">
                <div>
                  <span className="text-sm font-medium">System Administrator</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">?</span>
                  <span className="text-lg leading-none">×</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0">
                    <svg className="text-yellow-500 h-14 w-14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor"/>
                      <path d="M13 8L13 13" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                      <path d="M13 16L13 17" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base mb-2">You are not authorized to access this website</p>
                    <p className="text-base mb-4">This website has been locked by the administrator</p>
                    
                    {lockReason && (
                      <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                        <p className="text-amber-800 font-medium text-sm">Reason for lock:</p>
                        <p className="text-amber-900">{lockReason}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  {isAdmin ? (
                    <Button 
                      className="bg-blue-100 border border-blue-300 px-4 py-1 text-sm hover:bg-blue-200 rounded-none"
                      onClick={() => setShowUnlockOptions(true)}
                    >
                      Admin Unlock
                    </Button>
                  ) : (
                    <Button 
                      className="bg-blue-100 border border-blue-300 px-4 py-1 text-sm hover:bg-blue-200 rounded-none"
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
                    >
                      Change User
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin-only unlock options screen
  return (
    <div className="fixed inset-0 bg-slate-200 flex flex-col items-center justify-center z-50">
      <div className="max-w-xl w-full px-4">
        <div className="flex flex-col items-center text-center">
          <div className="bg-white border border-gray-300 shadow-md w-full max-w-xl">
            {/* Title bar */}
            <div className="bg-red-600 text-white p-1.5 flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">System Administrator - Unlock Options</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">?</span>
                <span 
                  className="text-lg leading-none cursor-pointer"
                  onClick={() => setShowUnlockOptions(false)}
                >×</span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <Tabs defaultValue="pin" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="pin" className="rounded-none">
                      <Lock className="mr-2 h-4 w-4" />
                      Unlock for Everyone
                    </TabsTrigger>
                    <TabsTrigger value="password" className="rounded-none">
                      <Key className="mr-2 h-4 w-4" />
                      Admin-Only Access
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pin" className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <svg className="text-yellow-500 h-12 w-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor"/>
                          <path d="M13 8L13 13" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                          <path d="M13 16L13 17" stroke="black" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-base mb-2">Global Unlock - Admin Access Required</p>
                        <p className="text-sm mb-4 text-gray-700">
                          Enter the admin PIN to permanently unlock the website for ALL users.
                          This will remove the lock for everyone.
                        </p>
                        
                        {lockReason && (
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                            <p className="text-amber-800 font-medium text-sm">Reason for lock:</p>
                            <p className="text-amber-900">{lockReason}</p>
                          </div>
                        )}
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
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          className="bg-blue-100 border border-blue-300 px-4 py-1 text-sm hover:bg-blue-200 rounded-none"
                          onClick={() => setShowUnlockOptions(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="bg-blue-100 border border-blue-300 px-4 py-1 text-sm hover:bg-blue-200 rounded-none"
                          onClick={handleAdminUnlockAttempt}
                        >
                          Unlock
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="password" className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <ShieldCheck className="h-12 w-12 text-blue-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-base mb-2">Admin Only Access</p>
                        <p className="text-sm mb-4 text-gray-700">
                          Enter the admin PIN to unlock the screen for your session only. 
                          The website will remain locked for other users.
                        </p>
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
                        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          className="bg-blue-100 border border-blue-300 px-4 py-1 text-sm hover:bg-blue-200 rounded-none"
                          onClick={() => {
                            setShowUnlockOptions(false);
                            setError("");
                            setAdminPin("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          className="bg-blue-100 border border-blue-300 px-4 py-1 text-sm hover:bg-blue-200 rounded-none"
                          onClick={handleAdminOnlyUnlock}
                        >
                          Unlock
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}