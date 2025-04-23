import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DOWNLOAD_DIR = path.join(__dirname, '../server/public/sounds/downloaded');
const LOG_FILE = path.join(DOWNLOAD_DIR, 'registration_log.json');

// Function to make an API request
async function apiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          if (responseData) {
            const jsonData = JSON.parse(responseData);
            resolve(jsonData);
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Login as admin
async function loginAsAdmin() {
  try {
    console.log('Logging in as admin...');
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'alarms12'
      })
    });
    
    if (response.ok) {
      console.log('✅ Successfully logged in as admin');
      return true;
    } else {
      console.error('❌ Failed to login as admin');
      return false;
    }
  } catch (error) {
    console.error('❌ Error during login:', error.message);
    return false;
  }
}

// Main function to register sounds
async function registerSounds() {
  try {
    console.log('Starting to register downloaded sounds...');
    
    // Login first
    const loggedIn = await loginAsAdmin();
    if (!loggedIn) {
      console.error('Cannot register sounds without admin privileges. Aborting.');
      return [];
    }
    
    // Get all MP3 files in the download directory
    const soundFiles = fs.readdirSync(DOWNLOAD_DIR)
      .filter(file => file.endsWith('.mp3'));
    
    if (soundFiles.length === 0) {
      console.log('No sound files found to register.');
      return [];
    }
    
    console.log(`Found ${soundFiles.length} sound files to register.`);
    
    // Create a log file for the results
    const results = [];
    
    // Register each sound
    for (let i = 0; i < soundFiles.length; i++) {
      const filename = soundFiles[i];
      const filenameWithoutTimestamp = filename.replace(/_\d+\.mp3$/, '');
      // Clean up the name
      const name = filenameWithoutTimestamp
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      console.log(`Registering (${i+1}/${soundFiles.length}): ${name}`);
      
      try {
        // Create sound data
        const soundData = {
          name: name,
          filename: filename,
          duration: "0.0", // Default duration
          accessLevel: "all"
        };
        
        // Submit to API
        const response = await fetch('http://localhost:5000/api/sounds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(soundData)
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Registered: ${name}`);
          results.push({
            originalFilename: filename,
            registeredName: name,
            success: true,
            id: data.id
          });
        } else {
          const errorText = await response.text();
          console.error(`❌ Failed to register ${name}: ${errorText}`);
          results.push({
            originalFilename: filename,
            registeredName: name,
            success: false,
            error: errorText
          });
        }
      } catch (error) {
        console.error(`❌ Error registering ${name}: ${error.message}`);
        results.push({
          originalFilename: filename,
          registeredName: name,
          success: false,
          error: error.message
        });
      }
      
      // Save progress after each registration
      fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Final report
    const successCount = results.filter(r => r.success).length;
    console.log(`✨ Registration complete! ${successCount}/${soundFiles.length} sounds registered successfully.`);
    console.log(`Registration log saved to: ${LOG_FILE}`);
    
    return results;
  } catch (error) {
    console.error('Error in main registration process:', error);
    return [];
  }
}

// Execute the registration process
registerSounds();