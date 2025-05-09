import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { OnlineUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function useOnlineUsers(currentPage?: string) {
  const { toast } = useToast();
  
  const queryOptions: UseQueryOptions<OnlineUser[]> = {
    queryKey: ["/api/online-users"],
    queryFn: async () => {
      const url = currentPage 
        ? `/api/online-users?page=${encodeURIComponent(currentPage)}` 
        : "/api/online-users";
      
      const response = await fetch(url, {
        credentials: "include"
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to fetch online users");
      }
      
      return response.json();
    },
    // Refresh every 15 seconds to keep the list updated
    refetchInterval: 15000,
    // Don't throw errors to the UI
    useErrorBoundary: false,
    // Retry fewer times
    retry: 2,
  };
  
  const query = useQuery<OnlineUser[]>(queryOptions);
  
  // Handle error through an effect to avoid render loops
  useEffect(() => {
    if (query.error) {
      console.error("Error fetching online users:", query.error);
      // We'll only show an error toast on the first error
      if (query.failureCount === 1) {
        toast({
          title: "Error",
          description: "Failed to load online users list",
          variant: "destructive",
        });
      }
    }
  }, [query.error, query.failureCount, toast]);
  
  return query;
}