import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Exported interface definition moved below

// Version control to show notification when version changes
const CURRENT_VERSION = '1.4.0'; // Incremented from 1.3.0 to test update notification
const VERSION_STORAGE_KEY = 'math-homework-version';
const LAST_ACTIVITY_KEY = 'math-homework-last-activity';
const TERMS_SHOWN_KEY = 'math-homework-terms-shown-session';
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

// Version history with information about each update
const VERSION_HISTORY: Record<string, { title: string; date: string; changes: string[] }> = {
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
}

export function useUpdateNotification(): UseUpdateNotificationResult {
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [showTermsAndConditions, setShowTermsAndConditions] = useState(false);
  const { user, logoutMutation } = useAuth();
  
  // Show terms and conditions every time user logs in
  useEffect(() => {
    if (user) {
      // Always show Terms & Conditions on login
      setShowTermsAndConditions(true);
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
    // Don't store in session storage since we want it to show every login
  };
  
  const refreshPage = () => {
    window.location.reload();
  };
  
  // Get current version details
  const currentVersionDetails = VERSION_HISTORY[CURRENT_VERSION];
  
  // Testing function to force show the update notification dialog
  const testShowUpdateNotification = () => {
    setShowUpdateNotification(true);
  };

  return {
    showUpdateNotification,
    showTermsAndConditions,
    hideUpdateNotification,
    hideTermsAndConditions,
    refreshPage,
    currentVersionDetails,
    testShowUpdateNotification
  };
}
