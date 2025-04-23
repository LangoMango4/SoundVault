import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { ContentTabs } from "@/components/layout/ContentTabs";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { LockScreen } from "@/components/layout/LockScreen";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

type HomePageProps = {
  initialTab?: string;
};

export default function HomePage({ initialTab }: HomePageProps = {}) {
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

  // Update local state when the query data changes
  useEffect(() => {
    if (lockData) {
      // Only admins can unlock the screen, so regular users will always see it as locked
      // if the server says it's locked
      setIsScreenLocked(lockData.locked);
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
        <ContentTabs initialTab={initialTab} />
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
