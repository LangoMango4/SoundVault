import { useQuery } from "@tanstack/react-query";
import { OnlineUser } from "@shared/schema";
import { useState, useEffect, useRef } from "react";

// Helper function to compare two arrays of online users
function haveSameUsers(oldUsers: OnlineUser[], newUsers: OnlineUser[]): boolean {
  if (oldUsers.length !== newUsers.length) return false;
  
  // Simple object-based comparison approach - create a string key for each user
  const oldUserSet = new Set(
    oldUsers.map(user => `${user.id}-${user.currentPage || ''}-${user.lastActivity || ''}`)
  );
  
  const newUserSet = new Set(
    newUsers.map(user => `${user.id}-${user.currentPage || ''}-${user.lastActivity || ''}`)
  );
  
  // If sets have different sizes, they're not the same
  if (oldUserSet.size !== newUserSet.size) return false;
  
  // Check if all entries from old set exist in new set
  const oldUserArray = Array.from(oldUserSet);
  for (let i = 0; i < oldUserArray.length; i++) {
    if (!newUserSet.has(oldUserArray[i])) {
      return false;
    }
  }
  
  return true;
}

export function useOnlineUsers(currentPage?: string) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const previousUsersRef = useRef<OnlineUser[]>([]);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Only show loading indicator on first load
        if (isFirstLoadRef.current) {
          setIsLoading(true);
        }
        
        const url = currentPage 
          ? `/api/online-users?page=${encodeURIComponent(currentPage)}` 
          : "/api/online-users";
        
        const response = await fetch(url, {
          credentials: "include"
        });
        
        if (!response.ok) {
          // For 401 unauthorized, just return empty array without error
          if (response.status === 401) {
            if (isFirstLoadRef.current || onlineUsers.length > 0) {
              setOnlineUsers([]);
            }
            setError(null);
            return;
          }
          
          const errorText = await response.text();
          throw new Error(errorText || "Failed to fetch online users");
        }
        
        const data = await response.json();
        
        // Only update state if the data has actually changed
        // This prevents unnecessary re-renders
        if (isFirstLoadRef.current || !haveSameUsers(previousUsersRef.current, data)) {
          setOnlineUsers(data);
          previousUsersRef.current = data;
        }
        
        setError(null);
        isFirstLoadRef.current = false;
      } catch (err) {
        console.error("Error fetching online users:", err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        // Don't clear users on error to avoid flickering
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchUsers();

    // Set up interval for refreshes, but at a slightly reduced rate to minimize network traffic
    const interval = setInterval(fetchUsers, 2000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [currentPage]);

  return {
    data: onlineUsers,
    isLoading,
    error
  };
}