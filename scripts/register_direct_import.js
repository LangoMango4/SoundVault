import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DOWNLOAD_DIR = path.join(__dirname, '../server/public/sounds/downloaded');
const LOG_FILE = path.join(DOWNLOAD_DIR, 'direct_registration_log.json');

// Function to register sound using the direct import endpoint
async function registerSound(filename, name) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name,
      filename,
      category: 'sound'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/sounds/direct-import',
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
    
    req.write(data);
    req.end();
  });
}

// Function to copy sound from downloaded directory to main sounds directory
async function copySoundFile(filename) {
  try {
    // Paths to the files
    const sourcePath = path.join(DOWNLOAD_DIR, filename);
    const destPath = path.join(__dirname, '../server/public/sounds', filename);
    
    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: `Source file not found: ${sourcePath}` };
    }
    
    // Create destination directory if it doesn't exist
    const destDir = path.join(__dirname, '../server/public/sounds');
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, destPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Main function to register sounds
async function registerSounds() {
  try {
    console.log('Starting to register downloaded sounds using direct import...');
    
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
      
      // Skip if file name contains 'log' (e.g., download_log.json)
      if (filename.includes('log') || !filename.endsWith('.mp3')) {
        continue;
      }
      
      // Format the name from filename
      const filenameWithoutTimestamp = filename.replace(/_\d+\.mp3$/, '');
      const name = filenameWithoutTimestamp
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      console.log(`Registering (${i+1}/${soundFiles.length}): ${name}`);
      
      // First, copy the file to the main sounds directory
      const copyResult = await copySoundFile(filename);
      if (!copyResult.success) {
        console.error(`❌ Error copying file ${filename}: ${copyResult.error}`);
        results.push({
          originalFilename: filename,
          registeredName: name,
          success: false,
          error: `File copy failed: ${copyResult.error}`
        });
        continue;
      }
      
      // Then, register the sound
      const result = await registerSound(filename, name);
      
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