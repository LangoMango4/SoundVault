import http from 'http';

// Categories to create
const categories = [
  {
    name: 'Memes',
    slug: 'memes',
    description: 'Popular meme sound effects',
    color: '#FF5733'
  },
  {
    name: 'Windows',
    slug: 'windows',
    description: 'Windows OS sound effects',
    color: '#4287f5'
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Game-related sound effects',
    color: '#33FF57'
  },
  {
    name: 'Anime',
    slug: 'anime',
    description: 'Anime sound effects',
    color: '#F033FF'
  },
  {
    name: 'Uncategorized',
    slug: 'uncategorized',
    description: 'Default category for sounds',
    color: '#CCCCCC'
  }
];

// Function to create a category via API
async function createCategory(category) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(category);

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/categories/create-direct',
      method: 'POST',
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
        if (res.statusCode === 201) {
          try {
            const data = JSON.parse(body);
            resolve({ success: true, data });
          } catch (error) {
            resolve({ success: true, data: { message: 'Category created successfully but could not parse response' } });
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

// Main function to create categories
async function createCategories() {
  try {
    console.log('Creating sound categories...');
    
    const results = [];
    
    // Create each category
    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      console.log(`Creating category (${i+1}/${categories.length}): ${category.name}`);
      
      const result = await createCategory(category);
      
      if (result.success) {
        console.log(`✅ Created: ${category.name}`);
        results.push({
          name: category.name,
          success: true,
          data: result.data
        });
      } else {
        console.error(`❌ Error creating ${category.name}: ${result.error}`);
        results.push({
          name: category.name,
          success: false,
          error: result.error
        });
      }
      
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Final report
    const successCount = results.filter(r => r.success).length;
    console.log(`✨ Category creation complete! ${successCount}/${categories.length} categories created successfully.`);
    
    return results;
  } catch (error) {
    console.error('Error in category creation process:', error);
    return [];
  }
}

// Execute the category creation process
createCategories();