import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DOWNLOAD_DIR = path.join(__dirname, '../server/public/sounds/downloaded');
const LOG_FILE = path.join(DOWNLOAD_DIR, 'registration_log.json');
const COOKIE_FILE = path.join(__dirname, '../admin_cookie.txt');

// Function to login and get cookie
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
      // Get the Set-Cookie header
      const cookies = response.headers.raw()['set-cookie'];
      if (cookies && cookies.length > 0) {
        // Save the cookie to a file
        await writeFile(COOKIE_FILE, cookies[0]);
        console.log('✅ Successfully logged in as admin and saved cookie');
        return cookies[0];
      } else {
        console.error('❌ No cookie received from login');
        return null;
      }
    } else {
      console.error('❌ Failed to login as admin');
      return null;
    }
  } catch (error) {
    console.error('❌ Error during login:', error.message);
    return null;
  }
}

// Function to get cookie from file
async function getCookieFromFile() {
  try {
    if (fs.existsSync(COOKIE_FILE)) {
      const cookie = fs.readFileSync(COOKIE_FILE, 'utf8');
      return cookie;
    }
    return null;
  } catch (error) {
    console.error('Error reading cookie file:', error.message);
    return null;
  }
}

// Main function to register sounds
async function registerSounds() {
  try {
    console.log('Starting to register downloaded sounds...');
    
    // Login and get cookie
    let cookie = await getCookieFromFile();
    if (!cookie) {
      cookie = await loginAsAdmin();
      if (!cookie) {
        console.error('Cannot register sounds without admin cookie. Aborting.');
        return [];
      }
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
          accessLevel: "all",
          categoryId: 1 // Default category
        };
        
        // Submit to API
        const response = await fetch('http://localhost:5000/api/sounds', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookie
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
          
          // If we got a 401/403, try to login again
          if (response.status === 401 || response.status === 403) {
            console.log('Session expired, attempting to re-login...');
            cookie = await loginAsAdmin();
            if (cookie) {
              console.log('Successfully re-logged in, retrying this sound...');
              i--; // Retry this sound
              continue;
            }
          }
          
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