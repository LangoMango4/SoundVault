import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[100]">
      <div className="max-w-xl w-full px-4">
        <div className="flex flex-col items-center text-center">
          {/* Display the lock screen image */}
          <img 
            src={lockScreenImage} 
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