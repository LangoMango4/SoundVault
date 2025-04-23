import http from 'http';

// Category IDs based on our created categories
const CATEGORIES = {
  MEMES: 1,
  WINDOWS: 2,
  GAMING: 3,
  ANIME: 4,
  UNCATEGORIZED: 5
};

// Function to update a sound's category
async function updateSoundCategory(soundId, categoryId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      categoryId
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/sounds/update-category/${soundId}`,
      method: 'PUT',
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
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(body);
            resolve({ success: true, data });
          } catch (error) {
            resolve({ success: true, data: { message: 'Category updated but could not parse response' } });
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

// Function to get all sounds
async function getAllSounds() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/sounds/all-direct',
      method: 'GET'
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
            resolve(data);
          } catch (error) {
            reject(new Error('Could not parse response'));
          }
        } else {
          reject(new Error(`Failed with status ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Main function to categorize sounds
async function categorizeSounds() {
  try {
    console.log('Categorizing sounds...');
    
    // Get all sounds
    const sounds = await getAllSounds();
    console.log(`Found ${sounds.length} sounds to categorize.`);
    
    const results = [];
    
    // Process each sound
    for (let i = 0; i < sounds.length; i++) {
      const sound = sounds[i];
      let categoryId = CATEGORIES.UNCATEGORIZED;
      
      // Determine category based on name or filename
      const name = sound.name.toLowerCase();
      const filename = sound.filename.toLowerCase();
      
      if (name.includes('meme') || 
          name.includes('bruh') || 
          name.includes('mlg') || 
          name.includes('air horn') || 
          name.includes('john cena') ||
          name.includes('fbi') ||
          name.includes('illuminati') ||
          name.includes('to be continued')) {
        categoryId = CATEGORIES.MEMES;
      } 
      else if (name.includes('windows') || 
               name.includes('xp') || 
               name.includes('os') || 
               name.includes('error') ||
               name.includes('shutdown') ||
               name.includes('startup')) {
        categoryId = CATEGORIES.WINDOWS;
      }
      else if (name.includes('gaming') || 
               name.includes('game') || 
               name.includes('gta') || 
               name.includes('mission') ||
               name.includes('oof') ||
               name.includes('wasted')) {
        categoryId = CATEGORIES.GAMING;
      }
      else if (name.includes('anime') || 
               name.includes('deja vu') || 
               name.includes('wow')) {
        categoryId = CATEGORIES.ANIME;
      }
      
      console.log(`Categorizing (${i+1}/${sounds.length}): ${sound.name} -> ${Object.keys(CATEGORIES).find(key => CATEGORIES[key] === categoryId)}`);
      
      // Skip updating if the sound already has the correct category
      if (sound.categoryId === categoryId) {
        console.log(`✓ Already in correct category: ${sound.name}`);
        results.push({
          id: sound.id,
          name: sound.name,
          success: true,
          categoryId,
          message: 'Already in correct category'
        });
        continue;
      }
      
      const result = await updateSoundCategory(sound.id, categoryId);
      
      if (result.success) {
        console.log(`✅ Categorized: ${sound.name}`);
        results.push({
          id: sound.id,
          name: sound.name,
          success: true,
          categoryId
        });
      } else {
        console.error(`❌ Error categorizing ${sound.name}: ${result.error}`);
        results.push({
          id: sound.id,
          name: sound.name,
          success: false,
          error: result.error
        });
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Final report
    const successCount = results.filter(r => r.success).length;
    console.log(`✨ Categorization complete! ${successCount}/${sounds.length} sounds categorized successfully.`);
    
    // Count by category
    const categoryCounts = Object.keys(CATEGORIES).reduce((acc, key) => {
      acc[key] = results.filter(r => r.success && r.categoryId === CATEGORIES[key]).length;
      return acc;
    }, {});
    
    console.log('Sounds by category:');
    Object.keys(categoryCounts).forEach(category => {
      console.log(`- ${category}: ${categoryCounts[category]}`);
    });
    
    return results;
  } catch (error) {
    console.error('Error in categorization process:', error);
    return [];
  }
}

// Execute the categorization process
categorizeSounds();