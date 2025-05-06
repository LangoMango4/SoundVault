import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import TestPage from "@/pages/test-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { useOnlineStatus } from "./hooks/use-online-status";
import { OfflineScreen } from "./components/layout/OfflineScreen";
import { UpdateNotificationDialog } from "./components/dialogs/UpdateNotificationDialog";
import { useUpdateNotification } from "./hooks/use-update-notification";
import { useEffect, useState } from "react";

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

// Component to show update notification
function UpdateNotifier() {
  const { showUpdateNotification, hideUpdateNotification } = useUpdateNotification();
  
  return (
    <UpdateNotificationDialog 
      open={showUpdateNotification} 
      onAccept={hideUpdateNotification} 
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConnectivityChecker />
        <UpdateNotifier />
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
