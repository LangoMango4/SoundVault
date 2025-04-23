import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DOWNLOAD_DIR = path.join(__dirname, '../server/public/sounds/downloaded');
const LOG_FILE = path.join(DOWNLOAD_DIR, 'registration_log.json');
const COOKIE_FILE = path.join(__dirname, '../admin_cookie.txt');

// Login as admin to get cookie
async function loginAsAdmin() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      username: 'admin',
      password: 'alarms12'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Login failed with status ${res.statusCode}: ${body}`));
          return;
        }
        
        const cookie = res.headers['set-cookie'];
        if (!cookie) {
          reject(new Error('No cookie returned from login'));
          return;
        }
        
        // Save cookie to file
        fs.writeFileSync(COOKIE_FILE, cookie.join(';'));
        console.log('✅ Admin login successful. Cookie saved.');
        resolve(cookie);
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

// Get cookie from file if exists
async function getCookieFromFile() {
  try {
    if (fs.existsSync(COOKIE_FILE)) {
      const cookie = fs.readFileSync(COOKIE_FILE, 'utf8');
      console.log('✅ Using existing admin cookie.');
      return cookie;
    }
  } catch (error) {
    console.error('Error reading cookie file:', error.message);
  }
  return null;
}

// Register a single sound via API
async function registerSound(filename, name, cookie) {
  return new Promise((resolve, reject) => {
    // Create form data
    const boundary = '---------------------------' + Date.now().toString(16);
    
    let formData = '';
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="name"\r\n\r\n`;
    formData += `${name}\r\n`;
    
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="filename"\r\n\r\n`;
    formData += `${filename}\r\n`;
    
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="categoryId"\r\n\r\n`;
    formData += `1\r\n`;
    
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="accessLevel"\r\n\r\n`;
    formData += `all\r\n`;
    
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="duration"\r\n\r\n`;
    formData += `0.0\r\n`;
    
    formData += `--${boundary}--\r\n`;
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/sounds/import',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': formData.length,
        'Cookie': cookie
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 201) {
          try {
            const data = JSON.parse(body);
            resolve({ success: true, data });
          } catch (error) {
            resolve({ success: true, data: { message: 'Registered successfully but could not parse response' } });
          }
        } else {
          resolve({ success: false, error: `${res.statusCode}: ${body}` });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.write(formData);
    req.end();
  });
}

// Main function to register sounds
async function registerSounds() {
  try {
    console.log('Starting to register downloaded sounds...');
    
    // Get all MP3 files in the download directory
    const soundFiles = fs.readdirSync(DOWNLOAD_DIR)
      .filter(file => file.endsWith('.mp3'));
    
    if (soundFiles.length === 0) {
      console.log('No sound files found to register.');
      return [];
    }
    
    console.log(`Found ${soundFiles.length} sound files to register.`);
    
    // Get admin cookie
    let cookie = await getCookieFromFile();
    if (!cookie) {
      cookie = await loginAsAdmin();
      if (!cookie) {
        console.error('Cannot register sounds without admin cookie. Aborting.');
        return [];
      }
    }
    
    // Create a log file for the results
    const results = [];
    
    // Register each sound
    for (let i = 0; i < soundFiles.length; i++) {
      const filename = soundFiles[i];
      
      // Skip if file name contains 'download_log' or 'registration_log'
      if (filename.includes('download_log') || filename.includes('registration_log')) {
        continue;
      }
      
      const filenameWithoutTimestamp = filename.replace(/_\d+\.mp3$/, '');
      // Clean up the name
      const name = filenameWithoutTimestamp
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      console.log(`Registering (${i+1}/${soundFiles.length}): ${name}`);
      
      const result = await registerSound(filename, name, cookie);
      
      if (result.success) {
        console.log(`✅ Registered: ${name}`);
        results.push({
          originalFilename: filename,
          registeredName: name,
          success: true,
          data: result.data
        });
      } else {
        console.error(`❌ Error registering ${name}: ${result.error}`);
        results.push({
          originalFilename: filename,
          registeredName: name,
          success: false,
          error: result.error
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