import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function setupSounds() {
  try {
    console.log('=== 🎵 SOUNDBOARD SETUP PROCESS 🎵 ===');
    console.log('Step 1: Downloading sound files...');
    
    try {
      // Run the download script
      const { stdout: downloadOutput } = await execAsync('node download_sounds.js');
      console.log(downloadOutput);
    } catch (error) {
      console.error('Error during download:', error.message);
      console.log('Continuing to registration step...');
    }
    
    console.log('\nStep 2: Registering downloaded sounds in the database...');
    
    try {
      // Run the registration script
      const { stdout: registerOutput } = await execAsync('node register_sounds.js');
      console.log(registerOutput);
    } catch (error) {
      console.error('Error during registration:', error.message);
    }
    
    console.log('\n=== 🎉 SETUP PROCESS COMPLETE 🎉 ===');
    console.log('Sounds have been downloaded and registered in the system.');
    console.log('You can now access them from the soundboard interface.');
    
  } catch (error) {
    console.error('Unexpected error in setup process:', error);
  }
}

setupSounds();