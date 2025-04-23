import axios from 'axios';

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

async function createCategory(name, cookie) {
  try {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const response = await axios.post('http://localhost:5000/api/categories', {
      name,
      slug
    }, {
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie
      }
    });
    
    console.log(`Created category: ${name}`);
    return response.data;
  } catch (error) {
    console.error(`Error creating category ${name}:`, error.message);
    throw error;
  }
}

async function setupCategories() {
  try {
    const cookie = await loginAsAdmin();
    
    // Define categories
    const categories = [
      'Sound Effects',
      'Memes',
      'Music',
      'Funny',
      'Alerts'
    ];
    
    console.log(`Creating ${categories.length} categories...`);
    
    for (const category of categories) {
      await createCategory(category, cookie);
    }
    
    console.log('All categories created successfully.');
  } catch (error) {
    console.error('Failed to create categories:', error.message);
  }
}

setupCategories();