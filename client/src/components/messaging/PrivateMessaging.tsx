import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User } from "@shared/schema";
import { Loader2, Send, RefreshCw } from "lucide-react";

interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  user: Omit<User, "password">;
  messages: Message[];
  unreadCount: number;
}

export function PrivateMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages when they change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Fetch conversations
  const { data: conversations = [], isLoading: isLoadingConversations, refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/private-messages"],
    refetchInterval: 15000 // Refetch every 15 seconds
  });
  
  // Fetch single conversation when a user is selected
  const { data: activeConversation, isLoading: isLoadingMessages, refetch: refetchMessages } = useQuery<Conversation>({
    queryKey: ["/api/private-messages", selectedUser],
    enabled: !!selectedUser,
    refetchInterval: selectedUser ? 5000 : false // Refetch more frequently when in active chat
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: number, content: string }) => {
      const res = await apiRequest("POST", "/api/private-messages", { recipientId, content });
      return res.json();
    },
    onSuccess: () => {
      // Clear input and refetch messages
      setMessageInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/private-messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/private-messages", selectedUser] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest("POST", `/api/private-messages/${messageId}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/private-messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/private-messages", selectedUser] });
    }
  });
  
  useEffect(() => {
    scrollToBottom();
  }, [activeConversation]);
  
  // Handler for sending a message
  const handleSendMessage = () => {
    if (!selectedUser || !messageInput.trim()) return;
    
    sendMessageMutation.mutate({
      recipientId: selectedUser,
      content: messageInput.trim()
    });
  };
  
  // Handler for keypress (to allow Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Please log in to use private messaging</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col md:flex-row h-full border rounded-md overflow-hidden">
      {/* Conversations sidebar */}
      <div className="w-full md:w-80 border-r bg-gray-50 flex flex-col">
        <div className="p-3 border-b flex justify-between items-center bg-white">
          <h3 className="font-medium">Conversations</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => refetchConversations()}
            disabled={isLoadingConversations}
          >
            {isLoadingConversations ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          {isLoadingConversations ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : conversations && conversations.length > 0 ? (
            <div className="flex flex-col">
              {conversations.map((conversation: Conversation) => (
                <button
                  key={conversation.user.id}
                  onClick={() => setSelectedUser(conversation.user.id)}
                  className={`flex items-center p-3 hover:bg-gray-100 text-left ${selectedUser === conversation.user.id ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">{conversation.user.fullName || conversation.user.username}</p>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.messages.length > 0 && (
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.messages[0].senderId === user.id ? 'You: ' : ''}
                        {conversation.messages[0].content}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-center p-4 text-gray-500">No conversations yet</p>
          )}
        </ScrollArea>
      </div>
      
      {/* Conversation area */}
      <div className="flex-1 flex flex-col h-full">
        {selectedUser ? (
          <>
            <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
              {activeConversation && activeConversation.user ? (
                <h3 className="font-medium">{activeConversation.user.fullName || activeConversation.user.username}</h3>
              ) : (
                <div className="h-6 animate-pulse bg-gray-200 rounded w-32"></div>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => refetchMessages()}
                disabled={isLoadingMessages}
              >
                {isLoadingMessages ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-3">
              {isLoadingMessages ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : activeConversation && activeConversation.messages ? (
                <div className="space-y-4">
                  {activeConversation.messages.map((message: Message) => {
                    const isSentByMe = message.senderId === user.id;
                    return (
                      <div 
                        key={message.id} 
                        className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] px-3 py-2 rounded-lg ${isSentByMe 
                            ? 'bg-blue-500 text-white rounded-br-none' 
                            : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
                        >
                          <p className="whitespace-pre-line break-words">{message.content}</p>
                          <p className={`text-xs mt-1 ${isSentByMe ? 'text-blue-100' : 'text-gray-500'}`}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isSentByMe && (
                              <span className="ml-2">
                                {message.isRead ? 'Read' : 'Delivered'}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <p className="text-center p-4 text-gray-500">Loading conversation...</p>
              )}
            </ScrollArea>
            
            <div className="p-3 border-t flex">
              <Input 
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 mr-2"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
