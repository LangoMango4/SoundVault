import { useState, useEffect, useRef } from 'react';

// Default title of the application
const DEFAULT_TITLE = 'Maths Homework';
// Title to show when a new chat message arrives
const NOTIFICATION_TITLE = 'New Chat Notification';
// Duration to show the notification title (in milliseconds)
const NOTIFICATION_DURATION = 3500; // 3.5 seconds

export interface UseChatNotificationResult {
  showNotification: () => void;
}

export function useChatNotification(): UseChatNotificationResult {
  const [showingNotification, setShowingNotification] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  
  // Function to clear any existing timeout
  const clearNotificationTimeout = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  // Effect to update document title based on notification state
  useEffect(() => {
    if (showingNotification) {
      // Update title when notification is active
      document.title = NOTIFICATION_TITLE;
      
      // Set timeout to clear notification after duration
      clearNotificationTimeout();
      timeoutRef.current = window.setTimeout(() => {
        setShowingNotification(false);
      }, NOTIFICATION_DURATION);
    } else {
      // Restore default title
      document.title = DEFAULT_TITLE;
    }
    
    // Clean up timeout on component unmount
    return () => {
      clearNotificationTimeout();
    };
  }, [showingNotification]);
  
  // Function to trigger notification
  const showNotification = () => {
    // Only trigger if not already showing notification
    if (!showingNotification) {
      setShowingNotification(true);
    } else {
      // Reset timer if already showing notification
      clearNotificationTimeout();
      timeoutRef.current = window.setTimeout(() => {
        setShowingNotification(false);
      }, NOTIFICATION_DURATION);
    }
  };
  
  return { showNotification };
}