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

// Scrape soundbuttonsworld.com to find sound files
async function scrapeSoundButtonsWorld() {
  const baseUrl = 'https://soundbuttonsworld.com';
  const sounds = [];
  
  try {
    console.log('Fetching sounds from soundbuttonsworld.com...');
    const response = await axios.get(baseUrl);
    
    // Extract sound button data using regex since it's embedded in JavaScript
    const dataRegex = /var sounds = (\[.*?\]);/s;
    const match = response.data.match(dataRegex);
    
    if (!match || !match[1]) {
      throw new Error('Could not find sound data on the page');
    }
    
    // Parse the JSON data
    const soundsData = JSON.parse(match[1]);
    
    soundsData.forEach(sound => {
      if (sound.file) {
        let soundUrl = sound.file;
        
        // Make sure URL is absolute
        if (!soundUrl.startsWith('http')) {
          soundUrl = new URL(soundUrl, baseUrl).toString();
        }
        
        sounds.push({
          name: sound.name || path.basename(sound.file, path.extname(sound.file)),
          url: soundUrl
        });
      }
    });
    
    console.log(`Found ${sounds.length} sounds on soundbuttonsworld.com`);
    return sounds;
  } catch (error) {
    console.error(`Error scraping soundbuttonsworld.com: ${error.message}`);
    return [];
  }
}

// Main function to download sounds
async function downloadSounds() {
  try {
    console.log('Starting to download sounds from soundbuttonsworld.com...');
    
    // Scrape sound data from website
    const sounds = await scrapeSoundButtonsWorld();
    
    if (sounds.length === 0) {
      console.log('No sounds found to download. Exiting.');
      return [];
    }
    
    // Create a log file for the results
    const logFile = path.join(DOWNLOAD_DIR, 'soundbuttonsworld_download_log.json');
    
    // Download each sound
    const results = [];
    for (let i = 0; i < sounds.length; i++) {
      const sound = sounds[i];
      const filename = `${sanitizeFilename(sound.name)}_${Date.now()}.mp3`;
      
      console.log(`Downloading (${i+1}/${sounds.length}): ${sound.name}`);
      
      try {
        const result = await downloadFile(sound.url, filename);
        
        results.push({
          originalName: sound.name,
          filename: result.success ? filename : null,
          url: sound.url,
          success: result.success,
          error: result.error
        });
      } catch (err) {
        console.error(`Error downloading ${sound.name}: ${err.message}`);
        results.push({
          originalName: sound.name,
          filename: null,
          url: sound.url,
          success: false,
          error: err.message
        });
      }
      
      // Save progress after each download
      fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Final report
    const successCount = results.filter(r => r.success).length;
    console.log(`✨ Download complete! ${successCount}/${sounds.length} sounds downloaded successfully.`);
    console.log(`Download log saved to: ${logFile}`);
    
    return results;
  } catch (error) {
    console.error('Error in main download process:', error);
    return [];
  }
}

// Execute the download process
downloadSounds();