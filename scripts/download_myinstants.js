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

// Popular sound categories
const CATEGORIES = [
  'meme',
  'dank',
  'gaming',
  'anime',
  'funny',
  'notification',
  'vine',
  'tiktok',
  'spongebob',
  'minecraft',
  'fortnite',
  'cartoon'
];

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

// Function to extract sound data from MyInstants
async function extractSoundsFromMyInstants(category, page = 1, limit = 20) {
  try {
    const url = `https://www.myinstants.com/en/search/?name=${category}&page=${page}`;
    console.log(`Fetching sounds from MyInstants for category: ${category}, page: ${page}...`);
    
    const response = await axios.get(url);
    const soundData = [];
    
    // Extract sound buttons with both name and URL
    const buttonRegex = /<div class="small-button"[^>]*>.*?<span[^>]*>(.*?)<\/span>.*?onclick="play\\('(.*?)'\\)".*?<\/div>/gs;
    let match;
    
    while ((match = buttonRegex.exec(response.data)) !== null) {
      const name = match[1].trim();
      const soundPath = match[2].trim();
      
      if (name && soundPath) {
        const soundUrl = `https://www.myinstants.com${soundPath}`;
        soundData.push({
          name,
          url: soundUrl,
          category
        });
      }
    }
    
    console.log(`Found ${soundData.length} sounds for category '${category}' on page ${page}`);
    return soundData;
  } catch (error) {
    console.error(`Error fetching sounds for category '${category}': ${error.message}`);
    return [];
  }
}

// Main function to download sounds
async function downloadSounds() {
  try {
    console.log('Starting to download sounds from MyInstants...');
    const results = [];
    const logFile = path.join(DOWNLOAD_DIR, 'myinstants_download_log.json');
    
    let allSounds = [];
    
    // Fetch sounds from all categories (first page only for each category)
    for (const category of CATEGORIES) {
      const sounds = await extractSoundsFromMyInstants(category);
      allSounds = [...allSounds, ...sounds];
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (allSounds.length === 0) {
      console.log('No sounds found to download. Exiting.');
      return [];
    }
    
    console.log(`Total unique sounds found: ${allSounds.length}`);
    
    // Download each sound
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
        await new Promise(resolve => setTimeout(resolve, 2000));
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