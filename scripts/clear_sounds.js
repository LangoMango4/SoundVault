import http from 'http';

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

// Function to delete a sound
async function deleteSound(soundId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/sounds/delete-direct/${soundId}`,
      method: 'DELETE'
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 204) {
          resolve({ success: true, soundId });
        } else {
          resolve({ 
            success: false, 
            soundId, 
            error: `Failed with status ${res.statusCode}: ${body}` 
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, soundId, error: error.message });
    });
    
    req.end();
  });
}

// Main function to clear all sounds
async function clearAllSounds() {
  try {
    console.log('⚠️ Getting all sounds to delete...');
    
    // Get all sounds
    const sounds = await getAllSounds();
    console.log(`Found ${sounds.length} sounds to delete.`);
    
    if (sounds.length === 0) {
      console.log('No sounds to delete.');
      return;
    }
    
    console.log('⚠️ WARNING: This will delete all sounds from the system! ⚠️');
    console.log('Proceeding with deletion in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Starting deletion process...');
    
    const results = [];
    
    // Delete each sound
    for (let i = 0; i < sounds.length; i++) {
      const sound = sounds[i];
      console.log(`Deleting (${i+1}/${sounds.length}): ${sound.name} (ID: ${sound.id})`);
      
      const result = await deleteSound(sound.id);
      
      if (result.success) {
        console.log(`✅ Deleted: ${sound.name}`);
        results.push({
          id: sound.id,
          name: sound.name,
          success: true
        });
      } else {
        console.error(`❌ Error deleting ${sound.name}: ${result.error}`);
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
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`\n===== DELETION SUMMARY =====`);
    console.log(`Total sounds processed: ${sounds.length}`);
    console.log(`Successfully deleted: ${successCount}`);
    console.log(`Failed to delete: ${failCount}`);
    
    if (failCount > 0) {
      console.log('\nFailed deletions:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`- ${r.name} (ID: ${r.id}): ${r.error}`);
      });
    }
    
    console.log('\n✨ Sound cleanup complete!');
    
  } catch (error) {
    console.error('Error in sound deletion process:', error);
  }
}

// Execute the function
clearAllSounds();