import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { useOnlineStatus } from "./hooks/use-online-status";
import { OfflineScreen } from "./components/layout/OfflineScreen";
import { useEffect, useState } from "react";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/games" component={() => <HomePage initialTab="games" />} />
      <ProtectedRoute path="/chat" component={() => <HomePage initialTab="chat" />} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Component to check internet connectivity
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
    const interval = setInterval(checkConnection, 5000);
    
    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [checkRealConnectivity]);
  
  // Return the offline screen if we're not online
  if (!isOnline || forceOffline) {
    return <OfflineScreen />;
  }
  
  // Otherwise don't render anything extra
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConnectivityChecker />
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
