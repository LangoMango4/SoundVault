import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUpdateNotification } from "@/hooks/use-update-notification";

interface TermsAndConditionsDialogProps {
  open: boolean;
  onAccept: () => void;
}

export function TermsAndConditionsDialog({ open, onAccept }: TermsAndConditionsDialogProps) {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();
  const { currentVersionDetails } = useUpdateNotification();
  
  const handleAccept = async () => {
    if (!acceptTerms) return;
    
    setIsLogging(true);
    
    try {
      // Log acceptance of terms & conditions
      await apiRequest('POST', '/api/terms/accept', {
        version: currentVersionDetails.title
      });
      
      // Call the original onAccept function
      onAccept();
    } catch (error) {
      console.error('Failed to log terms acceptance:', error);
      toast({
        title: 'Warning',
        description: 'Continued with a problem logging your terms acceptance.',
        variant: 'default',
      });
      // Still allow the user to continue despite logging error
      onAccept();
    } finally {
      setIsLogging(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(open) => {
      // Only allow closing after accepting terms
      if (!open && acceptTerms) {
        handleAccept();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            Terms & Conditions
          </DialogTitle>
          <DialogDescription>
            Please read and accept the following terms before continuing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="border rounded-md p-4 bg-muted/30 space-y-4 my-4">
          <div className="text-sm space-y-3 max-h-[200px] overflow-y-auto p-2">
            <p>
              By using this website, you are agreeing to the following terms and conditions:
            </p>
            
            <p>
              <span className="font-semibold">Disclaimer of Responsibility:</span> The creator of this website is not responsible for any consequences, disciplinary actions, or trouble you may face for using this website during class time or in violation of school policies.
            </p>
            
            <p>
              <span className="font-semibold">Usage Guidelines:</span> This website is intended for educational and entertainment purposes only. The "Teacher Inbound" feature is provided as a convenience and does not guarantee you won't be caught using the site.
            </p>
            
            <p>
              <span className="font-semibold">Privacy & Data:</span> Any data or scores saved on this website may be reset at any time without notice. We do not guarantee the preservation of your game progress or high scores.
            </p>
            
            <p>
              <span className="font-semibold">Inactivity Policy:</span> For security reasons, you will be automatically logged out after 10 minutes of inactivity. This helps protect your account if you forget to log out.
            </p>
            
            <p>
              <span className="font-semibold">Emergency Shortcuts:</span> The emergency shortcut is Escape + T which will quickly navigate away from this site to your school's homepage.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 pt-3">
          <Checkbox 
            id="terms" 
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked === true)}
          />
          <Label htmlFor="terms" className="text-sm font-medium">
            I understand and accept that I am using this site at my own risk
          </Label>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleAccept} 
            disabled={!acceptTerms || isLogging}
            className="w-full"
          >
            {isLogging ? 'Logging Acceptance...' : 'Accept and Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
