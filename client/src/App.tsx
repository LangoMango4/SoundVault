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
      // Alternate between endpoints for redundancy
      const endpoint = Math.random() > 0.5 ? '/api/heartbeat' : '/api/keepalive';
      
      try {
        await fetch(endpoint);
        console.log(`Connection maintenance ping sent to ${endpoint}`, new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Failed to send keep-alive signal:", error);
        
        // If first attempt fails, try the other endpoint as backup
        const primaryEndpoint = endpoint;
        try {
          const backupEndpoint = primaryEndpoint === '/api/heartbeat' ? '/api/keepalive' : '/api/heartbeat';
          await fetch(backupEndpoint);
          console.log(`Backup ping sent to ${backupEndpoint}`, new Date().toLocaleTimeString());
        } catch (backupError) {
          console.error("Both keep-alive attempts failed:", backupError);
        }
      }
    };
    
    // Initial keepalive
    sendKeepAliveSignals();
    
    // Set up multiple intervals at different times for redundancy
    const primaryInterval = setInterval(sendKeepAliveSignals, 2 * 60 * 1000); // Every 2 minutes
    const secondaryInterval = setInterval(sendKeepAliveSignals, 5 * 60 * 1000); // Every 5 minutes
    
    // Cleanup on unmount
    return () => {
      clearInterval(primaryInterval);
      clearInterval(secondaryInterval);
    };
  }, []);
  
  // Return the offline screen if we're not online
  if (!isOnline || forceOffline) {
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
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
