import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

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

// Define popular meme and sound effect URLs
const POPULAR_SOUNDS = [
  {
    name: "Bruh Sound Effect",
    url: "https://www.myinstants.com/media/sounds/movie_1.mp3"
  },
  {
    name: "Windows XP Error",
    url: "https://www.myinstants.com/media/sounds/erro.mp3"
  },
  {
    name: "MLG Air Horn",
    url: "https://www.myinstants.com/media/sounds/mlg-airhorn.mp3"
  },
  {
    name: "Sad Violin",
    url: "https://www.myinstants.com/media/sounds/sad-violin-sound-effect.mp3"
  },
  {
    name: "John Cena Intro",
    url: "https://www.myinstants.com/media/sounds/and-his-name-is-john-cena-1.mp3"
  },
  {
    name: "Wow",
    url: "https://www.myinstants.com/media/sounds/wow.swf.mp3"
  },
  {
    name: "Anime Wow",
    url: "https://www.myinstants.com/media/sounds/anime-wow-sound-effect.mp3"
  },
  {
    name: "Nope.avi",
    url: "https://www.myinstants.com/media/sounds/nopeavi_2.mp3"
  },
  {
    name: "Deja Vu",
    url: "https://www.myinstants.com/media/sounds/deja-vu.mp3"
  },
  {
    name: "Illuminati",
    url: "https://www.myinstants.com/media/sounds/illuminati.mp3"
  },
  {
    name: "Windows XP Startup",
    url: "https://www.myinstants.com/media/sounds/windows-xp-startup.mp3"
  },
  {
    name: "Windows XP Shutdown",
    url: "https://www.myinstants.com/media/sounds/windows-xp-shutdown.mp3"
  },
  {
    name: "To Be Continued",
    url: "https://www.myinstants.com/media/sounds/untitled_1071.mp3"
  },
  {
    name: "Mission Failed",
    url: "https://www.myinstants.com/media/sounds/mission-failed-well-get-em-next-time.mp3"
  },
  {
    name: "GTA Wasted",
    url: "https://www.myinstants.com/media/sounds/wasted.mp3"
  },
  {
    name: "Oof",
    url: "https://www.myinstants.com/media/sounds/roblox-death-sound_1.mp3"
  },
  {
    name: "Why Are You Running",
    url: "https://www.myinstants.com/media/sounds/why-are-you-running-sound-effect_FRNK0Yx.mp3"
  },
  {
    name: "Hello Darkness",
    url: "https://www.myinstants.com/media/sounds/hello-darkness-my-old-friend.mp3"
  },
  {
    name: "Windows Error",
    url: "https://www.myinstants.com/media/sounds/error.mp3"
  },
  {
    name: "FBI Open Up",
    url: "https://www.myinstants.com/media/sounds/fbi-open-up.mp3"
  },
  {
    name: "Run",
    url: "https://www.myinstants.com/media/sounds/run-vine-sound-effect.mp3"
  },
  {
    name: "Mario Jump",
    url: "https://www.myinstants.com/media/sounds/super-mario-bros-jump-sound.mp3"
  },
  {
    name: "Mario Coin",
    url: "https://www.myinstants.com/media/sounds/coin.mp3"
  },
  {
    name: "Mario 1Up",
    url: "https://www.myinstants.com/media/sounds/smb_1-up.mp3"
  },
  {
    name: "Mario Death",
    url: "https://www.myinstants.com/media/sounds/smb_mariodie.mp3"
  },
  {
    name: "Noice",
    url: "https://www.myinstants.com/media/sounds/noice.mp3"
  },
  {
    name: "Bonk",
    url: "https://www.myinstants.com/media/sounds/bonk.mp3"
  },
  {
    name: "Big Shaq",
    url: "https://www.myinstants.com/media/sounds/big-shaq-mathssgj.mp3"
  },
  {
    name: "Surprised Pikachu",
    url: "https://www.myinstants.com/media/sounds/surprised-pikachu_dc7JwG4.mp3"
  }
];

// Main function to download sounds
async function downloadSounds() {
  try {
    console.log('Starting to download popular meme sounds...');
    
    // Create a log file for the results
    const logFile = path.join(DOWNLOAD_DIR, 'download_log.json');
    
    // Download each sound
    const results = [];
    for (let i = 0; i < POPULAR_SOUNDS.length; i++) {
      const sound = POPULAR_SOUNDS[i];
      const filename = `${sanitizeFilename(sound.name)}_${Date.now()}.mp3`;
      
      console.log(`Downloading (${i+1}/${POPULAR_SOUNDS.length}): ${sound.name}`);
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
    console.log(`✨ Download complete! ${successCount}/${POPULAR_SOUNDS.length} sounds downloaded successfully.`);
    console.log(`Download log saved to: ${logFile}`);
    
    return results;
  } catch (error) {
    console.error('Error in main download process:', error);
    return [];
  }
}

// Execute the download process
downloadSounds();