import { useState, useRef, useEffect } from 'react';
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
import { Shield, ArrowDown } from "lucide-react";
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
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const termsContentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { currentVersionDetails } = useUpdateNotification();
  
  // Effect to reset scroll status when dialog opens
  useEffect(() => {
    if (open) {
      setHasScrolledToBottom(false);
      setAcceptTerms(false);
    }
  }, [open]);
  
  // Handle scrolling in the terms content
  const handleScroll = () => {
    if (!termsContentRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = termsContentRef.current;
    const bottomThreshold = scrollHeight - clientHeight;
    
    // Check if user has scrolled to bottom (with a small threshold for rounding errors)
    if (scrollTop >= (bottomThreshold - 5)) {
      setHasScrolledToBottom(true);
    }
  };
  
  const handleAccept = async () => {
    if (!acceptTerms) return;
    
    setIsLogging(true);
    
    try {
      // Log acceptance of terms & conditions
      await apiRequest('POST', '/api/terms/accept', {
        version: currentVersionDetails.title,
        method: 'web'
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
          <div className="text-xs text-muted-foreground mt-1">
            Last Updated: May 6, 2025
          </div>
          <DialogDescription>
            Please read through the Terms & Conditions below and accept them to continue using the website. Scroll down to the bottom to click Accept.
          </DialogDescription>
        </DialogHeader>
        
        <div className="border rounded-md p-4 bg-muted/30 space-y-4 my-4 relative">
          {!hasScrolledToBottom && (
            <div className="absolute bottom-0 w-full flex justify-center items-center py-3 bg-gradient-to-t from-background/80 to-transparent pointer-events-none z-10">
              <div className="bg-primary/10 text-primary text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-full animate-pulse">
                <ArrowDown className="h-3.5 w-3.5" />
                Scroll to continue
                <ArrowDown className="h-3.5 w-3.5" />
              </div>
            </div>
          )}
          <div 
            ref={termsContentRef}
            className="text-sm space-y-3 max-h-[200px] overflow-y-auto p-2"
            onScroll={handleScroll}
          >
            <p>
              By agreeing to these Terms & Conditions, you acknowledge that you are using this website at your own risk. The creator of this website is not responsible for any consequences you may face for using this.
            </p>
            
            <p>
              <span className="font-semibold">CES Guideline Compliance:</span> Users must agree to follow all Catholic Education Services (CES) Cairns guidelines while using this website. This includes adhering to school policies, rules, and regulations.
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
            
            <p>
              <span className="font-semibold">Screen Locking Disclaimer:</span> The screen locking feature is provided for quick concealment of the site. We are not liable for any unsaved progress, game data, or scores that may be lost when the screen is locked. It is your responsibility to save your progress before using this feature or when an administrator initiates a lock.
            </p>
            
            <p>
              <span className="font-semibold">ABTutor and IT Notice:</span> Please be aware that the IT is able to Monitor your activity on school-owned devices. We are not liable for any consequences of your actions during school or hometime use. This means that they are able to control, filter, and monitor your computer. We are NOT liable for your actions - We have systems in place to prevent misuse, but we cannot guarantee that you will not be caught using this site.
            </p>
            
            <p>
              <span className="font-semibold">Changes to Terms & Conditions:</span> These Terms & Conditions may be modified, changed, or updated at any time without prior notice at the sole discretion of the site administrator. Changes may be made randomly and without warning. It is your responsibility to review these terms each time you access the site, as continued use constitutes acceptance of any changes made. You will be required to accept the updated terms upon login.
            </p>

            <p>
              <span className="font-semibold">School Work:</span> We are not responsible for any school work you may lose or fail to complete due to using this website. This is your choice and we are not liable for any consequences of overdue or incomplete assignments.
            </p>
            
            <p className="border-t border-border/40 pt-3 mt-3">
              <span className="font-semibold">Acknowledgment:</span> By scrolling to the bottom and accepting these terms, you acknowledge that you have read, understood, and agree to be bound by all the terms and conditions set forth in this agreement.
            </p>
          </div>
        </div>
        <p className="border-t border-border/40 pt-3 mt-3">
          <span className="font-semibold">Copyright skibidi._fish 2025 - All Rights Reserved</span>
        </p>
        <div className="flex items-center space-x-2 pt-3">
          <Checkbox 
            id="terms" 
            checked={acceptTerms}
            disabled={!hasScrolledToBottom}
            onCheckedChange={(checked) => setAcceptTerms(checked === true)}
          />
          <Label 
            htmlFor="terms" 
            className={`text-sm font-medium ${!hasScrolledToBottom ? 'text-muted-foreground' : ''}`}
          >
            {hasScrolledToBottom 
              ? "I understand and accept that I am using this site at my own risk" 
              : "Please scroll to the bottom of the terms to enable this checkbox"}
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
