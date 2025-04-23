import fetch from 'node-fetch';

async function loginAsAdmin() {
  const response = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'alarms12'
    }),
    redirect: 'manual'
  });
  
  if (response.status === 200 || response.status === 302) {
    console.log('Login successful');
    // Get cookies from the response
    const cookies = response.headers.raw()['set-cookie'];
    return cookies ? cookies.join('; ') : '';
  } else {
    console.error('Login failed with status:', response.status);
    const text = await response.text();
    console.error('Response:', text);
    return null;
  }
}

async function testCookieClicker(cookies) {
  // Get current cookie-clicker data
  const getResponse = await fetch('http://localhost:5000/api/games/cookie-clicker', {
    headers: {
      'Cookie': cookies
    }
  });
  
  if (getResponse.ok) {
    const data = await getResponse.json();
    console.log('Current cookie-clicker data:', data);
    
    // Reset the game
    const resetResponse = await fetch('http://localhost:5000/api/games/cookie-clicker/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies
      }
    });
    
    if (resetResponse.ok) {
      const resetData = await resetResponse.json();
      console.log('Game reset data:', resetData);
      
      // Verify if cookies is reset to 0
      if (resetData.cookies === 0) {
        console.log('✅ Reset functionality works! Cookies reset to 0');
      } else {
        console.log('❌ Reset functionality did not reset cookies to 0');
      }
      
      // Save some cookies to test functional updates
      const saveResponse = await fetch('http://localhost:5000/api/games/cookie-clicker/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          cookies: 10,
          clickPower: 1,
          autoClickers: 0,
          grandmas: 0,
          factories: 0,
          background: "none"
        })
      });
      
      if (saveResponse.ok) {
        const saveData = await saveResponse.json();
        console.log('Saved data with 10 cookies:', saveData);
        
        // Get current data again to verify
        const verifyResponse = await fetch('http://localhost:5000/api/games/cookie-clicker', {
          headers: {
            'Cookie': cookies
          }
        });
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log('Verified data:', verifyData);
          if (verifyData.cookies === 10) {
            console.log('✅ Saving functionality works! Cookies correctly set to 10');
          } else {
            console.log('❌ Saving functionality did not set cookies to 10');
          }
        }
      }
    } else {
      console.error('Failed to reset game:', await resetResponse.text());
    }
  } else {
    console.error('Failed to get cookie-clicker data:', await getResponse.text());
  }
}

async function main() {
  try {
    const cookies = await loginAsAdmin();
    if (cookies) {
      await testCookieClicker(cookies);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();