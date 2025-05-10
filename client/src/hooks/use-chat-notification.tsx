import { useState, useEffect, useCallback } from 'react';

interface UseChatNotificationProps {
  messages: any[];
  previousLength?: number;
}

export function useChatNotification({ messages, previousLength = 0 }: UseChatNotificationProps) {
  const [lastLength, setLastLength] = useState(previousLength || messages.length);
  const [newMessageReceived, setNewMessageReceived] = useState(false);

  // Check for new messages
  useEffect(() => {
    if (messages.length > lastLength) {
      setNewMessageReceived(true);
      // Change the title to show notification
      document.title = "New Chat Notification";
      
      // Set a timeout to restore the title after just 2 seconds
      const timeoutId = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          document.title = "Maths Homework";
          setNewMessageReceived(false);
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
    
    setLastLength(messages.length);
  }, [messages.length, lastLength]);
  
  // Reset notification when the document becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && newMessageReceived) {
        document.title = "Maths Homework";
        setNewMessageReceived(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [newMessageReceived]);
  
  // Manually reset notification
  const resetNotification = useCallback(() => {
    document.title = "Maths Homework";
    setNewMessageReceived(false);
  }, []);
  
  return {
    newMessageReceived,
    resetNotification
  };
}