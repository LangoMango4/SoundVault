import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useUpdateNotification } from "@/hooks/use-update-notification";
// Using a div with overflow-y-auto instead of ScrollArea which might not be available
// import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface UpdateNotificationDialogProps {
  open: boolean;
  onAccept: () => void;
  onRefresh?: () => void;
}

export function UpdateNotificationDialog({ open, onAccept, onRefresh }: UpdateNotificationDialogProps) {
  const { currentVersionDetails } = useUpdateNotification();
  
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Application Update
          </DialogTitle>
          <DialogDescription>
            The site has been updated with new features and improvements!
          </DialogDescription>
        </DialogHeader>
        
        <div className="border rounded-md p-4 bg-muted/40 space-y-4 my-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">What's New</h3>
            <Badge variant="outline" className="text-xs font-medium">
              Version {currentVersionDetails.title}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Released: {currentVersionDetails.date}
          </div>
          
          <div className="h-[200px] rounded-md border p-3 bg-background overflow-y-auto">
            <div className="space-y-3 pr-3">
              {currentVersionDetails.changes.map((change, index) => (
                <div key={index} className="flex gap-2 pb-2 last:pb-0 last:border-0 border-b border-border/40">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p>{change}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          {onRefresh && (
            <Button 
              onClick={() => {
                onAccept();
                onRefresh();
              }}
              className="w-full bg-primary hover:bg-primary/90"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Now
            </Button>
          )}
          <Button 
            onClick={onAccept}
            className="w-full"
            variant="outline"
          >
            Continue Without Updating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
