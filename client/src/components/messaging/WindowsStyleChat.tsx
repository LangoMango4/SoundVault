import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@shared/schema";
import { X, HelpCircle } from "lucide-react";

interface Conversation {
  user: Omit<User, "password">;
  messages: Message[];
  unreadCount: number;
}

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface WindowsStyleChatProps {
  recipientId: number;
  onClose: () => void;
}

export function WindowsStyleChat({ recipientId, onClose }: WindowsStyleChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages when they change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Fetch conversation with selected user
  const { data: conversation, isLoading } = useQuery<Conversation>({
    queryKey: ["/api/private-messages", recipientId],
    refetchInterval: 5000, // Refetch every 5 seconds
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", "/api/private-messages", { 
        recipientId, 
        content 
      });
      return res.json();
    },
    onSuccess: () => {
      // Clear input and refetch messages
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/private-messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/private-messages", recipientId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);
  
  // Handler for sending a message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessageMutation.mutate(messageInput.trim());
  };
  
  // Handler for keypress (to allow Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (!user) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Title bar */}
        <div className="bg-green-600 text-white px-2 py-1 flex justify-between items-center">
          <span className="text-sm font-medium">
            {conversation && conversation.user ? `${conversation.user.fullName || conversation.user.username} - Chat` : 'Loading...'}
          </span>
          <div className="flex items-center">
            <button 
              className="text-white hover:bg-green-700 px-1"
              onClick={(e) => {
                e.stopPropagation();
                // Help functionality could be added here
              }}
            >
              <HelpCircle className="h-4 w-4" />
            </button>
            <button 
              className="text-white hover:bg-green-700 px-1 ml-1"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Chat content */}
        <ScrollArea className="flex-1 p-2 h-[350px] bg-gray-50">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : conversation?.messages && conversation.messages.length > 0 ? (
            <div className="space-y-2">
              {conversation.messages.map((message: Message) => {
                const isSentByMe = message.senderId === user.id;
                return (
                  <div key={message.id}>
                    {!isSentByMe && (
                      <div className="text-xs font-medium text-blue-600 mt-2">
                        {conversation.user.fullName || conversation.user.username}:
                      </div>
                    )}
                    {isSentByMe && (
                      <div className="text-xs font-medium text-green-600 mt-2">
                        You sent:
                      </div>
                    )}
                    <div className="pl-2">{message.content}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          )}
        </ScrollArea>
        
        {/* Message input */}
        <div className="p-2 border-t flex items-center">
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 mr-2 h-8"
          />
          <Button 
            className="h-8"
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sendMessageMutation.isPending}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
