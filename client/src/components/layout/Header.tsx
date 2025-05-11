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
import NewAppIcon from "@assets/shell32_279.ico";

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
  
  // Add keyboard shortcut for teacher inbound function
  useEffect(() => {
    // Use Escape + T key combination instead of AltRight to avoid Zscaler conflict
    let escapePressed = false;
    const escapeTimeout = 1000; // Reset escape state after 1 second
    let escapeTimer: number | null = null;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // First key: Escape
      if (e.key === 'Escape') {
        escapePressed = true;
        
        // Reset after timeout
        if (escapeTimer) clearTimeout(escapeTimer);
        escapeTimer = window.setTimeout(() => {
          escapePressed = false;
        }, escapeTimeout);
        
        return;
      }
      
      // Second key: T (after Escape was pressed)
      if (escapePressed && e.key.toLowerCase() === 't') {
        console.log("Emergency escape sequence triggered - redirecting to school website");
        handleKeyboardShortcutTeacherInbound();
        escapePressed = false; // Reset state
        if (escapeTimer) clearTimeout(escapeTimer);
        
        // Try to prevent default browser behavior
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    // Add event listener to document for better capture
    document.addEventListener("keydown", handleKeyDown, true);
    console.log("Keyboard shortcut listener added for emergency function");
    
    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (escapeTimer) clearTimeout(escapeTimer);
      console.log("Keyboard shortcut listener removed");
    };
  }, []);

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-5 flex justify-between items-center">
          <div className="flex items-center">
            <img src={NewAppIcon} alt="Maths Homework" className="h-10 w-10 mr-3" />
            <div>
              <h1 className="text-2xl font-semibold text-primary">
                {user ? "top homework sigma1!!11" : "Maths Homework"}
              </h1>
              {user && (
                <p className="text-xs text-gray-500 -mt-1">
                  This was made by sniff sniff / skibidi._fish - Copyright 2025 All Rights Reserved
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
                    <p className="text-xs text-muted-foreground mt-1">Shortcut: Press <span className="font-bold">Escape</span> then <span className="font-bold">T</span></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {/* AB Tutor Bypass Button removed as requested */}
            
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
