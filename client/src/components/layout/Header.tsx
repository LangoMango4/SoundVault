import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { MessageSquarePlus, AlertTriangle, ShieldAlert } from "lucide-react";
import { BroadcastMessages } from "./BroadcastMessages";
import { BroadcastMessageForm } from "@/components/admin/BroadcastMessageForm";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ABTutorIcon from "@assets/ABTutor.ico";
import { setupABTutorMonitoring, manualBypassTrigger } from "@/lib/abTutorBypass";

interface HeaderProps {
  onOpenAdminPanel?: () => void;
}

export function Header({ onOpenAdminPanel }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [broadcastFormOpen, setBroadcastFormOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Function to handle teacher inbound button click - opens school website in current tab
  const handleTeacherInbound = () => {
    try {
      // Open the school website in the same tab
      const schoolWebsiteUrl = 'https://andie.standrewscc.qld.edu.au/';
      
      // Navigate to the school website in the current tab
      window.location.href = schoolWebsiteUrl;
      
    } catch (err) {
      console.error('Failed to navigate to school website:', err);
      
      // Fallback method if the first attempt fails
      try {
        // Simple direct navigation
        const schoolUrl = 'https://andie.standrewscc.qld.edu.au/';
        document.location.replace(schoolUrl);
      } catch (error) {
        console.error('Complete failure to navigate to school website:', error);
        alert('Unable to access the school website. Please try again.');
      }
    }
  };
  
  // Now the keyboard shortcut uses the same function as the button
  const handleKeyboardShortcutTeacherInbound = handleTeacherInbound;
  
  // Add keyboard shortcuts for teacher inbound and AB Tutor bypass functions
  useEffect(() => {
    // Use code property to specifically check for AltRight and other keys
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if it's specifically the Right Alt key being pressed
      if (e.code === 'AltRight') {
        console.log("Right Alt key pressed - redirecting to school website");
        handleKeyboardShortcutTeacherInbound();
        // Try to prevent default browser behavior
        e.preventDefault();
      }
      
      // Check for Shift+Escape shortcut for AB Tutor bypass
      if (e.key === 'Escape' && e.shiftKey) {
        console.log("Shift+Escape pressed - activating AB Tutor bypass");
        manualBypassTrigger();
        e.preventDefault();
      }
      
      // Alternative shortcut: Ctrl+B for AB Tutor bypass (easier to press)
      if (e.key === 'b' && e.ctrlKey) {
        console.log("Ctrl+B pressed - activating AB Tutor bypass");
        manualBypassTrigger();
        e.preventDefault();
      }
    };
    
    // Add event listener to document for better capture
    document.addEventListener("keydown", handleKeyDown, true);
    console.log("Keyboard shortcut listeners added for emergency functions");
    
    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      console.log("Keyboard shortcut listeners removed");
    };
  }, []);
  
  // Set up AB Tutor detection and bypass
  useEffect(() => {
    if (user) {
      // Only run monitoring when logged in
      console.log("Setting up AB Tutor detection");
      const stopMonitoring = setupABTutorMonitoring(3000); // Check every 3 seconds
      
      // Cleanup function to stop monitoring
      return () => {
        stopMonitoring();
      };
    }
  }, [user]);

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src={ABTutorIcon} alt="Maths Homework" className="h-6 w-6 mr-2" />
            <div>
              <h1 className="text-xl font-semibold text-primary">
                {user ? "top homework sigma1!!11" : "Maths Homework"}
              </h1>
              {user && (
                <p className="text-xs text-gray-500 -mt-1">
                  made by sniff sniff / skibidi._fish
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="text-sm text-neutral-600">
                Welcome, <span className="font-medium">{user.fullName}</span>
              </div>
            )}
            
            {/* Show broadcast messages button for any authenticated user */}
            {user && <BroadcastMessages />}
            
            {/* Show broadcast creation button only for admin users */}
            {user?.role === "admin" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBroadcastFormOpen(true)}
                title="Create Broadcast Message"
              >
                <MessageSquarePlus className="h-5 w-5" />
              </Button>
            )}
            
            {user?.role === "admin" && onOpenAdminPanel && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={onOpenAdminPanel}
                className="text-sm"
              >
                Admin Panel
              </Button>
            )}
            
            {/* Teacher Inbound Button (Emergency Hide) */}
            {user && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleTeacherInbound}
                      className="text-sm flex items-center gap-1"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      Teacher Inbound
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open school website in current tab</p>
                    <p className="text-xs text-muted-foreground mt-1">Shortcut: Press Right Alt for same action</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* AB Tutor Bypass Button */}
            {user && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={manualBypassTrigger}
                      className="text-sm flex items-center gap-1 bg-amber-50 hover:bg-amber-100 border-amber-200"
                    >
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      <span className="text-amber-700">Bypass AB</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Bypass AB Tutor monitoring</p>
                    <p className="text-xs text-muted-foreground mt-1">Shortcuts: Shift+Esc or Ctrl+B</p>
                    <p className="text-xs text-muted-foreground">Redirects to a safe site</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      {/* Broadcast Message Form Dialog */}
      <BroadcastMessageForm 
        open={broadcastFormOpen} 
        onOpenChange={setBroadcastFormOpen} 
      />
    </>
  );
}
