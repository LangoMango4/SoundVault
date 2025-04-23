import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ASSETS_DIR = path.join(__dirname, '../attached_assets');
const SOUNDS_DIR = path.join(__dirname, '../server/public/sounds');
const LOG_FILE = path.join(SOUNDS_DIR, 'add_sounds_log.json');

// Sound files to copy and register
const SOUND_FILES = [
  'airhorn.mp3',
  'applause.mp3',
  'boing.mp3',
  'boom.mp3',
  'drumroll.mp3',
  'hogrida.mp3',
  'sadtr.mp3',
  'scream.mp3',
  'tada.mp3',
  'wow.mp3',
  'scott-morrison-denies-engadine-mcdonalds-incident.mp3',
  '77cb93d5-0bea-4c27-ad22-c51550ae2fa8.mp3',
  '5fb8dc99-616b-43b2-8eed-fe8abaeaeee9.mp3',
  'f11cdcaa-a9dc-4628-b841-bb5a5552124c.mp3'
];

// Function to copy sound file from assets to server sounds directory
async function copySoundFile(filename) {
  try {
    // Paths to the files
    const sourcePath = path.join(ASSETS_DIR, filename);
    const destPath = path.join(SOUNDS_DIR, filename);
    
    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      return { success: false, error: `Source file not found: ${sourcePath}` };
    }
    
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(SOUNDS_DIR)) {
      fs.mkdirSync(SOUNDS_DIR, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, destPath);
    return { success: true, path: destPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Function to register a sound directly in the database
async function registerSound(filename) {
  // Clean up the name from filename
  let name = path.basename(filename, '.mp3');
  
  // Format UUID filenames to be more readable
  if (name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    name = `Sound Effect ${name.substring(0, 6)}`;
  }
  
  // Format the name nicely
  name = name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name,
      filename,
      categoryId: null // No category
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

// Function to delete all categories
async function deleteAllCategories() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/categories/delete-all',
      method: 'DELETE'
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(body);
            resolve({ success: true, data });
          } catch (error) {
            resolve({ success: true });
          }
        } else {
          resolve({ success: false, error: `${res.statusCode}: ${body}` });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    
    req.end();
  });
}

// Main function to add sounds
async function addSounds() {
  try {
    console.log('Starting to add sounds to the soundboard...');
    
    // Delete all existing categories
    console.log('Deleting all existing categories...');
    const categoryResult = await deleteAllCategories();
    if (categoryResult.success) {
      console.log('✅ All categories deleted successfully');
    } else {
      console.error(`❌ Error deleting categories: ${categoryResult.error}`);
    }
    
    // Create results log
    const results = [];
    
    // Process each sound file
    for (let i = 0; i < SOUND_FILES.length; i++) {
      const filename = SOUND_FILES[i];
      console.log(`Processing (${i+1}/${SOUND_FILES.length}): ${filename}`);
      
      // Step 1: Copy the file
      const copyResult = await copySoundFile(filename);
      if (!copyResult.success) {
        console.error(`❌ Error copying ${filename}: ${copyResult.error}`);
        results.push({
          filename,
          success: false,
          error: `File copy failed: ${copyResult.error}`
        });
        continue;
      }
      
      // Step 2: Register the sound
      const registerResult = await registerSound(filename);
      
      if (registerResult.success) {
        console.log(`✅ Added to soundboard: ${filename}`);
        results.push({
          filename,
          success: true,
          data: registerResult.data
        });
      } else {
        console.error(`❌ Error registering ${filename}: ${registerResult.error}`);
        results.push({
          filename,
          success: false,
          error: registerResult.error
        });
      }
      
      // Save progress after each sound
      fs.writeFileSync(LOG_FILE, JSON.stringify(results, null, 2));
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Final report
    const successCount = results.filter(r => r.success).length;
    console.log(`✨ Process complete! ${successCount}/${SOUND_FILES.length} sounds added successfully.`);
    
    return results;
  } catch (error) {
    console.error('Error in main process:', error);
    return [];
  }
}

// Execute the function
addSounds();