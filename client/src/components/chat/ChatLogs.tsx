import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, AlertCircle, FileText } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// Use the same interface as in Chat.tsx
interface ChatMessage {
  id: number;
  content: string;
  userId: number;
  timestamp: Date;
  isDeleted: boolean;
  user?: {
    id: number;
    username: string;
    fullName: string;
    role: string;
  };
}

interface UserInfo {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

export function ChatLogs() {
  const { user } = useAuth();
  
  // This component is only for admins
  if (user?.role !== "admin") {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium">Unauthorized</h3>
        <p className="text-sm text-gray-500 mt-2">
          Only administrators can access chat logs.
        </p>
      </div>
    );
  }

  // Fetch all chat messages, including deleted ones
  const { data: chatMessages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/chat", { signal });
      if (!res.ok) {
        throw new Error("Failed to fetch chat messages");
      }
      return res.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch users information
  const { data: users = [] } = useQuery<UserInfo[]>({
    queryKey: ["/api/users"],
    queryFn: async ({ signal }) => {
      try {
        const res = await fetch("/api/users", { signal });
        if (!res.ok) {
          return [];
        }
        return res.json();
      } catch (error) {
        return [];
      }
    }
  });

  const getUserInfo = (userId: number) => {
    const foundUser = users.find((u: UserInfo) => u.id === userId);
    if (foundUser) {
      return foundUser;
    }
    
    // Check if the user info is included with the message
    const messageWithUser = chatMessages.find(msg => msg.userId === userId && msg.user);
    if (messageWithUser && messageWithUser.user) {
      return messageWithUser.user;
    }
    
    return { id: userId, username: `User ${userId}`, fullName: `User ${userId}`, role: "unknown" };
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getMessageStatusLabel = (message: ChatMessage) => {
    if (message.isDeleted) {
      return <span className="text-red-500 text-xs">Deleted</span>;
    }
    return <span className="text-green-500 text-xs">Active</span>;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6 gap-2">
        <FileText className="h-5 w-5" />
        <h2 className="text-xl font-bold">Chat Logs</h2>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading chat logs...</div>
      ) : chatMessages.length === 0 ? (
        <div className="text-center py-8">No chat messages found</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableCaption>Complete history of all chat messages</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chatMessages.map((message) => {
                const userInfo = getUserInfo(message.userId);
                return (
                  <TableRow 
                    key={message.id}
                    className={message.isDeleted ? "bg-red-50/30" : ""}
                  >
                    <TableCell className="font-medium">{message.id}</TableCell>
                    <TableCell>
                      {userInfo.username}
                      {userInfo.role === "admin" && (
                        <span className="ml-1 text-xs px-1 py-0.5 bg-red-100 text-red-800 rounded">
                          Admin
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={message.isDeleted ? "line-through text-gray-500" : ""}>
                      {message.content}
                    </TableCell>
                    <TableCell>{formatTimestamp(message.timestamp)}</TableCell>
                    <TableCell className="text-right">
                      {getMessageStatusLabel(message)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}