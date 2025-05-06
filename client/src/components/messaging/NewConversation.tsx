import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Loader2, Search, User as UserIcon } from "lucide-react";
import { User } from "@shared/schema";

interface NewConversationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: number) => void;
}

export function NewConversation({ open, onOpenChange, onSelectUser }: NewConversationProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all users (should only be accessible by admins)
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: open && !!user && user.role === "admin",
  });
  
  const filteredUsers = users?.filter((u: User) => {
    // Don't show current user
    if (u.id === user?.id) return false;
    
    // Filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        u.username.toLowerCase().includes(query) ||
        (u.fullName && u.fullName.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  const handleSelectUser = (userId: number) => {
    onSelectUser(userId);
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a new conversation</DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="pr-10"
          />
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        
        <ScrollArea className="h-[300px] border rounded-md">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredUsers?.length ? (
            <div className="p-1">
              {filteredUsers.map((user: User) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className="w-full text-left p-2 hover:bg-muted rounded-md flex items-center gap-2"
                >
                  <div className="bg-primary/10 text-primary p-1.5 rounded-full">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{user.fullName || user.username}</p>
                    {user.fullName && (
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-muted-foreground">
              {searchQuery ? "No users found" : "No other users available"}
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
