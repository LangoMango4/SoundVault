const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

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
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const dest = path.join(DOWNLOAD_DIR, filename);
    await pipeline(response.data, fs.createWriteStream(dest));
    console.log(`✅ Downloaded: ${filename}`);
    return { success: true, filename };
  } catch (error) {
    console.error(`❌ Failed to download ${url}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main function to scrape and download sounds
async function downloadSounds() {
  try {
    console.log('Starting to scrape sounds from soundbuttonsworld.com...');
    
    // Fetch the webpage
    const response = await axios.get('https://soundbuttonsworld.com/');
    const $ = cheerio.load(response.data);
    
    // Find all sound buttons
    const sounds = [];
    
    // This selector might need adjustment based on the actual site structure
    $('button[data-sound-src]').each((i, el) => {
      const soundSrc = $(el).attr('data-sound-src');
      const soundName = $(el).text().trim() || `sound_${i}`;
      
      if (soundSrc) {
        sounds.push({
          url: soundSrc,
          name: soundName
        });
      }
    });
    
    console.log(`Found ${sounds.length} sounds to download.`);
    
    // Create a log file for the results
    const logFile = path.join(DOWNLOAD_DIR, 'download_log.json');
    
    // Download each sound
    const results = [];
    for (let i = 0; i < sounds.length; i++) {
      const sound = sounds[i];
      const filename = `${sanitizeFilename(sound.name)}_${Date.now()}.mp3`;
      
      console.log(`Downloading (${i+1}/${sounds.length}): ${sound.name}`);
      const result = await downloadFile(sound.url, filename);
      
      results.push({
        originalName: sound.name,
        filename: result.success ? filename : null,
        url: sound.url,
        success: result.success,
        error: result.error
      });
      
      // Save progress after each download
      fs.writeFileSync(logFile, JSON.stringify(results, null, 2));
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
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