import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { ContentTabs } from "@/components/layout/ContentTabs";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LockScreen } from "@/components/layout/LockScreen";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const { user } = useAuth();
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  
  // Fetch the current lock status
  const { data: lockData } = useQuery({
    queryKey: ["/api/settings/lock"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/settings/lock");
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds to check for lock changes
  });

  // Update local state when the query data changes, but respect temporary unlocks
  useEffect(() => {
    if (lockData) {
      // Check if we have a temporary unlock in the session
      const temporaryUnlock = sessionStorage.getItem('temporaryUnlock') === 'true';
      
      // Only lock the screen if server says it's locked AND we don't have a temporary unlock
      if (lockData.locked && !temporaryUnlock) {
        setIsScreenLocked(true);
      } else if (!lockData.locked) {
        // If server says it's unlocked, make sure we're unlocked and clear any temporary unlock
        setIsScreenLocked(false);
        sessionStorage.removeItem('temporaryUnlock');
      }
    }
  }, [lockData]);
  
  const handleOpenAdminPanel = () => {
    setIsAdminPanelOpen(true);
  };

  const handleUnlockScreen = () => {
    setIsScreenLocked(false);
  };

  // If the screen is locked, show the lock screen
  if (isScreenLocked) {
    return <LockScreen onUnlock={handleUnlockScreen} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100">
      <Header 
        onOpenAdminPanel={user?.role === "admin" ? handleOpenAdminPanel : undefined} 
      />
      
      <main className="flex-grow container mx-auto px-4 py-6">
        <ContentTabs />
      </main>
      
      <AdminPanel 
        open={isAdminPanelOpen} 
        onOpenChange={setIsAdminPanelOpen}
        isScreenLocked={isScreenLocked}
        onLockChange={setIsScreenLocked}
      />
    </div>
  );
}
