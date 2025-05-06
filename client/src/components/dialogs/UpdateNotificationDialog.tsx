import { useState, useEffect } from 'react';
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
import { AlertTriangle } from "lucide-react";

interface UpdateNotificationDialogProps {
  open: boolean;
  onAccept: () => void;
  onRefresh?: () => void;
}

export function UpdateNotificationDialog({ open, onAccept, onRefresh }: UpdateNotificationDialogProps) {
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Important Update Notification
          </DialogTitle>
          <DialogDescription>
            The site has been updated with exciting new features!
          </DialogDescription>
        </DialogHeader>
        
        <div className="border rounded-md p-4 bg-amber-50 space-y-4 my-4">
          <h3 className="font-semibold text-lg">Terms & Conditions</h3>
          
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
              <span className="font-semibold">Updates:</span> New features have been added to the website, including Snake, Tic-Tac-Toe, and Math Challenge games. Please explore responsibly.
            </p>
            
            <p>
              <span className="font-semibold">Emergency Shortcuts:</span> The emergency shortcut has been updated to Escape + T instead of Alt key to avoid conflicts with school security systems.
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
        
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {onRefresh && (
            <Button 
              onClick={() => {
                onAccept();
                onRefresh();
              }} 
              disabled={!acceptTerms}
              className="w-full bg-primary hover:bg-primary/90"
              variant="default"
            >
              Refresh Now
            </Button>
          )}
          <Button 
            onClick={onAccept} 
            disabled={!acceptTerms}
            className="w-full"
            variant="outline"
          >
            Accept and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
