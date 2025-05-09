import React from "react";
import { useOnlineUsers } from "@/hooks/use-online-users";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface OnlineUsersListProps {
  currentPage?: string;
  maxHeight?: string;
}

export function OnlineUsersList({ currentPage, maxHeight = "300px" }: OnlineUsersListProps) {
  const { data: onlineUsers, isLoading, error } = useOnlineUsers(currentPage);

  // Get user initials for avatar
  const getUserInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map(name => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (error) {
    return (
      <Card>
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium">Online Users</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="text-sm text-muted-foreground">Failed to load online users</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Online Users</span>
          {!isLoading && (
            <Badge variant="outline" className="ml-2">
              {onlineUsers?.length || 0}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <ScrollArea className={`pr-2 ${maxHeight ? `max-h-[${maxHeight}]` : ""}`}>
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center mb-2 p-1">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="ml-2 space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </>
          ) : onlineUsers && onlineUsers.length > 0 ? (
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center p-1 rounded hover:bg-accent/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getUserInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-2">
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.currentPage ? `On: ${user.currentPage}` : "Online"}
                    </p>
                  </div>
                  {user.role === "admin" && (
                    <Badge className="ml-auto" variant="secondary">Admin</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground">
              <User className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-sm">No users online</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}