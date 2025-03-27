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
    // Try to close the tab
    window.close();
    // If closing fails (browsers may block this), minimize or hide the window
    window.blur();
    // As a last resort, navigate to a safe website
    setTimeout(() => {
      window.location.href = "https://www.google.com/search?q=math+homework+help";
    }, 100);
  };
  
  // Add keyboard shortcut (ESC key) for teacher inbound function
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Listen for Escape key
      if (e.key === "Escape") {
        handleTeacherInbound();
      }
    };
    
    // Add event listener
    window.addEventListener("keydown", handleKeyDown);
    
    // Cleanup function
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/src/assets/ABTutor.ico" alt="Maths Homework" className="h-6 w-6 mr-2" />
            <h1 className="text-xl font-semibold text-primary">
              {user ? "top homework sigma1!!11" : "Maths Homework"}
            </h1>
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
                    <p>Quickly hide this page (closes or minimizes tab)</p>
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
