import { useQuery } from "@tanstack/react-query";
import { OnlineUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useOnlineUsers(currentPage?: string) {
  const { toast } = useToast();
  
  return useQuery<OnlineUser[]>({
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
    onError: (error) => {
      console.error("Error fetching online users:", error);
      toast({
        title: "Error",
        description: "Failed to load online users list",
        variant: "destructive",
      });
    },
    // Refresh every 15 seconds to keep the list updated
    refetchInterval: 15000,
  });
}