import { useQuery } from "@tanstack/react-query";
import { OnlineUser } from "@shared/schema";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

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
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize the fetchUsers function to prevent recreating it on each render
  const fetchUsers = useCallback(async () => {
    // Cancel any in-flight requests to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      // Only show loading indicator on first load
      if (isFirstLoadRef.current) {
        setIsLoading(true);
      }
      
      const url = currentPage 
        ? `/api/online-users?page=${encodeURIComponent(currentPage)}` 
        : "/api/online-users";
      
      const response = await fetch(url, {
        credentials: "include",
        signal: abortControllerRef.current.signal
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
      // Ignore AbortError as it's expected when we cancel requests
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("Error fetching online users:", err);
        setError(err);
      }
      // Don't clear users on error to avoid flickering
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, onlineUsers.length]);

  useEffect(() => {
    // Initial fetch
    fetchUsers();

    // Set up interval for refreshes, using a slightly longer interval to reduce network traffic
    // while still being responsive enough for user experience
    const interval = setInterval(fetchUsers, 3000);
    
    // Clean up interval and abort any in-flight requests on unmount
    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchUsers]);

  // Memoize the return value to prevent unnecessary re-renders of components using this hook
  return useMemo(() => ({
    data: onlineUsers,
    isLoading,
    error
  }), [onlineUsers, isLoading, error]);
}