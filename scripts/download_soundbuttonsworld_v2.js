import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import axios from 'axios';
import { parse } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create directory for downloaded sounds
const DOWNLOAD_DIR = path.join(__dirname, '../server/public/sounds/downloaded');
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Function to sanitize filenames
function sanitizeFilename(name) {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Define categories to download
const CATEGORIES = [
  'memes',
  'anime',
  'games',
  'funny',
  'animals',
  'vehicles',
  'musical'
];

// Function to download a single file
async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const dest = path.join(DOWNLOAD_DIR, filename);
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${filename}`);
        resolve({ success: true, filename });
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      console.error(`❌ Failed to download ${url}: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

// Function to extract MP3 URLs from category page
async function extractSoundsFromCategory(category) {
  const url = `https://soundbuttonsworld.com/categories/${category}`;
  const sounds = [];
  
  try {
    console.log(`Fetching sounds from category: ${category}...`);
    const response = await axios.get(url);
    
    // Extract audio elements with src attribute
    const regex = /<audio[^>]*src=["']([^"']+)["'][^>]*>/g;
    let match;
    while ((match = regex.exec(response.data)) !== null) {
      const soundUrl = match[1];
      
      // Get the sound name from a nearby element 
      // We'll use the filename as a fallback
      let soundName = path.basename(soundUrl, path.extname(soundUrl))
        .replace(/-/g, ' ')
        .replace(/_/g, ' ');
      
      // Make first letter uppercase for each word
      soundName = soundName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      sounds.push({
        name: soundName,
        url: soundUrl,
        category
      });
    }
    
    console.log(`Found ${sounds.length} sounds in category: ${category}`);
    return sounds;
  } catch (error) {
    console.error(`Error scraping category ${category}: ${error.message}`);
    return [];
  }
}

// Main function to download sounds
async function downloadSounds() {
  try {
    console.log('Starting to download sounds from soundbuttonsworld.com...');
    
    // Fetch sounds from all categories
    let allSounds = [];
    for (const category of CATEGORIES) {
      const categorySounds = await extractSoundsFromCategory(category);
      allSounds = [...allSounds, ...categorySounds];
      
      // Small delay between category requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (allSounds.length === 0) {
      console.log('No sounds found to download. Exiting.');
      return [];
    }
    
    console.log(`Total sounds found: ${allSounds.length}`);
    
    // Create a log file for the results
    const logFile = path.join(DOWNLOAD_DIR, 'soundbuttonsworld_download_log.json');
    
    // Download each sound
    const results = [];
    for (let i = 0; i < allSounds.length; i++) {
      const sound = allSounds[i];
      const timestamp = Date.now();
      const filename = `${sanitizeFilename(sound.category)}_${sanitizeFilename(sound.name)}_${timestamp}.mp3`;
      
      console.log(`Downloading (${i+1}/${allSounds.length}): ${sound.name} [${sound.category}]`);
      
      try {
        const result = await downloadFile(sound.url, filename);
        
        results.push({
          originalName: sound.name,
          category: sound.category,
          filename: result.success ? filename : null,
          url: sound.url,
          success: result.success,
          error: result.error
        });
      } catch (err) {
        console.error(`Error downloading ${sound.name}: ${err.message}`);
        results.push({
          originalName: sound.name,
          category: sound.category,
          filename: null,
          url: sound.url,
          success: false,
          error: err.message
        });
      }
      
      // Save progress after each download
      fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // After downloading 10 sounds, take a longer break to avoid rate limiting
      if (i > 0 && i % 10 === 0) {
        console.log(`Taking a short break after downloading ${i} sounds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // Final report
    const successCount = results.filter(r => r.success).length;
    console.log(`✨ Download complete! ${successCount}/${allSounds.length} sounds downloaded successfully.`);
    console.log(`Download log saved to: ${logFile}`);
    
    return results;
  } catch (error) {
    console.error('Error in main download process:', error);
    return [];
  }
}

// Execute the download process
downloadSounds();