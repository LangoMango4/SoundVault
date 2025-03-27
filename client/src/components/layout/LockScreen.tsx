import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import lockScreenImage from "@/assets/new_lock_screen.png";
import { useAuth } from "@/hooks/use-auth";

// We'll use the browser's sessionStorage API for temporary unlocks

// PIN for unlocking the screen (only admins can unlock)
const ADMIN_PIN = "2012";

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showUnlockOptions, setShowUnlockOptions] = useState(false);
  const [activeTab, setActiveTab] = useState("everyone");
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  // If user tries to access admin tab but is not an admin, switch to everyone tab
  useEffect(() => {
    if (activeTab === "admin" && !isAdmin) {
      setActiveTab("everyone");
    }
  }, [activeTab, isAdmin]);

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
  
  const handleTemporaryUnlock = () => {
    // For "Unlock for Me", we only unlock locally for this user
    // We don't make any server API calls - this way it only affects this user's session
    
    // Set the session storage flag to indicate this user has temporarily unlocked
    sessionStorage.setItem('temporaryUnlock', 'true');
    
    toast({
      title: "Temporarily Unlocked",
      description: "The site is unlocked just for you. Other users will still see it as locked.",
    });
    
    // Call the onUnlock callback to hide the lock screen for this user
    onUnlock();
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
              className="w-full max-w-xl object-contain mb-8" /* Made image larger with max-w-xl instead of max-w-md */
            />
            
            <Button 
              variant="default" 
              onClick={() => setShowUnlockOptions(true)}
              className="mt-4"
            >
              <Lock className="mr-2 h-4 w-4" />
              Unlock Options
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Unlock options screen
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
              defaultValue="everyone" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className={`grid ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'} mb-4`}>
                <TabsTrigger value="everyone">
                  <User className="mr-2 h-4 w-4" />
                  Unlock for Me
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="admin">
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin Unlock
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="everyone" className="space-y-4">
                <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-800 text-sm">
                      <p className="font-medium">Temporary Unlock</p>
                      <p>
                        This will unlock the screen for you temporarily. The site will remain locked for other users until an admin unlocks it permanently.
                      </p>
                    </div>
                  </div>
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
                    onClick={handleTemporaryUnlock}
                    className="flex-1"
                  >
                    Unlock for Me
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="admin" className="space-y-4">
                <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="text-amber-800 text-sm">
                      <p className="font-medium">Admin Access Required</p>
                      <p>
                        Enter the admin PIN to permanently unlock the website for all users. Only administrators have this access.
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
                      Permanently Unlock
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