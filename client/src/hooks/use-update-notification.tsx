import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

interface UseUpdateNotificationResult {
  showUpdateNotification: boolean;
  showTermsAndConditions: boolean;
  hideUpdateNotification: () => void;
  hideTermsAndConditions: () => void;
  refreshPage: () => void;
}

// Version control to show notification when version changes
const CURRENT_VERSION = '1.3.0'; // Snake, TicTacToe, MathPuzzle games added
const VERSION_STORAGE_KEY = 'math-homework-version';
const LAST_ACTIVITY_KEY = 'math-homework-last-activity';
const TERMS_SHOWN_KEY = 'math-homework-terms-shown-session';
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export function useUpdateNotification(): UseUpdateNotificationResult {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false);
  const { user, logoutMutation } = useAuth();
  
  // Terms and conditions are no longer shown automatically
  useEffect(() => {
    if (user) {
      // Terms are permanently hidden
      setShowTermsAndConditions(false);
      sessionStorage.setItem(TERMS_SHOWN_KEY, 'true');
    }
  }, [user]);
  
  // Show update notification when new version is deployed
  useEffect(() => {
    if (user) {
      const lastSeenVersion = localStorage.getItem(VERSION_STORAGE_KEY);
      
      if (lastSeenVersion !== CURRENT_VERSION) {
        setShowUpdateNotification(true);
      }
    }
  }, [user]);
  
  // Track user activity and log out after inactivity
  useEffect(() => {
    if (!user) return;
    
    // Update last activity timestamp
    const updateActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    };
    
    // Initial activity timestamp when component mounts
    updateActivity();
    
    // Add event listeners for user activity
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);
    
    // Check for inactivity periodically
    const checkInactivity = () => {
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now());
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivity;
      
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        console.log('User inactive for 10 minutes, logging out...');
        logoutMutation.mutate();
      }
    };
    
    const inactivityTimer = setInterval(checkInactivity, 60000); // Check every minute
    
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      clearInterval(inactivityTimer);
    };
  }, [user, logoutMutation]);
  
  const hideUpdateNotification = () => {
    setShowUpdateNotification(false);
    localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
  };
  
  const hideTermsAndConditions = () => {
    setShowTermsAndConditions(false);
    sessionStorage.setItem(TERMS_SHOWN_KEY, 'true');
  };
  
  const refreshPage = () => {
    window.location.reload();
  };
  
  return {
    showUpdateNotification,
    showTermsAndConditions,
    hideUpdateNotification,
    hideTermsAndConditions,
    refreshPage
  };
}
