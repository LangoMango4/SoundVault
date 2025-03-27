import { useState } from "react";
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
import { Lock, Unlock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// PIN for unlocking the screen (only admins can lock/unlock)
const UNLOCK_PIN = "2012";

interface ScreenLockControlProps {
  isLocked: boolean;
  onLockChange: (locked: boolean) => void;
}

export function ScreenLockControl({ isLocked, onLockChange }: ScreenLockControlProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleLockScreen = async () => {
    try {
      // API request to lock the screen (server-side)
      await apiRequest("POST", "/api/settings/lock", { locked: true });
      
      // Clear any temporary unlock that might be in this session
      sessionStorage.removeItem('temporaryUnlock');
      
      onLockChange(true);
      setIsDialogOpen(false);
      toast({
        title: "Screen Locked",
        description: "The website has been locked for all users successfully.",
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

  const handleUnlockAttempt = async () => {
    if (pin === UNLOCK_PIN) {
      try {
        // API request to unlock the screen (server-side)
        await apiRequest("POST", "/api/settings/lock", { locked: false });
        onLockChange(false);
        setIsDialogOpen(false);
        setPin("");
        setError("");
        toast({
          title: "Screen Unlocked",
          description: "The website has been unlocked successfully.",
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
            {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            <span>Screen Lock</span>
          </div>
          <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
            {isLocked ? "LOCKED" : "UNLOCKED"}
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
            <div className="space-y-2">
              <Label htmlFor="pin">Enter 4-digit PIN</Label>
              <Input
                id="pin"
                type="password"
                maxLength={4}
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUnlockAttempt}>
                Unlock
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
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleLockScreen}>
                Lock Screen
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}