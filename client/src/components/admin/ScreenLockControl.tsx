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
import { Lock, Unlock, ShieldCheck, Users, Wifi, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import lockScreenImage from "@/assets/website_locked.svg";

// PIN for unlocking the screen (only admins can lock/unlock)
const UNLOCK_PIN = "2012";

interface ScreenLockControlProps {
  isLocked: boolean;
  onLockChange: (locked: boolean) => void;
}

export function ScreenLockControl({ isLocked, onLockChange }: ScreenLockControlProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [lockReason, setLockReason] = useState("");
  const [error, setError] = useState("");
  const [adminOnlyUnlock, setAdminOnlyUnlock] = useState(false);
  const { toast } = useToast();
  
  // Check for admin-only unlock status on component mount
  useEffect(() => {
    const tempUnlock = sessionStorage.getItem('temporaryUnlock');
    setAdminOnlyUnlock(tempUnlock === 'true');
  }, []);

  const handleLockScreen = async () => {
    try {
      // API request to lock the screen (server-side) with reason
      await apiRequest("POST", "/api/settings/lock", { 
        locked: true,
        reason: lockReason.trim() || null 
      });
      
      // Clear any temporary unlock that might be in this session
      sessionStorage.removeItem('temporaryUnlock');
      
      onLockChange(true);
      setIsDialogOpen(false);
      toast({
        title: "Screen Locked",
        description: `The website has been locked for all users successfully${lockReason ? ` with reason: ${lockReason}` : ''}.`,
        variant: "default",
      });
      
      // Reset reason after locking
      setLockReason("");
    } catch (error) {
      toast({
        title: "Lock Failed",
        description: "Failed to lock the screen. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnlockAttempt = async () => {
    if (pin === UNLOCK_PIN) {
      try {
        // API request to unlock the screen for everyone using the dedicated endpoint
        await apiRequest("POST", "/api/settings/lock/unlock-all", { pin: UNLOCK_PIN });
        
        // Clear any temporary unlock flag
        sessionStorage.removeItem('temporaryUnlock');
        
        onLockChange(false);
        setIsDialogOpen(false);
        setPin("");
        setError("");
        setAdminOnlyUnlock(false);
        
        toast({
          title: "Screen Unlocked",
          description: "The website has been unlocked successfully for everyone.",
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
  
  // Function to unlock for admin only (using temporary unlock)
  const handleAdminOnlyUnlock = async () => {
    if (pin === UNLOCK_PIN) {
      try {
        // This is the admin-only unlock - we don't change the global lock state
        // Just set the session storage flag for this admin session
        sessionStorage.setItem('temporaryUnlock', 'true');
        
        onLockChange(false); // Update UI state for this admin
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 w-full justify-between"
        >
          <div className="flex items-center gap-2">
            {isLocked ? <WifiOff className="h-4 w-4" /> : 
             (adminOnlyUnlock ? <ShieldCheck className="h-4 w-4" /> : <Wifi className="h-4 w-4" />)}
            <span>Screen Lock</span>
          </div>
          <span className={`text-xs ${adminOnlyUnlock ? "bg-blue-100 text-blue-800" : "bg-neutral-100"} px-2 py-1 rounded`}>
            {isLocked ? "LOCKED" : 
             (adminOnlyUnlock ? "ADMIN ONLY" : "UNLOCKED")}
          </span>
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLocked ? "Unlock Screen" : "Lock Screen"}
          </DialogTitle>
          <DialogDescription>
            {isLocked 
              ? "Enter the 4-digit PIN to unlock the website."
              : "Lock the website to prevent unauthorized access. Only admins with the PIN can unlock it."
            }
          </DialogDescription>
        </DialogHeader>
        
        {isLocked ? (
          <div className="space-y-4">
            <div className="rounded-md bg-amber-50 p-4 border border-amber-200 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-amber-800 text-sm">
                  <p className="font-medium">Global Unlock</p>
                  <p>
                    Enter the admin PIN to permanently unlock the website for ALL users.
                    This will remove the lock for everyone.
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
                    handleUnlockAttempt();
                  }
                }}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleAdminOnlyUnlock}
                className="w-full sm:w-auto"
              >
                <Wifi className="mr-2 h-4 w-4" />
                Unlock for Admin Only
              </Button>
              <Button 
                onClick={handleUnlockAttempt}
                className="w-full sm:w-auto"
              >
                <Wifi className="mr-2 h-4 w-4" />
                Unlock for Everyone
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="text-yellow-800">
                  <p className="font-medium">Warning</p>
                  <p className="text-sm">
                    Locking the screen will make the website inaccessible to all users until an admin unlocks it with the PIN.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lockReason">Reason (optional)</Label>
              <Input
                id="lockReason"
                type="text"
                placeholder="e.g., testing, maintenance, teacher nearby"
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Provide a reason for locking the screen. This will be visible when an admin unlocks the screen.
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleLockScreen}>
                <WifiOff className="mr-2 h-4 w-4" />
                Lock Screen
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}