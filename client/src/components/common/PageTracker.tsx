import { useEffect, ReactNode } from "react";

interface PageTrackerProps {
  pageName: string;
  children: ReactNode;
}

/**
 * Component to track the current page for the online users list
 * Use this to wrap pages or sections where you want to show a specific label
 * in the online users list
 */
export function PageTracker({ pageName, children }: PageTrackerProps) {
  useEffect(() => {
    // Update online status with the current page name
    const updatePageStatus = async () => {
      try {
        await fetch(`/api/online-users?page=${encodeURIComponent(pageName)}`, {
          method: 'GET',
          credentials: 'include'
        });
      } catch (error) {
        console.error("Failed to update online status with page name:", error);
      }
    };
    
    // Update immediately and then every second for real-time status updates
    updatePageStatus();
    const interval = setInterval(updatePageStatus, 1000);
    
    return () => clearInterval(interval);
  }, [pageName]);
  
  return <>{children}</>;
}