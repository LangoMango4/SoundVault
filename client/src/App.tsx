import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import TestPage from "@/pages/test-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { useOnlineStatus } from "./hooks/use-online-status";
import { OfflineScreen } from "./components/layout/OfflineScreen";
import { GlobalLayout } from "./components/layout/GlobalLayout";
import { UpdateNotificationDialog } from "./components/dialogs/UpdateNotificationDialog";
import { TermsAndConditionsDialog } from "./components/dialogs/TermsAndConditionsDialog";
import { useUpdateNotification } from "./hooks/use-update-notification";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/games" component={() => <HomePage initialTab="games" />} />
      <ProtectedRoute path="/chat" component={() => <HomePage initialTab="chat" />} />
      <Route path="/test" component={TestPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Component to check internet connectivity and keep the connection alive
function ConnectivityChecker() {
  const { isOnline, checkRealConnectivity } = useOnlineStatus();
  const [forceOffline, setForceOffline] = useState(false);
  const { showUpdateNotification } = useUpdateNotification();
  
  // This effect runs periodic real connectivity checks
  useEffect(() => {
    // Initial check
    const checkConnection = async () => {
      try {
        const isReallyConnected = await checkRealConnectivity();
        setForceOffline(!isReallyConnected);
      } catch (error) {
        // If there's an error while checking, we assume connection is down
        setForceOffline(true);
      }
    };
    
    // Check immediately
    checkConnection();
    
    // Then set up an interval for periodic checks (every 5 seconds)
    const connectionInterval = setInterval(checkConnection, 5000);
    
    // Cleanup on unmount
    return () => clearInterval(connectionInterval);
  }, [checkRealConnectivity]);
  
  // This effect sends heartbeats and keepalive signals to keep the server connection alive
  useEffect(() => {
    // Alternates between heartbeat and keepalive to maintain connection
    const sendKeepAliveSignals = async () => {
      // Get the last time we sent a keepalive
      const lastKeepalive = Number(localStorage.getItem('last-keepalive-time') || '0');
      const currentTime = Date.now();
      
      // Only send keepalive if at least 15 seconds have passed since the last one
      if (currentTime - lastKeepalive < 15000) {
        return;
      }
      
      // Store the current time as the last keepalive time
      localStorage.setItem('last-keepalive-time', currentTime.toString());
      
      // Use keepalive endpoint primarily since it's more lightweight
      const endpoint = '/api/keepalive';
      
      try {
        // Create a controller for timeout management
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          await fetch(endpoint, {
            signal: controller.signal,
            cache: 'no-store' // Prevent caching issues
          });
          
          clearTimeout(timeoutId);
          
          // Reduced logging to avoid console spam
          if (Math.random() < 0.1) { // Only log ~10% of successful pings
            console.log(`Connection maintenance ping sent to ${endpoint}`, new Date().toLocaleTimeString());
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          
          // Don't log timeout errors to avoid console spam
          if (!(fetchError instanceof Error && fetchError.name === 'AbortError')) {
            // Only try backup endpoint if first attempt failed and wasn't a timeout
            try {
              const backupController = new AbortController();
              const backupTimeoutId = setTimeout(() => backupController.abort(), 5000);
              
              const backupEndpoint = '/api/heartbeat';
              await fetch(backupEndpoint, {
                signal: backupController.signal,
                cache: 'no-store'
              });
              
              clearTimeout(backupTimeoutId);
              
              // Only log successful backup attempts in development
              if (process.env.NODE_ENV === 'development') {
                console.log(`Backup ping sent to ${backupEndpoint}`, new Date().toLocaleTimeString());
              }
            } catch (backupError) {
              // Silent fail for backup attempt - will try again on next interval
            }
          }
        }
      } catch (error) {
        // Silent catch for any other unexpected errors
      }
    };
    
    // Initial keepalive (with a short delay to avoid startup rush)
    const initialPingTimeout = setTimeout(sendKeepAliveSignals, 3000);
    
    // Set up a single interval with a longer time (15 seconds is plenty for keepalive)
    const keepaliveInterval = setInterval(sendKeepAliveSignals, 15 * 1000); 
    
    // Cleanup on unmount
    return () => {
      clearTimeout(initialPingTimeout);
      clearInterval(keepaliveInterval);
    };
  }, []);
  
  // Don't show offline screen if update notification is active
  if ((!isOnline || forceOffline) && !showUpdateNotification) {
    return <OfflineScreen />;
  }
  
  // Otherwise don't render anything extra
  return null;
}

// Component to show dialogs and notifications
function NotificationManager() {
  const { 
    showUpdateNotification, 
    showTermsAndConditions,
    hideUpdateNotification, 
    hideTermsAndConditions,
    refreshPage
  } = useUpdateNotification();
  
  const { toast } = useToast();
  
  // Show update notification toast when there's a new version
  useEffect(() => {
    if (showUpdateNotification) {
      toast({
        title: 'New Update Available!',
        description: 'Click to refresh and see the latest changes',
        action: (
          <Button 
            onClick={refreshPage} 
            variant="outline" 
            size="sm" 
            className="gap-1 text-primary"
          >
            <Bell className="h-4 w-4" />
            Update
          </Button>
        ),
        duration: 0 // Don't auto-dismiss
      });
    }
  }, [showUpdateNotification, toast, refreshPage]);
  
  return (
    <>
      {/* Terms & Conditions dialog shown on every login */}
      <TermsAndConditionsDialog 
        open={showTermsAndConditions} 
        onAccept={hideTermsAndConditions}
      />
      {/* Update notification dialog */}
      <UpdateNotificationDialog 
        open={showUpdateNotification} 
        onAccept={hideUpdateNotification}
        onRefresh={refreshPage}
      />
    </>  
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConnectivityChecker />
        <NotificationManager />
        <GlobalLayout>
          <Router />
        </GlobalLayout>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
