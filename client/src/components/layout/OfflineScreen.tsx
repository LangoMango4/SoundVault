import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import offlineScreenImage from "@/assets/offline_screen.svg";
import lockScreenImage from "@/assets/website_locked.png";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineScreen() {
  const [retryCount, setRetryCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const { checkRealConnectivity } = useOnlineStatus();
  
  // Force a re-check for connectivity when the retry button is clicked
  const handleRetry = async () => {
    setIsChecking(true);
    setRetryCount(prev => prev + 1);
    
    try {
      // This will trigger the parent component's connectivity check
      await checkRealConnectivity();
      // Small delay to show the checking state
      setTimeout(() => {
        setIsChecking(false);
      }, 1000);
    } catch (error) {
      setIsChecking(false);
    }
  };

  // This ensures that content behind the overlay cannot be clicked
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);
  
  // Send heartbeat to keep server alive even when offline screen is shown
  useEffect(() => {
    const sendHeartbeat = async () => {
      // Add rate limiting like in the main app
      const lastHeartbeatSent = localStorage.getItem('offline-screen-heartbeat-time');
      const currentTime = Date.now();
      
      // Only send a heartbeat if it's been at least 30 seconds since the last one
      if (lastHeartbeatSent && currentTime - Number(lastHeartbeatSent) < 30000) {
        return;
      }
      
      try {
        // Create a controller for timeout management
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          await fetch('/api/heartbeat', {
            method: 'GET',
            cache: 'no-store', // More reliable than no-cache
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          // Store the time of the last successful heartbeat
          localStorage.setItem('offline-screen-heartbeat-time', currentTime.toString());
        } catch (fetchError) {
          clearTimeout(timeoutId);
          // Silent failure is expected when offline - no logging needed
        }
      } catch (error) {
        // Silent catch for any other unexpected errors
      }
    };
    
    // Initial heartbeat with a delay to avoid startup rush
    const initialHeartbeatTimeout = setTimeout(sendHeartbeat, 3000);
    
    // Send heartbeat every minute to keep server running 24/7
    const heartbeatInterval = setInterval(sendHeartbeat, 60000);
    
    return () => {
      clearTimeout(initialHeartbeatTimeout);
      clearInterval(heartbeatInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
      <div className="max-w-xl w-full px-4">
        <div className="flex flex-col items-center text-center">
          {/* Display the offline screen image with WiFi icon */}
          <img 
            src={offlineScreenImage} 
            alt="Offline" 
            className="w-full max-w-xl object-contain mb-8"
          />
          
          <div className="flex flex-col gap-3 items-center">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4 w-full max-w-md">
              <div className="flex items-center gap-3 text-red-800">
                <WifiOff className="h-5 w-5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">No Internet Connection</p>
                  <p>
                    Network connection required to use this application.
                    Please check your internet connection and try again.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              variant="default" 
              onClick={handleRetry}
              disabled={isChecking}
              className="mt-2"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Checking Connection...
                </>
              ) : (
                <>
                  Check Connection
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}