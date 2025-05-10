import { useQuery } from "@tanstack/react-query";
import { OnlineUser } from "@shared/schema";

/**
 * Hook to fetch online users with React Query
 */
export function useOnlineUsers(currentPage?: string) {
  const queryUrl = currentPage 
    ? `/api/online-users?page=${encodeURIComponent(currentPage)}` 
    : "/api/online-users";

  // Use TanStack Query V5 pattern
  const query = useQuery({
    queryKey: ['onlineUsers', currentPage],
    queryFn: async () => {
      try {
        const response = await fetch(queryUrl, {
          credentials: "include"
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            return []; 
          }
          throw new Error("Failed to fetch online users");
        }
        
        return await response.json() as OnlineUser[];
      } catch (error) {
        console.error("Error fetching online users:", error);
        return [];
      }
    },
    refetchInterval: 3000,
    staleTime: 2000,
    initialData: [],
    refetchOnWindowFocus: false,
    retry: false,
    gcTime: 0
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error as Error | null
  };
}