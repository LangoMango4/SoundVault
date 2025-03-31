/**
 * Utility functions for detecting and bypassing AB Tutor monitoring
 */

// Single educational site to redirect to when AB Tutor is detected
const SAFE_SITE = 'https://andie.standrewscc.qld.edu.au/';

/**
 * AB Tutor commonly injects monitoring scripts with specific class names or IDs
 * This checks for common AB Tutor monitoring elements in the DOM
 */
export const detectABTutor = (): boolean => {
  // Look for known AB Tutor elements
  const abTutorElements = [
    // Common class names and IDs used by AB Tutor
    '.ab-tutor-monitor',
    '.ab-control',
    '#ab-tutor-agent',
    '#abTutorControl',
    '[data-ab-tutor]',
    // AB Tutor often injects invisible iframes
    'iframe[style*="visibility: hidden"]',
    'iframe[style*="display: none"]',
    // Check for specific script sources
    'script[src*="abtutor"]',
    'script[src*="ab-control"]'
  ];

  // Check if any of these elements exist
  return abTutorElements.some(selector => {
    try {
      return document.querySelector(selector) !== null;
    } catch (e) {
      console.error(`Error checking for selector ${selector}:`, e);
      return false;
    }
  });
};

/**
 * Checks for AB Tutor-specific patterns in the page's HTML
 */
export const checkForABTutorPatterns = (): boolean => {
  try {
    const html = document.documentElement.innerHTML.toLowerCase();
    const patterns = [
      'abtutor',
      'ab-tutor',
      'abmonitor',
      'abcontrol',
      'classnetwork',
      'classroom monitor'
    ];
    
    return patterns.some(pattern => html.includes(pattern));
  } catch (e) {
    console.error('Error checking HTML patterns:', e);
    return false;
  }
};

/**
 * Checks for network connections to AB Tutor servers
 * Note: This has limited effectiveness in browser environments due to security restrictions
 */
export const checkForABTutorConnections = async (): Promise<boolean> => {
  // This is a simplified approach - actual network detection is limited in browsers
  // We're looking for performance patterns that might indicate monitoring
  const startTime = performance.now();
  
  // Simulate some work
  for (let i = 0; i < 10000; i++) {
    // Just creating some CPU load
    Math.sqrt(i * Math.random());
  }
  
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  // If execution is significantly slowed down, might indicate monitoring
  // This is not a reliable method but can serve as a heuristic
  return executionTime > 50; // Abnormally slow execution might indicate monitoring
};

/**
 * Initiates a bypass action when AB Tutor is detected
 */
export const bypassABTutor = (): void => {
  console.log("AB Tutor detection triggered - initiating bypass");
  
  // Store the original URL to return to
  const originalUrl = window.location.href;
  sessionStorage.setItem('originalAppUrl', originalUrl);
  
  console.log(`Redirecting to: ${SAFE_SITE}`);
  
  // Open the educational website in a new window/tab
  const newWindow = window.open(SAFE_SITE, '_blank');
  
  // If popup is blocked, try the direct approach
  if (!newWindow) {
    try {
      // Navigate directly to the safe site
      window.location.href = SAFE_SITE;
      
      // Set a timer to automatically return after 2 seconds
      setTimeout(() => {
        console.log("Auto-returning to soundboard app");
        window.location.href = originalUrl;
      }, 2000);
    } catch (err) {
      console.error('Failed primary bypass method:', err);
      
      // Fallback method - use replace to avoid browser history
      try {
        document.location.replace(SAFE_SITE);
        
        // Still try to come back automatically
        setTimeout(() => {
          console.log("Auto-returning to soundboard app (fallback)");
          document.location.replace(originalUrl);
        }, 2000);
      } catch (error) {
        console.error('Failed secondary bypass method:', error);
        
        // Last resort - create a visual cover that mimics the educational site
        const cover = document.createElement('div');
        cover.style.position = 'fixed';
        cover.style.top = '0';
        cover.style.left = '0';
        cover.style.width = '100%';
        cover.style.height = '100%';
        cover.style.backgroundColor = 'white';
        cover.style.zIndex = '9999';
        cover.innerHTML = `
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1 style="color: #0056b3;">Andie Student Portal</h1>
            <h2 style="color: #444;">Loading resources...</h2>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 4px; margin-top: 20px;">
              <p>Please wait while we connect to the educational resources.</p>
            </div>
          </div>
        `;
        document.body.appendChild(cover);
        
        // Remove the cover after 2 seconds
        setTimeout(() => {
          cover.remove();
        }, 2000);
      }
    }
  } else {
    // If we successfully opened a new window, set a timeout to close it after 2 seconds
    setTimeout(() => {
      if (newWindow && !newWindow.closed) {
        newWindow.close();
      }
    }, 2000);
  }
};

/**
 * Setup continuous monitoring for AB Tutor
 * @param intervalMs How often to check for AB Tutor (in milliseconds)
 */
export const setupABTutorMonitoring = (intervalMs = 5000): () => void => {
  console.log("Setting up AB Tutor monitoring");
  
  // Function to run checks
  const runChecks = async () => {
    const domDetection = detectABTutor();
    const patternDetection = checkForABTutorPatterns();
    const connectionDetection = await checkForABTutorConnections();
    
    // If any detection method returns true, initiate bypass
    if (domDetection || patternDetection || connectionDetection) {
      console.log("AB Tutor detected:", {
        domDetection,
        patternDetection,
        connectionDetection
      });
      bypassABTutor();
    }
  };
  
  // Setup periodic checking
  const intervalId = setInterval(runChecks, intervalMs);
  
  // Initial check
  runChecks();
  
  // Return function to stop monitoring
  return () => {
    clearInterval(intervalId);
    console.log("AB Tutor monitoring stopped");
  };
};

/**
 * Manual trigger for AB Tutor bypass
 * This can be connected to a button or keyboard shortcut
 */
export const manualBypassTrigger = (): void => {
  console.log("Manual AB Tutor bypass triggered");
  bypassABTutor();
};