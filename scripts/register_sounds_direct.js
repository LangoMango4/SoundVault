import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../server/db.js'; // Import from db.js location that matches the actual file
import { sounds } from '../shared/schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const DOWNLOAD_DIR = path.join(__dirname, '../server/public/sounds/downloaded');
const LOG_FILE = path.join(DOWNLOAD_DIR, 'registration_log.json');

// Main function to register sounds
async function registerSounds() {
  try {
    console.log('Starting to register downloaded sounds directly to database...');
    
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
          categoryId: 1, // Default category
          accessLevel: "all"
        };
        
        // Insert directly to database
        const [insertedSound] = await db.insert(sounds).values(soundData).returning();
        
        console.log(`✅ Registered: ${name} with ID ${insertedSound.id}`);
        results.push({
          originalFilename: filename,
          registeredName: name,
          success: true,
          id: insertedSound.id
        });
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