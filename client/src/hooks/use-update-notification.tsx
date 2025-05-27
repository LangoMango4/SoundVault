import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Removed version control and deployment timestamp checking
// Only keeping terms and conditions and user activity tracking

const LAST_ACTIVITY_KEY = 'math-homework-last-activity';
const TERMS_SHOWN_KEY = 'math-homework-terms-shown-date';
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

// Removed version history data as it's no longer needed 

// Simplified interface without update notification functionality
export interface UseUpdateNotificationResult {
  showTermsAndConditions: boolean;
  hideTermsAndConditions: () => void;
  refreshPage: () => void;
}

export function useUpdateNotification(): UseUpdateNotificationResult {
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false);
  const { user, logoutMutation } = useAuth();
  
  // Show terms and conditions once per day
  useEffect(() => {
    if (user) {
      // Check when terms were last shown
      const lastTermsShownStr = localStorage.getItem(TERMS_SHOWN_KEY);
      const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      
      if (!lastTermsShownStr || lastTermsShownStr !== currentDate) {
        // If not shown today, show it
        setShowTermsAndConditions(true);
      } else {
        // Already shown today
        setShowTermsAndConditions(false);
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
  
  const hideTermsAndConditions = () => {
    setShowTermsAndConditions(false);
    // Store today's date to prevent showing again today
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    localStorage.setItem(TERMS_SHOWN_KEY, currentDate);
  };
  
  const refreshPage = () => {
    window.location.reload();
  };

  return {
    showTermsAndConditions,
    hideTermsAndConditions,
    refreshPage
  };
}
