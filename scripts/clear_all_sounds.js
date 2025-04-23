import axios from 'axios';
import fs from 'fs';
import path from 'path';

async function loginAsAdmin() {
  try {
    const response = await axios.post('http://localhost:5000/api/login', {
      username: 'admin',
      password: 'alarms12'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const cookies = response.headers['set-cookie'];
    return cookies.join(';');
  } catch (error) {
    console.error('Error logging in as admin:', error.message);
    throw error;
  }
}

async function getAllSounds(cookie) {
  try {
    const response = await axios.get('http://localhost:5000/api/sounds', {
      headers: {
        Cookie: cookie
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching sounds:', error.message);
    throw error;
  }
}

async function deleteSound(soundId, cookie) {
  try {
    await axios.delete(`http://localhost:5000/api/sounds/${soundId}`, {
      headers: {
        Cookie: cookie
      }
    });
    console.log(`Deleted sound with ID: ${soundId}`);
  } catch (error) {
    console.error(`Error deleting sound ${soundId}:`, error.message);
    throw error;
  }
}

async function clearAllSounds() {
  try {
    const cookie = await loginAsAdmin();
    const sounds = await getAllSounds(cookie);
    
    if (sounds.length === 0) {
      console.log('No sounds found to delete.');
      return;
    }
    
    console.log(`Found ${sounds.length} sound(s) to delete.`);
    
    for (const sound of sounds) {
      await deleteSound(sound.id, cookie);
    }
    
    console.log('All sounds have been deleted successfully.');
  } catch (error) {
    console.error('Failed to clear sounds:', error.message);
  }
}

clearAllSounds();