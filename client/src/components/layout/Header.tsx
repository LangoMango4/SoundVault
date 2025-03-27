import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { MessageSquarePlus, AlertTriangle } from "lucide-react";
import { BroadcastMessages } from "./BroadcastMessages";
import { BroadcastMessageForm } from "@/components/admin/BroadcastMessageForm";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ABTutorIcon from "@assets/ABTutor.ico";

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
  
  // Function to handle teacher inbound button click (for the button)
  const handleTeacherInbound = () => {
    try {
      // Redirect to the school website
      window.location.href = 'https://andie.standrewscc.qld.edu.au/';
      
      // If the redirect doesn't happen immediately, clear the page first
      // so that the content isn't visible during the transition
      setTimeout(() => {
        document.body.innerHTML = '';
        document.body.style.background = 'white';
        document.title = '';
      }, 50);
    } catch (err) {
      console.error('Failed to redirect:', err);
      // Fallback - at minimum ensure the page is cleared
      document.body.innerHTML = '';
      document.body.style.background = 'white';
      document.title = '';
    }
  };
  
  // Function specifically for keyboard shortcut
  const handleKeyboardShortcutTeacherInbound = () => {
    handleTeacherInbound();
  };
  
  // Add keyboard shortcut (Left Ctrl key) for teacher inbound function
  useEffect(() => {
    // Use code property to specifically check for ControlLeft (Left Ctrl key)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if it's specifically the Left Ctrl key being pressed
      if (e.code === 'ControlLeft') {
        console.log("Left Ctrl key pressed - closing tab");
        handleKeyboardShortcutTeacherInbound();
        // Try to prevent default browser behavior
        e.preventDefault();
      }
    };
    
    // Add event listener to document for better capture
    document.addEventListener("keydown", handleKeyDown, true);
    console.log("Left Ctrl key listener added for tab closing");
    
    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      console.log("Left Ctrl key listener removed");
    };
  }, []);

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
                    <p>Quickly close this tab (emergency exit)</p>
                    <p className="text-xs text-muted-foreground mt-1">Shortcut: Press Left Ctrl</p>
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
