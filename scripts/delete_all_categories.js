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

async function getAllCategories(cookie) {
  try {
    const response = await axios.get('http://localhost:5000/api/categories', {
      headers: {
        Cookie: cookie
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    throw error;
  }
}

async function deleteCategory(categoryId, cookie) {
  try {
    await axios.delete(`http://localhost:5000/api/categories/${categoryId}`, {
      headers: {
        Cookie: cookie
      }
    });
    console.log(`Deleted category with ID: ${categoryId}`);
  } catch (error) {
    console.error(`Error deleting category ${categoryId}:`, error.message);
    throw error;
  }
}

async function deleteAllCategories() {
  try {
    const cookie = await loginAsAdmin();
    const categories = await getAllCategories(cookie);
    
    if (categories.length === 0) {
      console.log('No categories found to delete.');
      return;
    }
    
    console.log(`Found ${categories.length} categor(ies) to delete.`);
    
    for (const category of categories) {
      await deleteCategory(category.id, cookie);
    }
    
    console.log('All categories have been deleted successfully.');
  } catch (error) {
    console.error('Failed to delete categories:', error.message);
  }
}

deleteAllCategories();