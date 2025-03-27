import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, ShieldCheck, Users, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import lockScreenImage from "@/assets/new_lock_screen_image.png";

// PIN for unlocking the screen (only admins can lock/unlock)
const UNLOCK_PIN = "2012";

interface ScreenLockControlProps {
  isLocked: boolean;
  onLockChange: (locked: boolean) => void;
}

export function ScreenLockControl({ isLocked, onLockChange }: ScreenLockControlProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [globalUnlockPin, setGlobalUnlockPin] = useState("");
  const [error, setError] = useState("");
  const [globalUnlockError, setGlobalUnlockError] = useState("");
  const [adminOnlyUnlock, setAdminOnlyUnlock] = useState(false);
  const { toast } = useToast();
  
  // Check for admin-only unlock status on component mount
  useEffect(() => {
    const tempUnlock = sessionStorage.getItem('temporaryUnlock');
    setAdminOnlyUnlock(tempUnlock === 'true');
  }, []);

  const handleLockScreen = async () => {
    try {
      // API request to lock the screen (server-side)
      await apiRequest("POST", "/api/settings/lock", { locked: true });
      
      // This will automatically set the session to 'temporaryUnlock' mode
      // so the admin can still access the site but other users can't
      sessionStorage.setItem('temporaryUnlock', 'true');
      
      onLockChange(false); // Keep it unlocked for the admin
      setAdminOnlyUnlock(true);
      setIsDialogOpen(false);
      toast({
        title: "Screen Locked",
        description: "The website has been locked for all users. You still have access as admin.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Lock Failed",
        description: "Failed to lock the screen. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdminUnlockAttempt = async () => {
    if (pin === UNLOCK_PIN) {
      try {
        // This is the admin-only unlock - we just set the session storage
        // and keep the global lock state as is
        sessionStorage.setItem('temporaryUnlock', 'true');
        
        // We don't change the global lock state, just enable it for this admin
        onLockChange(false);
        setAdminOnlyUnlock(true);
        setIsDialogOpen(false);
        setPin("");
        setError("");
        toast({
          title: "Admin Access Granted",
          description: "The website has been unlocked for your admin session only.",
          variant: "default",
        });
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

  const handleGlobalUnlockAttempt = async () => {
    if (globalUnlockPin === UNLOCK_PIN) {
      try {
        // API request to unlock the screen (server-side)
        await apiRequest("POST", "/api/settings/lock", { locked: false });
        
        // Clear any temporary unlock flag when doing a global unlock
        sessionStorage.removeItem('temporaryUnlock');
        
        onLockChange(false);
        setAdminOnlyUnlock(false);
        setIsDialogOpen(false);
        setGlobalUnlockPin("");
        setGlobalUnlockError("");
        toast({
          title: "Screen Unlocked",
          description: "The website has been unlocked for ALL users.",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Unlock Failed",
          description: "Failed to unlock the screen. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      setGlobalUnlockError("Incorrect PIN. Please try again.");
      setGlobalUnlockPin("");
    }
  };

  // Content for when the screen is not locked but in admin-only mode
  const AdminOnlyModeContent = () => (
    <div className="space-y-6">
      <Alert variant="info" className="border-blue-300 bg-blue-50">
        <ShieldCheck className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-700">Admin-Only Mode Active</AlertTitle>
        <AlertDescription className="text-blue-600">
          You have special access as an admin. Other users see the lock screen.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center justify-center mb-4">
            <img 
              src={lockScreenImage} 
              alt="Lock Screen Preview" 
              className="h-32 object-contain rounded-md"
            />
          </div>
          <p className="text-sm text-gray-600 text-center mb-4">
            This is what other users currently see
          </p>
        </div>

        <div className="w-full space-y-4 mt-6">
          <div className="rounded-md bg-amber-50 p-3 border border-amber-200">
            <div className="flex items-start gap-2">
              <div className="text-amber-800 text-sm">
                <p className="font-medium text-base">Global Unlock</p>
                <p>
                  Enter the admin PIN to permanently unlock the website for ALL users.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="globalPin">Enter 4-digit PIN</Label>
            <Input
              id="globalPin"
              type="password"
              maxLength={4}
              placeholder="Enter PIN"
              value={globalUnlockPin}
              onChange={(e) => setGlobalUnlockPin(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleGlobalUnlockAttempt();
                }
              }}
            />
            {globalUnlockError && <p className="text-sm text-destructive">{globalUnlockError}</p>}
          </div>
          
          <Button 
            onClick={handleGlobalUnlockAttempt}
            className="w-full"
          >
            <Users className="mr-2 h-4 w-4" />
            Unlock for Everyone
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {isLocked ? <Lock className="h-4 w-4" /> : 
             (adminOnlyUnlock ? <ShieldCheck className="h-4 w-4" /> : <Unlock className="h-4 w-4" />)}
            <span>Screen Lock</span>
          </div>
          <span className={`text-xs ${adminOnlyUnlock ? "bg-blue-100 text-blue-800" : isLocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"} px-2 py-1 rounded`}>
            {isLocked ? "LOCKED" : 
             (adminOnlyUnlock ? "ADMIN ONLY" : "UNLOCKED")}
          </span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isLocked ? "Unlock Screen" : adminOnlyUnlock ? "Screen Lock Controls" : "Lock Screen"}
          </DialogTitle>
          <DialogDescription>
            {isLocked 
              ? "Enter the 4-digit PIN to unlock the website for your admin session."
              : adminOnlyUnlock 
                ? "Manage the lock screen settings. You have special admin access."
                : "Lock the website to prevent unauthorized access. Only admins with the PIN can unlock it."
            }
          </DialogDescription>
        </DialogHeader>
        
        {isLocked ? (
          <div className="space-y-4">
            <div className="rounded-md bg-blue-50 p-4 border border-blue-200 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-800 text-sm">
                  <p className="font-medium">Admin Access</p>
                  <p>
                    Enter the admin PIN to temporarily unlock the website for your admin session only.
                    The website will remain locked for all other users.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pin">Enter 4-digit PIN</Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAdminUnlockAttempt();
                  }
                }}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdminUnlockAttempt}>
                <Key className="mr-2 h-4 w-4" />
                Unlock for Admin Only
              </Button>
            </DialogFooter>
          </div>
        ) : adminOnlyUnlock ? (
          <AdminOnlyModeContent />
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="text-yellow-800">
                  <p className="font-medium">Warning</p>
                  <p className="text-sm">
                    Locking the screen will make the website inaccessible to regular users.
                    You will still have access as an admin.
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleLockScreen}>
                <Lock className="mr-2 h-4 w-4" />
                Lock Screen
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}