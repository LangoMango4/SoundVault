/**
 * Utility functions for detecting and bypassing AB Tutor monitoring
 */

// URLs to redirect to when AB Tutor is detected
const SAFE_SITES = [
  'https://classroom.google.com/',
  'https://www.khanacademy.org/',
  'https://www.bbc.co.uk/bitesize',
  'https://quizlet.com/',
  'https://www.wolframalpha.com/',
  'https://www.desmos.com/calculator',
  'https://www.mathsisfun.com/',
  'https://www.geogebra.org/',
  'https://www.ixl.com/',
  'https://www.duolingo.com/',
  'https://www.edx.org/',
  'https://www.coursera.org/',
  // Keep original sites as well
  'https://standrewscc.qld.edu.au/',
  'https://school.qld.edu.au/',
  'https://qld.edu.au/',
  'https://andie.standrewscc.qld.edu.au/' // Moving this to the end of the list
];

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
  
  // Get list of sites and shuffle it to make random selection more unpredictable
  const shuffledSites = [...SAFE_SITES].sort(() => 0.5 - Math.random());
  
  // Select a random safe site from the shuffled array - avoid always picking the first one
  const randomIndex = Math.floor(Math.random() * shuffledSites.length);
  const randomSafeUrl = shuffledSites[randomIndex];
  
  // Store the last used URL in sessionStorage to avoid repeated redirects to same site
  const lastUsedUrl = sessionStorage.getItem('lastBypassUrl');
  
  // If we got the same URL as last time and we have more than one option, pick another
  let finalUrl = randomSafeUrl;
  if (lastUsedUrl === finalUrl && shuffledSites.length > 1) {
    // Pick a different URL from the shuffled array
    const newIndex = (randomIndex + 1) % shuffledSites.length;
    finalUrl = shuffledSites[newIndex];
  }
  
  // Save this URL for next time
  sessionStorage.setItem('lastBypassUrl', finalUrl);
  
  console.log(`Redirecting to: ${finalUrl}`);
  
  try {
    // Navigate to the safe site
    window.location.href = finalUrl;
  } catch (err) {
    console.error('Failed primary bypass method:', err);
    
    // Fallback method
    try {
      document.location.replace(finalUrl);
    } catch (error) {
      console.error('Failed secondary bypass method:', error);
      
      // Last resort - try to create a visual cover
      const cover = document.createElement('div');
      cover.style.position = 'fixed';
      cover.style.top = '0';
      cover.style.left = '0';
      cover.style.width = '100%';
      cover.style.height = '100%';
      cover.style.backgroundColor = 'white';
      cover.style.zIndex = '9999';
      cover.innerHTML = '<h1 style="text-align:center;margin-top:40vh">Loading educational resources...</h1>';
      document.body.appendChild(cover);
      
      // Try again after a short delay
      setTimeout(() => {
        window.location.href = finalUrl;
      }, 500);
    }
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