import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Exported interface definition moved below

// Version control to show notification when version changes
export const CURRENT_VERSION = '1.6.0'; // Current version displayed in notification
const VERSION_STORAGE_KEY = 'math-homework-version';
const DEPLOYMENT_CHECK_KEY = 'math-homework-last-deployment-check';
const DEPLOYMENT_TIMESTAMP_KEY = 'math-homework-deployment-timestamp';
const LAST_ACTIVITY_KEY = 'math-homework-last-activity';
const TERMS_SHOWN_KEY = 'math-homework-terms-shown-date';
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const DEPLOYMENT_CHECK_INTERVAL = 2 * 60 * 1000; // Check for new deployment every 2 minutes

// Version history with information about each update
export const VERSION_HISTORY: Record<string, { title: string; date: string; changes: string[] }> = {
  '1.6.0': {
    title: 'Enhancement Update',
    date: '2025-05-10',
    changes: [
      'Added update changelog notifications when the site is redeployed',
      'Improved broadcast message system with better dismissal tracking',
      'Chat notification title now shows for only 2 seconds',
      'Visual indicators for dismissed and deleted messages',
      'Fixed notification display for previously viewed messages'
    ]
  },
  '1.5.0': {
    title: 'Feature Update',
    date: '2025-05-07',
    changes: [
      'Added automatic update notification after deployment',
      'Changed Ninja Run game to Geometry Dash',
      'Simplified broadcast message form',
      'Fixed various minor bugs and improved performance'
    ]
  },
  '1.0.0': {
    title: 'Initial Release',
    date: '2025-04-20',
    changes: [
      'Initial release of Maths Homework',
      'Added soundboard functionality',
      'Implemented basic chat system',
      'Created admin panel for managing sounds and users'
    ]
  },
  '1.1.0': {
    title: 'Security Update',
    date: '2025-04-25',
    changes: [
      'Added "Teacher Inbound" emergency button',
      'Implemented screen lock feature with PIN protection',
      'Added keyboard shortcut (Alt) for quick hide functionality',
      'Improved security with auto-logout after 10 minutes of inactivity'
    ]
  },
  '1.2.0': {
    title: 'Performance & UI Improvements',
    date: '2025-04-30',
    changes: [
      'Fixed connectivity issues with enhanced keepalive mechanism',
      'Improved UI responsiveness across different devices',
      'Added Windows-style notification system',
      'Updated Terms & Conditions dialog',
      'Changed emergency shortcut to Escape+T to avoid Zscaler conflicts'
    ]
  },
  '1.3.0': {
    title: 'Games Update',
    date: '2025-05-05',
    changes: [
      'Added Snake game with persistent high scores',
      'Added Tic-Tac-Toe game with local multiplayer',
      'Added Math Puzzle game with random challenges',
      'Implemented game leaderboards system',
      'Fixed notification spam issues'
    ]
  },
  '1.4.0': {
    title: 'UI Enhancements',
    date: '2025-05-06',
    changes: [
      'Redesigned update notification with changelog view',
      'Fixed connectivity detection to prevent false offline warnings',
      'Enhanced navigation with improved menu responsiveness',
      'Improved game performance for slower devices',
      'Added Terms & Conditions acceptance logs with search functionality'
    ]
  }
}

interface VersionDetails {
  title: string;
  date: string;
  changes: string[];
}

export interface UseUpdateNotificationResult {
  showUpdateNotification: boolean;
  showTermsAndConditions: boolean;
  hideUpdateNotification: () => void;
  hideTermsAndConditions: () => void;
  refreshPage: () => void;
  currentVersionDetails: VersionDetails;
  testShowUpdateNotification: () => void; // For testing purpose only
  checkForDeployment?: () => Promise<boolean | void | undefined>; // Manual deployment check for testing
}

