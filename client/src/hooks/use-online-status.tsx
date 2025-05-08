import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

export function useOnlineStatus() {
  // Default to navigator.onLine value
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  // Advanced connectivity check function
  const checkRealConnectivity = async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource from the server with a longer timeout
      const response = await fetch('/api/ping', { 
        method: 'GET',
        // Use cache: 'no-cache' to prevent getting cached responses
        cache: 'no-cache',
        // Set a longer timeout (15 seconds instead of 5) to account for network latency
        signal: AbortSignal.timeout(15000)
      });
      
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
    } catch (error) {
      // Network error or timeout - we can try a second endpoint before deciding we're offline
      try {
        // Attempt backup connectivity check
        const backupResponse = await fetch('/api/heartbeat', { 
          method: 'GET',
          cache: 'no-cache',
          signal: AbortSignal.timeout(10000)
        });
        
        const isConnected = backupResponse.status < 500;
        setIsOnline(isConnected);
        return isConnected;
      } catch (backupError) {
        // Both checks failed, now we can determine we're offline
        setIsOnline(false);
        return false;
      }
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
        // Send heartbeat to let server know application is active
        await fetch('/api/heartbeat', { 
          method: 'GET',
          cache: 'no-cache',
          signal: AbortSignal.timeout(3000)
        });
        // Store the time of the last successful heartbeat
        localStorage.setItem('last-heartbeat-time', currentTime.toString());
      } catch (error) {
        console.log("Heartbeat failed - server may be restarting");
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