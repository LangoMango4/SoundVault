import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import lockScreenImage from "@/assets/image_1743065278492.png";
import { useAuth } from "@/hooks/use-auth";

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
  
  const handleEveryoneUnlock = async () => {
    try {
      // This will fail for regular users as the API requires admin access
      // But we'll handle the error and simulate unlocking for the demo
      await apiRequest("POST", "/api/settings/lock", { locked: false });
      onUnlock();
    } catch (error) {
      // For a regular user, we just close the lock screen locally
      // without actually unlocking the server-side lock
      // In a real app, we would have a separate endpoint for regular users
      onUnlock();
    }
  };

  // Main lock screen
  if (!showUnlockOptions) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <div className="max-w-md w-full px-4">
          <div className="flex flex-col items-center text-center">
            {/* Lock screen image with fixed dimensions to prevent stretching */}
            <div className="w-64 h-64 flex items-center justify-center">
              <img 
                src={lockScreenImage} 
                alt="Locked Screen" 
                className="object-contain max-w-full max-h-full"
              />
            </div>
            
            <div className="space-y-6 mt-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">
                  THIS WEBSITE HAS BEEN LOCKED
                </h1>
                <h2 className="text-2xl font-bold">
                  BY THE WEBSITE OWNER
                </h2>
                <p className="text-xl mt-4">
                  OR THE WEBSITE IS DOWN FOR MAINTENANCE
                </p>
              </div>
              
              <Button 
                variant="default" 
                onClick={() => setShowUnlockOptions(true)}
                className="mt-8"
              >
                <Lock className="mr-2 h-4 w-4" />
                Unlock Options
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unlock options screen
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <div className="max-w-md w-full px-4">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Lock icon with fixed dimensions */}
          <div className="w-32 h-32 flex items-center justify-center">
            <img 
              src={lockScreenImage} 
              alt="Locked Screen" 
              className="object-contain max-w-full max-h-full"
            />
          </div>
          
          <div className="space-y-4 w-full max-w-md">
            <Tabs 
              defaultValue="everyone" 
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="everyone">
                  <User className="mr-2 h-4 w-4" />
                  Everyone Unlock
                </TabsTrigger>
                <TabsTrigger value="admin" disabled={!isAdmin}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin Unlock
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="everyone" className="space-y-4">
                <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-800 text-sm">
                      <p className="font-medium">Regular User Unlock</p>
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
                    onClick={handleEveryoneUnlock}
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
                      Unlock for All
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