import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PrivateMessaging } from "./PrivateMessaging";
import { WindowsStyleChat } from "./WindowsStyleChat";
import { NewConversation } from "./NewConversation";
import { MessageSquare, User, Plus } from "lucide-react";

enum ChatStyle {
  MODERN = "modern",
  WINDOWS = "windows"
}

export function PrivateMessagingManager() {
  const { user } = useAuth();
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [chatStyle, setChatStyle] = useState<ChatStyle>(ChatStyle.MODERN);
  
  // Show different interfaces for admins and regular users
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
        <MessageSquare className="h-16 w-16 text-gray-300" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Private Messaging</h3>
          <p className="text-gray-500">
            Please log in to access private messaging features.
          </p>
        </div>
      </div>
    );
  }
  
  // For regular users, we only show received messages, they can't initiate new chats
  if (user.role !== "admin") {
    return (
      <div className="h-full flex flex-col">
        <div className="py-2 px-4 flex justify-between items-center border-b bg-blue-50">
          <h2 className="text-lg font-medium">Private Messages</h2>
          <div className="px-2 py-1 bg-blue-100 rounded-md text-xs">
            Messages from administrators
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <PrivateMessaging />
        </div>
      </div>
    );
  }
  
  // Toggle between chat styles
  const toggleChatStyle = () => {
    setChatStyle(chatStyle === ChatStyle.MODERN ? ChatStyle.WINDOWS : ChatStyle.MODERN);
  };
  
  if (chatStyle === ChatStyle.WINDOWS && activeConversation) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
          <div className="flex flex-col items-center space-y-4">
            <Button onClick={() => setActiveConversation(null)} variant="outline">
              Close Chat
            </Button>
            <Button onClick={toggleChatStyle} variant="outline">
              Switch to Modern UI
            </Button>
          </div>
        </div>
        
        <WindowsStyleChat 
          recipientId={activeConversation} 
          onClose={() => setActiveConversation(null)}
        />
      </>
    );
  }
  
  if (chatStyle === ChatStyle.MODERN) {
    return (
      <div className="h-full flex flex-col">
        <div className="py-2 px-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-medium">Private Messages</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleChatStyle}
            >
              Switch to Windows UI
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsStartingChat(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Chat
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <PrivateMessaging />
        </div>
        
        <NewConversation 
          open={isStartingChat}
          onOpenChange={setIsStartingChat}
          onSelectUser={setActiveConversation}
        />
      </div>
    );
  }
  
  // Windows chat style without an active conversation
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
      <User className="h-16 w-16 text-gray-300" />
      <div className="text-center space-y-4">
        <h3 className="text-lg font-medium">Windows-Style Chat</h3>
        <p className="text-gray-500">
          Select a user to start a conversation
        </p>
        <div className="flex flex-col space-y-2">
          <Button onClick={() => setIsStartingChat(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Start New Chat
          </Button>
          <Button onClick={toggleChatStyle} variant="outline">
            Switch to Modern UI
          </Button>
        </div>
      </div>
      
      <NewConversation 
        open={isStartingChat}
        onOpenChange={setIsStartingChat}
        onSelectUser={setActiveConversation}
      />
    </div>
  );
}
