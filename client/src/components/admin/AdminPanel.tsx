import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Users, FileAudio, Settings, ShieldAlert, UserCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DataTable } from "@/components/ui/data-table";
import { UserForm } from "./UserForm";
import { SoundForm } from "./SoundForm";
import { useToast } from "@/hooks/use-toast";

import { useAuth } from "@/hooks/use-auth";
import { CURRENT_VERSION, VERSION_HISTORY } from "@/hooks/use-update-notification";

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}

export function AdminPanel({ open, onOpenChange }: AdminPanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if user is admin, if not, close the panel
  useEffect(() => {
    if (open && user?.role !== "admin") {
      onOpenChange(false);
      toast({
        title: "Access Denied",
        description: "You don't have permission to access the admin panel.",
        variant: "destructive",
      });
    }
  }, [open, user, onOpenChange, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Administrator Dashboard
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6">
          <p>Admin panel functionality is temporarily disabled during maintenance.</p>
          
          <div className="bg-card rounded-md border shadow-sm p-6 mt-6">
            <h4 className="font-medium text-lg mb-3">System Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Current Version</p>
                <p className="text-sm text-muted-foreground">{CURRENT_VERSION}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Last Updated</p>
                <p className="text-sm text-muted-foreground">{VERSION_HISTORY[CURRENT_VERSION]?.date || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}