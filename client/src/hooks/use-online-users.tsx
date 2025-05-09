import { useQuery } from "@tanstack/react-query";
import { OnlineUser } from "@shared/schema";
import { useState, useEffect } from "react";

export function useOnlineUsers(currentPage?: string) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const url = currentPage 
          ? `/api/online-users?page=${encodeURIComponent(currentPage)}` 
          : "/api/online-users";
        
        const response = await fetch(url, {
          credentials: "include"
        });
        
        if (!response.ok) {
          // For 401 unauthorized, just return empty array without error
          if (response.status === 401) {
            setOnlineUsers([]);
            setError(null);
            return;
          }
          
          const errorText = await response.text();
          throw new Error(errorText || "Failed to fetch online users");
        }
        
        const data = await response.json();
        setOnlineUsers(data);
        setError(null);
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

    // Set up interval for periodic refreshes
    const interval = setInterval(fetchUsers, 15000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [currentPage]);

  return {
    data: onlineUsers,
    isLoading,
    error
  };
}