export function useUpdateNotification(): UseUpdateNotificationResult {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
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
  
  // Show update notification when new version is deployed
  useEffect(() => {
    if (user) {
      const lastSeenVersion = localStorage.getItem(VERSION_STORAGE_KEY);
      
      if (lastSeenVersion !== CURRENT_VERSION) {
        setShowUpdateNotification(true);
      }
    }
  }, [user]);
  
  // Check for new deployment periodically - with rate limiting
  useEffect(() => {
    if (!user) return;
    
    // Function to check for new deployment
    const checkForDeployment = async () => {
      try {
        // Prevent spamming by checking when we last checked
        const lastCheck = Number(localStorage.getItem(DEPLOYMENT_CHECK_KEY) || '0');
        const currentTime = Date.now();
        
        // Only check if it's been at least 2 minutes since the last check
        if (currentTime - lastCheck < DEPLOYMENT_CHECK_INTERVAL) {
          return;
        }
        
        // Update the check time before making the request
        localStorage.setItem(DEPLOYMENT_CHECK_KEY, currentTime.toString());
        
        // Add timeout to the fetch request to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          const response = await fetch('/api/deployment', {
            signal: controller.signal,
            cache: 'no-store' // Prevent caching issues
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) return;
          
          const data = await response.json();
          const storedTimestamp = localStorage.getItem(DEPLOYMENT_TIMESTAMP_KEY);
          
          // If we don't have a stored timestamp, store the current one
          if (!storedTimestamp) {
            localStorage.setItem(DEPLOYMENT_TIMESTAMP_KEY, data.timestamp);
            // Also store the current version to prevent duplicate notifications
            localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
            return;
          }
          
          // If the deployment timestamp is newer than our stored one and the difference is
          // significant (more than 5 seconds to avoid false triggers)
          const timeDifference = Number(data.timestamp) - Number(storedTimestamp);
          if (timeDifference > 5000) {
            localStorage.setItem(DEPLOYMENT_TIMESTAMP_KEY, data.timestamp);
            
            // Check if we've already shown a notification for this version within this session
            const hasShownUpdateThisSession = sessionStorage.getItem('update-notification-shown');
            if (!hasShownUpdateThisSession) {
              // Mark as shown in this session
              sessionStorage.setItem('update-notification-shown', 'true');
              
              // Clear the version storage key to force showing update notification
              localStorage.removeItem(VERSION_STORAGE_KEY);
              
              // Show update notification
              setShowUpdateNotification(true);
            }
          }
        } catch (error) {
          clearTimeout(timeoutId);
          
          // Handle fetch timeout silently
          if (error instanceof Error && error.name === 'AbortError') {
            // Request timed out - we'll try again next time
            return;
          }
          
          // For other fetch errors, update the timestamp to avoid spam in error logs
          const errorCheckKey = 'last-deployment-error-logged';
          const lastErrorTime = localStorage.getItem(errorCheckKey);
          const currentTime = Date.now();
          
          // Only log errors once per hour to prevent console spam
          if (!lastErrorTime || currentTime - Number(lastErrorTime) > 3600000) {
            localStorage.setItem(errorCheckKey, currentTime.toString());
            console.warn('Deployment check temporary error - will retry later');
          }
        }
      } catch (error) {
        // Silent catch for any other unexpected errors
        // No logging to avoid console spam
      }
    };
    
    // Check once on load with a slight delay to avoid the initial load rush
    const initialCheckTimeout = setTimeout(checkForDeployment, 5000);
    
    // Then set up interval to check periodically - using a longer interval
    const deploymentInterval = setInterval(checkForDeployment, DEPLOYMENT_CHECK_INTERVAL * 2);
    
    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(deploymentInterval);
    };
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
    // Store today's date to prevent showing again today
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    localStorage.setItem(TERMS_SHOWN_KEY, currentDate);
  };
  
  const refreshPage = () => {
    window.location.reload();
  };
  
  // Get current version details
  const currentVersionDetails = VERSION_HISTORY[CURRENT_VERSION];
  
  // Testing function to force show the update notification dialog
  const testShowUpdateNotification = () => {
    console.log('Test notification triggered');
    setShowUpdateNotification(true);
    
    // Also manually update localStorage to simulate a first-time view of this version
    localStorage.removeItem(VERSION_STORAGE_KEY);
  };

  // Extract checkForDeployment function for manual testing
  const checkForDeploymentManually = useCallback(async () => {
    try {
      // Add rate-limiting for the manual check too (5 seconds between checks)
      const lastCheck = Number(localStorage.getItem(DEPLOYMENT_CHECK_KEY) || '0');
      const currentTime = Date.now();
      
      if (currentTime - lastCheck < 5000) {
        console.log('Rate limited: Can only check for deployments every 5 seconds');
        return;
      }
      
      // Update the check time before making the request
      localStorage.setItem(DEPLOYMENT_CHECK_KEY, currentTime.toString());
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      try {
        const response = await fetch('/api/deployment', {
          signal: controller.signal,
          cache: 'no-store' // Prevent caching issues
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.log('Deployment endpoint returned non-success status:', response.status);
          return;
        }
        
        const data = await response.json();
        const storedTimestamp = localStorage.getItem(DEPLOYMENT_TIMESTAMP_KEY);
        
        // If we don't have a stored timestamp, store the current one
        if (!storedTimestamp) {
          console.log('Initial deployment timestamp stored:', data.timestamp);
          localStorage.setItem(DEPLOYMENT_TIMESTAMP_KEY, data.timestamp);
          return;
        }
        
        // If the deployment timestamp is newer than our stored one, 
        // and the difference is significant (more than 5 seconds to avoid false triggers)
        const timeDifference = Number(data.timestamp) - Number(storedTimestamp);
        
        if (timeDifference > 5000) {
          console.log('New deployment detected in manual check!');
          localStorage.setItem(DEPLOYMENT_TIMESTAMP_KEY, data.timestamp);
          
          // Since this is a manual check, always show the notification
          // Clear the version storage key to force showing update notification
          localStorage.removeItem(VERSION_STORAGE_KEY);
          
          // Show update notification
          setShowUpdateNotification(true);
          return true;
        } else {
          console.log('No new deployment detected');
          return false;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Deployment check timed out after 5 seconds');
        } else if (error instanceof Error) {
          console.warn('Temporary error checking for deployment:', error.message);
        } else {
          console.warn('Unknown error during deployment check');
        }
        return false;
      }
    } catch (error) {
      // Catch any other unexpected errors silently
      return false;
    }
  }, []);

  return {
    showUpdateNotification,
    showTermsAndConditions,
    hideUpdateNotification,
    hideTermsAndConditions,
    refreshPage,
    currentVersionDetails,
    testShowUpdateNotification,
    checkForDeployment: checkForDeploymentManually
  };
}
