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
  
  // Function to handle teacher inbound button click
  const handleTeacherInbound = () => {
    try {
      // Create a fake browser UI with empty content
      // First, save application state
      const originalContent = document.body.innerHTML;
      const originalTitle = document.title;
      const originalStyles = new Map<string, boolean>();
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const sheet = document.styleSheets[i];
          if (sheet.href) {
            originalStyles.set(sheet.href, true);
          }
        } catch (e) {
          console.error('Failed to access stylesheet:', e);
        }
      }
      
      // Change title to something generic
      document.title = 'New Tab';
      
      // Hide all existing styles to prevent any app styling from showing
      const head = document.head;
      const stylesToRemove: Element[] = [];
      for (let i = 0; i < head.children.length; i++) {
        const node = head.children[i];
        if (node.tagName === 'STYLE' || 
            (node.tagName === 'LINK' && 
             node instanceof HTMLLinkElement && 
             node.rel === 'stylesheet')) {
          stylesToRemove.push(node);
        }
      }
      
      // Store the removed styles to restore later
      const removedStyles: Element[] = [];
      stylesToRemove.forEach(node => {
        removedStyles.push(node);
        head.removeChild(node);
      });
      
      // Create a fake Google search result page
      document.body.innerHTML = `
        <div style="font-family: Arial, sans-serif; margin: 0; padding: 0; height: 100vh; background: white;">
          <div style="height: 60px; padding: 0 20px; display: flex; align-items: center; border-bottom: 1px solid #ddd;">
            <div style="color: #4285f4; font-size: 22px; font-weight: bold; margin-right: 20px;">G</div>
            <div style="flex-grow: 1;">
              <div style="width: 100%; max-width: 600px; height: 40px; border: 1px solid #ddd; border-radius: 24px; padding: 0 15px; display: flex; align-items: center;">
                <input type="text" placeholder="Search" style="border: none; outline: none; width: 100%; font-size: 16px;">
              </div>
            </div>
          </div>
          <div style="padding: 20px; color: #666;">
            <p>No search results found.</p>
          </div>
          
          <!-- Hidden control to get back to the app -->
          <div style="position: fixed; bottom: 0; right: 0; padding: 10px; opacity: 0.1;">
            <button 
              onmouseover="this.style.opacity = '1'"
              onmouseout="this.style.opacity = '0.1'"
              onclick="
                document.title = '${originalTitle.replace(/'/g, "\\'")}'; 
                document.body.innerHTML = document.getElementById('original-content').innerHTML;
                const head = document.head;
                const removedStyles = document.getElementById('removed-styles').content.children;
                for (let i = 0; i < removedStyles.length; i++) {
                  head.appendChild(removedStyles[i].cloneNode(true));
                }
              "
              style="background: none; border: none; color: #999; font-size: 12px; cursor: pointer; opacity: 0.5;"
            >
              Return
            </button>
          </div>
          
          <!-- Store original content to restore later -->
          <div id="original-content" style="display: none;">${originalContent}</div>
          
          <!-- Store removed styles to restore later -->
          <template id="removed-styles">
            ${removedStyles.map(node => node.outerHTML).join('')}
          </template>
        </div>
      `;
      
    } catch (err) {
      console.error('Failed to create fake browser page:', err);
      // If all else fails, at least try to blank the page
      document.body.innerHTML = `
        <div style="height: 100vh; width: 100vw; background: white;">
          <div style="position: fixed; bottom: 10px; right: 10px; opacity: 0.1;">
            <button 
              onmouseover="this.style.opacity = '1'"
              onmouseout="this.style.opacity = '0.1'"
              onclick="window.location.reload()"
              style="background: none; border: none; color: #999; font-size: 12px; cursor: pointer;"
            >
              Return
            </button>
          </div>
        </div>
      `;
      document.title = 'New Tab';
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
                    <p>Hide app with fake search page</p>
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
