import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

export function useOnlineStatus() {
  // Default to navigator.onLine value
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Advanced connectivity check function
  const checkRealConnectivity = async (): Promise<boolean> => {
    // Add rate limiting to avoid excessive checks
    const lastConnectivityCheck = localStorage.getItem('last-connectivity-check');
    const currentTime = Date.now();
    
    // Only perform the check if it's been at least 5 seconds since the last one
    // This helps prevent a cascade of checks during network issues
    if (lastConnectivityCheck && currentTime - Number(lastConnectivityCheck) < 5000) {
      // Return the current known state without performing a new check
      return isOnline;
    }
    
    // Update the timestamp for the check
    localStorage.setItem('last-connectivity-check', currentTime.toString());
    
    try {
      // Create a controller for timeout management
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout (reduced from 15)
      
      try {
        // Try to fetch a small resource from the server
        const response = await fetch('/api/ping', { 
          method: 'GET',
          // Use cache: 'no-store' to prevent getting cached responses
          cache: 'no-store',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Only consider offline if we get an actual error response
        if (response.status >= 200 && response.status < 500) {
          // Any successful or redirect response, or even 4xx client errors
          // means the server is reachable, so the client is online
          setIsOnline(true);
          return true;
        } else {
          // 500+ server errors might indicate server issues
          setIsOnline(false);
          return false;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Network error or timeout - we can try a second endpoint before deciding we're offline
        try {
          // Create a new controller for backup attempt
          const backupController = new AbortController();
          const backupTimeoutId = setTimeout(() => backupController.abort(), 5000); // Shorter timeout for backup
          
          // Attempt backup connectivity check
          const backupResponse = await fetch('/api/heartbeat', { 
            method: 'GET',
            cache: 'no-store',
            signal: backupController.signal
          });
          
          clearTimeout(backupTimeoutId);
          
          const isConnected = backupResponse.status < 500;
          setIsOnline(isConnected);
          return isConnected;
        } catch (backupError) {
          // Both checks failed, now we can determine we're offline
          setIsOnline(false);
          return false;
        }
      }
    } catch (error) {
      // Top level catch for any other unexpected errors
      // Default to offline in this case to be safe
      setIsOnline(false);
      return false;
    }
  };

  useEffect(() => {
    // Detect initial connection status
    setIsOnline(navigator.onLine);
    
    // Initial check with server
    checkRealConnectivity();

    // Handler for when connection comes back
    const handleOnline = () => {
      setIsOnline(true);
      // We'll only show this toast when moving from a confirmed offline state to online
      if (!isOnline) {
        toast({
          title: "Connection Restored",
          description: "Your internet connection has been restored.",
          variant: "default", 
        });
      }
      // Verify with server
      checkRealConnectivity();
    };

    // Handler for when connection is lost
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection Lost",
        description: "You are currently offline. Some features may not work.",
        variant: "destructive", 
      });
    };
    
    // Send heartbeat to keep server alive - with rate limiting
    const sendHeartbeat = async () => {
      // Rate limit heartbeats
      const lastHeartbeatSent = localStorage.getItem('last-heartbeat-time');
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
          // Send heartbeat to let server know application is active
          await fetch('/api/heartbeat', { 
            method: 'GET',
            cache: 'no-store', // More reliable than no-cache
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          // Store the time of the last successful heartbeat
          localStorage.setItem('last-heartbeat-time', currentTime.toString());
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          // Don't log AbortError (timeout) to avoid console spam
          if (!(fetchError instanceof Error && fetchError.name === 'AbortError')) {
            // Use silent failure in production, only log in development
            if (process.env.NODE_ENV === 'development') {
              console.log("Heartbeat failed - server may be restarting");
            }
          }
        }
      } catch (error) {
        // Silent catch for any other unexpected errors
      }
    };
    
    // Send heartbeat with a delay to avoid startup rush
    const initialHeartbeatTimeout = setTimeout(sendHeartbeat, 3000);
    
    // Set up regular ping check - every 30 seconds (further reduced to avoid too many requests)
    const pingIntervalId = setInterval(checkRealConnectivity, 30000);
    
    // Set up heartbeat interval - every 60 seconds but with rate limiting applied in the function
    const heartbeatIntervalId = setInterval(sendHeartbeat, 60000);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Handle tab/window visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When user returns to the tab, check connection and send heartbeat
        checkRealConnectivity();
        sendHeartbeat();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Before the user leaves/closes the tab, try to send a final heartbeat
    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliable background requests during page unload
      navigator.sendBeacon('/api/heartbeat');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function to remove event listeners and intervals
    return () => {
      clearTimeout(initialHeartbeatTimeout);
      clearInterval(pingIntervalId);
      clearInterval(heartbeatIntervalId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [toast]);

  // Return both the online status and the check function
  return {
    isOnline,
    checkRealConnectivity
  };
}