import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, AlertCircle, Info } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useChatNotification } from "@/hooks/use-chat-notification";

interface ChatMessage {
  id: number;
  content: string;
  userId: number;
  timestamp: Date;
  isDeleted: boolean;
  isSystem?: boolean;
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

export function Chat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  // Fetch all chat messages
  const { data: chatMessages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat"],
    queryFn: async ({ signal }) => {
      const res = await fetch("/api/chat", { signal });
      if (!res.ok) {
        throw new Error("Failed to fetch chat messages");
      }
      
      const messages = await res.json();
      
      // Hide deleted messages for everyone in the chat (they'll still be visible in chat logs for admins)
      return messages.filter((msg: ChatMessage) => !msg.isDeleted);
    },
    refetchInterval: 1000 // Auto refresh every 1 second to show new messages
  });
  
  // Use chat notification hook after messages are loaded
  const { newMessageReceived, resetNotification } = useChatNotification({
    messages: chatMessages,
    previousLength: previousMessageCount
  });

  // Update the previous message count when messages change
  useEffect(() => {
    setPreviousMessageCount(chatMessages.length);
  }, [chatMessages.length]);
  
  // Add page tracking for online users list - set to update every 1 second
  useEffect(() => {
    // Update online status with "Chat" page name
    const updatePageStatus = async () => {
      try {
        await fetch(`/api/online-users?page=Chat`, {
          method: 'GET',
          credentials: 'include'
        });
      } catch (error) {
        console.error("Failed to update status with Chat page:", error);
      }
    };
    
    // Update immediately and then every second
    updatePageStatus();
    const interval = setInterval(updatePageStatus, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Fetch all users to show their names with messages
  const { data: users = [] } = useQuery<UserInfo[]>({
    queryKey: ["/api/users"],
    queryFn: async ({ signal }) => {
      // Only admins can fetch all users, so we'll handle the error gracefully
      try {
        const res = await fetch("/api/users", { signal });
        if (!res.ok) {
          return [];
        }
        return res.json();
      } catch (error) {
        return [];
      }
    },
    enabled: user?.role === "admin"
  });

  // Send a new chat message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/chat", { content });
      return res.json();
    },
    onSuccess: (newMessage: ChatMessage) => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      
      // Messages now stay permanently as requested
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a chat message (soft delete)
  const deleteMessageMutation = useMutation({
    mutationFn: async ({ id, autoDelete = false, showNotification = true }: { id: number, autoDelete?: boolean, showNotification?: boolean }) => {
      const res = await apiRequest("DELETE", `/api/chat/${id}?autoDelete=${autoDelete}`);
      return { data: await res.json(), showNotification };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      
      // Only show toast for manual deletions, not auto-deletions
      if (result.showNotification) {
        toast({
          title: "Message deleted",
          description: "The message has been successfully deleted.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getUserInfo = (userId: number) => {
    // For admin, we can get user info from the users list
    if (user?.role === "admin") {
      const foundUser = users.find((u: UserInfo) => u.id === userId);
      if (foundUser) {
        return {
          username: foundUser.username,
          fullName: foundUser.fullName,
          role: foundUser.role
        };
      }
    }
    
    // For current user we can use their own info
    if (userId === user?.id) {
      return {
        username: user.username,
        fullName: user.fullName,
        role: user.role
      };
    }
    
    // For message user info (if available in the message)
    const matchingMessage = chatMessages.find(msg => msg.userId === userId && msg.user);
    if (matchingMessage && matchingMessage.user) {
      return {
        username: matchingMessage.user.username,
        fullName: matchingMessage.user.fullName,
        role: matchingMessage.user.role
      };
    }
    
    // Default for other users
    return {
      username: `User ${userId}`,
      fullName: `User ${userId}`,
      role: "user"
    };
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const canDeleteMessage = (message: ChatMessage) => {
    return user?.role === "admin" || message.userId === user?.id;
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 mb-4">
          <ScrollArea className="h-[60vh]">
            <div className="p-4 space-y-4">
              {chatMessages.length === 0 && !isLoading ? (
                <div className="text-center text-gray-500 pt-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  // Handle system messages differently
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="bg-gray-100 px-3 py-1 rounded-md text-xs text-gray-600 max-w-[80%] text-center">
                          <Info className="h-3 w-3 inline-block mr-1" />
                          {msg.content}
                        </div>
                      </div>
                    );
                  }
                  
                  const isCurrentUser = msg.userId === user?.id;
                  const userInfo = getUserInfo(msg.userId);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isCurrentUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <Card className={`max-w-[80%] ${msg.isDeleted ? "opacity-60" : ""}`}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            {!isCurrentUser && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {userInfo.fullName.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <div className="font-medium text-sm">
                                  {userInfo.fullName}
                                  {userInfo.role === "admin" && (
                                    <span className="ml-1 text-xs px-1 py-0.5 bg-red-100 text-red-800 rounded">
                                      Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatTimestamp(msg.timestamp)}
                                </div>
                              </div>
                              <div className="break-words">
                                {msg.isDeleted ? (
                                  <div className="flex items-center gap-1 py-1">
                                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                                    <span className="italic text-gray-500 text-xs">Message was deleted by {userInfo.fullName}</span>
                                  </div>
                                ) : (
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="text-sm">{msg.content}</div>
                                    {canDeleteMessage(msg) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => deleteMessageMutation.mutate({ id: msg.id, showNotification: true })}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })
              )}
              {isLoading && (
                <div className="text-center text-gray-500 py-4">
                  Loading messages...
                </div>
              )}
              {/* This div is used for auto-scrolling to the latest message */}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>
        
        <div className="sticky bottom-0 p-2 bg-white">
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sendMessageMutation.isPending}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}