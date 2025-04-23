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

// Define popular meme and sound effect URLs with direct links
const POPULAR_SOUNDS = [
  // Meme sounds
  {
    name: "Bruh Sound Effect",
    url: "https://www.myinstants.com/media/sounds/movie_1.mp3",
    category: "meme"
  },
  {
    name: "Windows XP Error",
    url: "https://www.myinstants.com/media/sounds/erro.mp3",
    category: "os"
  },
  {
    name: "MLG Air Horn",
    url: "https://www.myinstants.com/media/sounds/mlg-airhorn.mp3",
    category: "meme"
  },
  {
    name: "Sad Violin",
    url: "https://www.myinstants.com/media/sounds/sad-violin-sound-effect.mp3",
    category: "meme"
  },
  {
    name: "John Cena Intro",
    url: "https://www.myinstants.com/media/sounds/and-his-name-is-john-cena-1.mp3",
    category: "meme"
  },
  {
    name: "Wow",
    url: "https://www.myinstants.com/media/sounds/wow.swf.mp3",
    category: "meme"
  },
  {
    name: "Anime Wow",
    url: "https://www.myinstants.com/media/sounds/anime-wow-sound-effect.mp3",
    category: "anime"
  },
  {
    name: "Nope.avi",
    url: "https://www.myinstants.com/media/sounds/nopeavi_2.mp3",
    category: "meme"
  },
  {
    name: "Deja Vu",
    url: "https://www.myinstants.com/media/sounds/deja-vu.mp3",
    category: "anime"
  },
  {
    name: "Illuminati",
    url: "https://www.myinstants.com/media/sounds/illuminati.mp3",
    category: "meme"
  },
  {
    name: "Windows XP Startup",
    url: "https://www.myinstants.com/media/sounds/windows-xp-startup.mp3",
    category: "os"
  },
  {
    name: "Windows XP Shutdown",
    url: "https://www.myinstants.com/media/sounds/windows-xp-shutdown.mp3",
    category: "os"
  },
  {
    name: "To Be Continued",
    url: "https://www.myinstants.com/media/sounds/untitled_1071.mp3",
    category: "meme"
  },
  {
    name: "Mission Failed",
    url: "https://www.myinstants.com/media/sounds/mission-failed-well-get-em-next-time.mp3",
    category: "gaming"
  },
  {
    name: "GTA Wasted",
    url: "https://www.myinstants.com/media/sounds/wasted.mp3",
    category: "gaming"
  },
  {
    name: "Oof",
    url: "https://www.myinstants.com/media/sounds/roblox-death-sound_1.mp3",
    category: "gaming"
  },
  {
    name: "Why Are You Running",
    url: "https://www.myinstants.com/media/sounds/why-are-you-running-sound-effect_FRNK0Yx.mp3",
    category: "meme"
  },
  {
    name: "Hello Darkness",
    url: "https://www.myinstants.com/media/sounds/hello-darkness-my-old-friend.mp3",
    category: "meme"
  },
  {
    name: "Windows Error",
    url: "https://www.myinstants.com/media/sounds/error.mp3",
    category: "os"
  },
  {
    name: "FBI Open Up",
    url: "https://www.myinstants.com/media/sounds/fbi-open-up.mp3",
    category: "meme"
  },
  {
    name: "Run",
    url: "https://www.myinstants.com/media/sounds/run-vine-sound-effect.mp3",
    category: "meme"
  },
  {
    name: "Mario Jump",
    url: "https://www.myinstants.com/media/sounds/super-mario-bros-jump-sound.mp3",
    category: "gaming"
  },
  {
    name: "Mario Coin",
    url: "https://www.myinstants.com/media/sounds/coin.mp3",
    category: "gaming"
  },
  {
    name: "Mario 1Up",
    url: "https://www.myinstants.com/media/sounds/smb_1-up.mp3",
    category: "gaming"
  },
  {
    name: "Mario Death",
    url: "https://www.myinstants.com/media/sounds/smb_mariodie.mp3",
    category: "gaming"
  },
  {
    name: "Noice",
    url: "https://www.myinstants.com/media/sounds/noice.mp3",
    category: "meme"
  },
  {
    name: "Bonk",
    url: "https://www.myinstants.com/media/sounds/bonk.mp3",
    category: "meme"
  },
  {
    name: "Big Shaq",
    url: "https://www.myinstants.com/media/sounds/big-shaq-mathssgj.mp3",
    category: "meme"
  },
  {
    name: "Surprised Pikachu",
    url: "https://www.myinstants.com/media/sounds/surprised-pikachu_dc7JwG4.mp3",
    category: "gaming"
  },
  // Additional Sounds
  {
    name: "Coffin Dance",
    url: "https://www.myinstants.com/media/sounds/coffin-dance-meme.mp3",
    category: "meme"
  },
  {
    name: "Nani",
    url: "https://www.myinstants.com/media/sounds/nani.mp3",
    category: "anime"
  },
  {
    name: "You Died Dark Souls",
    url: "https://www.myinstants.com/media/sounds/dark-souls-_you-died_-sound-effect-from-youtube.mp3",
    category: "gaming"
  },
  {
    name: "Discord Notification",
    url: "https://www.myinstants.com/media/sounds/discord-notification.mp3",
    category: "notification"
  },
  {
    name: "Discord Call",
    url: "https://www.myinstants.com/media/sounds/discord-call.mp3",
    category: "notification"
  },
  {
    name: "Discord Join",
    url: "https://www.myinstants.com/media/sounds/discord-joining.mp3",
    category: "notification"
  },
  {
    name: "Discord Leave",
    url: "https://www.myinstants.com/media/sounds/discord-leave.mp3",
    category: "notification"
  },
  {
    name: "Minecraft Villager",
    url: "https://www.myinstants.com/media/sounds/villager-hmm-sound-effect_xuMfR2V.mp3",
    category: "gaming"
  },
  {
    name: "Minecraft Oof",
    url: "https://www.myinstants.com/media/sounds/mc-oof.mp3",
    category: "gaming"
  },
  {
    name: "Minecraft TNT",
    url: "https://www.myinstants.com/media/sounds/mine-bomb.mp3",
    category: "gaming"
  },
  {
    name: "Minecraft Door",
    url: "https://www.myinstants.com/media/sounds/mc-door.mp3",
    category: "gaming"
  },
  {
    name: "Taco Bell",
    url: "https://www.myinstants.com/media/sounds/taco-bell-bong-sfx.mp3",
    category: "meme"
  },
  {
    name: "Windows Vista Error",
    url: "https://www.myinstants.com/media/sounds/winxp_error.mp3",
    category: "os"
  },
  {
    name: "Vine Boom",
    url: "https://www.myinstants.com/media/sounds/vine-boom.mp3",
    category: "meme"
  },
  {
    name: "Law and Order",
    url: "https://www.myinstants.com/media/sounds/law-and-order-svu-sound-effect-dun-dun.mp3",
    category: "meme"
  },
  {
    name: "Metal Pipe",
    url: "https://www.myinstants.com/media/sounds/metal-pipe-falling-sound-effect.mp3",
    category: "meme"
  },
  {
    name: "Hello There",
    url: "https://www.myinstants.com/media/sounds/hello-there.mp3",
    category: "meme"
  },
  {
    name: "Shotgun Reload",
    url: "https://www.myinstants.com/media/sounds/shotgun-reload-sound-effect.mp3",
    category: "gaming"
  },
  {
    name: "Quack",
    url: "https://www.myinstants.com/media/sounds/quack_5.mp3",
    category: "animals"
  },
  {
    name: "Fart",
    url: "https://www.myinstants.com/media/sounds/fart-with-reverb.mp3",
    category: "funny"
  },
  {
    name: "Fart 2",
    url: "https://www.myinstants.com/media/sounds/perfect-fart.mp3",
    category: "funny"
  },
  {
    name: "Huh",
    url: "https://www.myinstants.com/media/sounds/huh.mp3",
    category: "funny"
  },
  {
    name: "Slap",
    url: "https://www.myinstants.com/media/sounds/slap-sound-effect-free.mp3",
    category: "funny"
  },
  {
    name: "Lightsaber On",
    url: "https://www.myinstants.com/media/sounds/lightsaber-on.mp3",
    category: "movie"
  },
  {
    name: "Lightsaber Off",
    url: "https://www.myinstants.com/media/sounds/lightsaber-off.mp3",
    category: "movie"
  },
  {
    name: "Bruh Reversed",
    url: "https://www.myinstants.com/media/sounds/bruh-sound-effect-reversed.mp3",
    category: "meme"
  },
  {
    name: "Alarm Clock",
    url: "https://www.myinstants.com/media/sounds/alarm-clock-beep-beep.mp3",
    category: "notification"
  },
  {
    name: "Fortnite Death",
    url: "https://www.myinstants.com/media/sounds/fortnite-death.mp3",
    category: "gaming"
  },
  {
    name: "Windows 11 Startup",
    url: "https://www.myinstants.com/media/sounds/windows-11-startup-sound.mp3",
    category: "os"
  },
  {
    name: "CSGO Headshot",
    url: "https://www.myinstants.com/media/sounds/headshot_2.mp3",
    category: "gaming"
  },
  {
    name: "Censor Beep",
    url: "https://www.myinstants.com/media/sounds/censor-beep-1.mp3",
    category: "notification"
  },
  {
    name: "Sneeze",
    url: "https://www.myinstants.com/media/sounds/achoo.mp3",
    category: "funny"
  },
  {
    name: "Police Siren",
    url: "https://www.myinstants.com/media/sounds/police-operation-siren-uk-sound-effect.mp3",
    category: "notification"
  },
  {
    name: "Meow",
    url: "https://www.myinstants.com/media/sounds/meow.mp3",
    category: "animals"
  },
  {
    name: "Woof",
    url: "https://www.myinstants.com/media/sounds/woof-sound-effect.mp3",
    category: "animals"
  },
  {
    name: "Goat",
    url: "https://www.myinstants.com/media/sounds/goat_7GE29cM.mp3",
    category: "animals"
  },
  {
    name: "Cow",
    url: "https://www.myinstants.com/media/sounds/cow-moo-sound-effect-moo1.mp3",
    category: "animals"
  },
  {
    name: "Rooster",
    url: "https://www.myinstants.com/media/sounds/rooster_3.mp3",
    category: "animals"
  },
  {
    name: "EA Sports",
    url: "https://www.myinstants.com/media/sounds/easports.mp3",
    category: "gaming"
  },
  {
    name: "Crickets",
    url: "https://www.myinstants.com/media/sounds/awkward-cricket-sound-effect.mp3",
    category: "animals"
  },
  {
    name: "Violin Tuning",
    url: "https://www.myinstants.com/media/sounds/viola-tuning.mp3",
    category: "music"
  },
  {
    name: "Piano C Major",
    url: "https://www.myinstants.com/media/sounds/c-major-chord.mp3",
    category: "music"
  },
  {
    name: "Drum Roll",
    url: "https://www.myinstants.com/media/sounds/drums.mp3",
    category: "music"
  },
  {
    name: "Correct Answer",
    url: "https://www.myinstants.com/media/sounds/correct-answer.mp3",
    category: "gameshow"
  },
  {
    name: "Wrong Answer",
    url: "https://www.myinstants.com/media/sounds/buzzer_x.mp3",
    category: "gameshow"
  },
  {
    name: "Crowd Cheering",
    url: "https://www.myinstants.com/media/sounds/cheering.mp3",
    category: "crowd"
  },
  {
    name: "Crowd Laugh",
    url: "https://www.myinstants.com/media/sounds/laugh.mp3",
    category: "crowd"
  },
  {
    name: "Crowd Applause",
    url: "https://www.myinstants.com/media/sounds/applause.mp3",
    category: "crowd"
  },
  {
    name: "Crowd Gasp",
    url: "https://www.myinstants.com/media/sounds/crowd-gasp.mp3",
    category: "crowd"
  },
  {
    name: "Crowd Aww",
    url: "https://www.myinstants.com/media/sounds/aww.mp3",
    category: "crowd"
  },
  {
    name: "Door Knock",
    url: "https://www.myinstants.com/media/sounds/door-knock.mp3",
    category: "sfx"
  },
  {
    name: "Door Bell",
    url: "https://www.myinstants.com/media/sounds/doorbell.mp3",
    category: "sfx"
  },
  {
    name: "Glass Break",
    url: "https://www.myinstants.com/media/sounds/glass-breaking-sound-effect.mp3",
    category: "sfx"
  },
  {
    name: "Camera Shutter",
    url: "https://www.myinstants.com/media/sounds/camera-shutter-click-01.mp3",
    category: "sfx"
  },
  {
    name: "Explosion",
    url: "https://www.myinstants.com/media/sounds/explosion.mp3",
    category: "sfx"
  },
  {
    name: "Car Horn",
    url: "https://www.myinstants.com/media/sounds/car-horn-beep-beep.mp3",
    category: "sfx"
  },
  {
    name: "Cash Register",
    url: "https://www.myinstants.com/media/sounds/cash-register-sound-effect.mp3",
    category: "sfx"
  }
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

// Main function to download sounds
async function downloadSounds() {
  try {
    console.log('Starting to download popular sounds...');
    
    // Create a log file for the results
    const logFile = path.join(DOWNLOAD_DIR, 'direct_download_log.json');
    
    // Download each sound
    const results = [];
    for (let i = 0; i < POPULAR_SOUNDS.length; i++) {
      const sound = POPULAR_SOUNDS[i];
      const timestamp = Date.now();
      const filename = `${sanitizeFilename(sound.category)}_${sanitizeFilename(sound.name)}_${timestamp}.mp3`;
      
      console.log(`Downloading (${i+1}/${POPULAR_SOUNDS.length}): ${sound.name} [${sound.category}]`);
      
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
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // After downloading 20 sounds, take a longer break to avoid rate limiting
      if (i > 0 && i % 20 === 0) {
        console.log(`Taking a short break after downloading ${i} sounds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
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