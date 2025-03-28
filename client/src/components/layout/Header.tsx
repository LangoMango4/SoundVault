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
  
  // Function to handle teacher inbound button click - creates a tab-like interface within the current tab
  const handleTeacherInbound = () => {
    try {
      // Create an iframe that takes up the full screen
      // This simulates a new tab within the current tab
      const originalContent = document.body.innerHTML;
      const originalBackground = document.body.style.background;
      const originalTitle = document.title;
      
      // Save the current scroll position
      const scrollPos = {
        x: window.scrollX,
        y: window.scrollY
      };
      
      // Create a full-screen blank page with tab-like interface
      document.body.innerHTML = `
        <div id="fake-tab" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 9999; display: flex; flex-direction: column; font-family: sans-serif;">
          <div style="height: 36px; background: #f0f0f0; border-bottom: 1px solid #ddd; display: flex; align-items: center; padding: 0 8px;">
            <div style="width: 30px; height: 20px; background: #e5e5e5; border-radius: 3px; margin-right: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="document.getElementById('fake-tab').remove(); document.title = '${originalTitle.replace(/'/g, "\\'")}'; document.body.style.background = '${originalBackground.replace(/'/g, "\\'")}'; document.body.innerHTML = document.getElementById('original-content').innerHTML; window.scrollTo(${scrollPos.x}, ${scrollPos.y});">✕</div>
            <div style="color: #555; font-size: 13px;">New Tab</div>
          </div>
          <div style="flex: 1; background: white; padding: 15px;">
            <div style="text-align: center; color: #555; margin-top: 100px;">This tab has no content.</div>
          </div>
        </div>
        <div id="original-content" style="display: none;">${originalContent}</div>
      `;
      
      // Change the document title to look like a new tab
      document.title = 'New Tab';
      
    } catch (err) {
      console.error('Failed to create fake tab:', err);
      alert('Unable to create new tab interface.');
    }
  };
  
  // Function specifically for keyboard shortcut - opens school website
  const handleKeyboardShortcutTeacherInbound = () => {
    try {
      // Open the school website in a new tab using the school website URL
      const schoolWebsiteUrl = 'https://andie.standrewscc.qld.edu.au/';
      
      // Ensure the school website opens in a new tab
      const newTab = window.open(schoolWebsiteUrl, '_blank');
      
      // Focus on the new tab to make it the active tab
      if (newTab) {
        newTab.focus();
      }
    } catch (err) {
      console.error('Failed to open school website in new tab:', err);
      
      // Fallback method if the first attempt fails
      try {
        // Direct method without storing the reference
        window.open('https://andie.standrewscc.qld.edu.au/', '_blank', 'noopener,noreferrer');
      } catch (error) {
        console.error('Complete failure to open school website:', error);
      }
    }
  };
  
  // Add keyboard shortcut (Right Alt key) for teacher inbound function
  useEffect(() => {
    // Use code property to specifically check for AltRight (Right Alt key)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if it's specifically the Right Alt key being pressed
      if (e.code === 'AltRight') {
        console.log("Right Alt key pressed - redirecting to school website");
        handleKeyboardShortcutTeacherInbound();
        // Try to prevent default browser behavior
        e.preventDefault();
      }
    };
    
    // Add event listener to document for better capture
    document.addEventListener("keydown", handleKeyDown, true);
    console.log("Right Alt key listener added for redirection");
    
    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      console.log("Right Alt key listener removed");
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
                    <p>Create a blank tab within this window</p>
                    <p className="text-xs text-muted-foreground mt-1">Shortcut: Press Right Alt for school website</p>
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
