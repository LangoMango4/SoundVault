import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

export function useOnlineStatus() {
  // Default to navigator.onLine value
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { toast } = useToast();

  useEffect(() => {
    // Detect initial connection status
    setIsOnline(navigator.onLine);

    // Handler for when connection comes back
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "Your internet connection has been restored.",
        variant: "default", 
      });
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

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Advanced connectivity check function
  const checkRealConnectivity = async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource from the server
      const response = await fetch('/api/ping', { 
        method: 'GET',
        // Use cache: 'no-cache' to prevent getting cached responses
        cache: 'no-cache',
        // Set a reasonable timeout
        signal: AbortSignal.timeout(5000)
      });
      
      return response.ok;
    } catch (error) {
      // Any error means we're unable to connect to the server
      return false;
    }
  };

  return { 
    isOnline,
    checkRealConnectivity
  };
}