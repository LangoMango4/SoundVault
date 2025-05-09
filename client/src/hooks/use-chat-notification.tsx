import { useState, useEffect, useCallback } from 'react';

interface UseChatNotificationProps {
  messages: any[];
  previousLength?: number;
}

export function useChatNotification({ messages, previousLength = 0 }: UseChatNotificationProps) {
  const [lastLength, setLastLength] = useState(previousLength || messages.length);
  const [newMessageReceived, setNewMessageReceived] = useState(false);
  const [originalTitle, setOriginalTitle] = useState("Maths Homework");
  
  // Store original title on first render
  useEffect(() => {
    setOriginalTitle(document.title);
  }, []);

  // Check for new messages
  useEffect(() => {
    if (messages.length > lastLength) {
      setNewMessageReceived(true);
      // Change the title to show notification
      document.title = "New Chat Notification - Maths Homework";
      
      // Set a timeout to restore the title after a few seconds
      const timeoutId = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          document.title = originalTitle;
          setNewMessageReceived(false);
        }
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
    
    setLastLength(messages.length);
  }, [messages.length, lastLength, originalTitle]);
  
  // Reset notification when the document becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && newMessageReceived) {
        document.title = originalTitle;
        setNewMessageReceived(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [newMessageReceived, originalTitle]);
  
  // Manually reset notification
  const resetNotification = useCallback(() => {
    document.title = originalTitle;
    setNewMessageReceived(false);
  }, [originalTitle]);
  
  return {
    newMessageReceived,
    resetNotification
  };
}