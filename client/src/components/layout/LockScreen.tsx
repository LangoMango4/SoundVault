import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import lockImagePath from "@/assets/image_1743064719669.png";

// PIN for unlocking the screen (only admins can unlock)
const UNLOCK_PIN = "2012";

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPinInput, setShowPinInput] = useState(false);
  const { toast } = useToast();

  const handleUnlockAttempt = async () => {
    if (pin === UNLOCK_PIN) {
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

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <div className="max-w-md w-full px-4">
        <div className="flex flex-col items-center text-center space-y-8">
          <img 
            src={lockImagePath} 
            alt="Locked Screen" 
            className="w-32 h-32 mb-4"
          />
          
          {!showPinInput ? (
            <div className="space-y-6">
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
              
              <p className="text-lg font-medium">
                CONTACT THE OWNER FOR MORE INFORMATION
              </p>
              
              <Button 
                variant="link" 
                onClick={() => setShowPinInput(true)}
                className="mt-8 text-neutral-500 hover:text-neutral-800"
              >
                Admin Unlock
              </Button>
            </div>
          ) : (
            <div className="space-y-4 w-full max-w-xs">
              <div className="flex items-center justify-center gap-2">
                <Lock className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Admin Unlock</h2>
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
                    onClick={() => setShowPinInput(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUnlockAttempt}
                    className="flex-1"
                  >
                    Unlock
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}