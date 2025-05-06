import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface UseUpdateNotificationResult {
  showUpdateNotification: boolean;
  hideUpdateNotification: () => void;
}

// Version control to show notification when version changes
const CURRENT_VERSION = '1.3.0'; // Snake, TicTacToe, MathPuzzle games added
const VERSION_STORAGE_KEY = 'math-homework-version';

export function useUpdateNotification(): UseUpdateNotificationResult {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const { user } = useAuth();
  
  // Show update notification when user logs in and version has changed
  useEffect(() => {
    if (user) {
      const lastSeenVersion = localStorage.getItem(VERSION_STORAGE_KEY);
      
      if (lastSeenVersion !== CURRENT_VERSION) {
        setShowUpdateNotification(true);
      }
    }
  }, [user]);
  
  const hideUpdateNotification = () => {
    setShowUpdateNotification(false);
    localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
  };
  
  return {
    showUpdateNotification,
    hideUpdateNotification
  };
}
