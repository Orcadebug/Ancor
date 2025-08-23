// Test Supabase auth endpoints
import https from 'https';

const SUPABASE_URL = 'https://uttnerhggnyocazsfmou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dG5lcmhnZ255b2NhenNmbW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODE5MTIsImV4cCI6MjA3MTE1NzkxMn0.7TDkVqvPDgWUlTv9SrGfPPW8di3Nvuc7iwDTRgGQCLA';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'uttnerhggnyocazsfmou.supabase.co',
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAuthEndpoints() {
  console.log('Testing Supabase auth endpoints...\n');

  // Test 1: Check if auth service is available
  try {
    console.log('1. Testing auth service availability...');
    const response = await makeRequest('/auth/v1/settings');
    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Auth service is available');
      const settings = JSON.parse(response.data);
      console.log('External providers:', Object.keys(settings.external || {}));
    } else {
      console.log('❌ Auth service not available');
    }
  } catch (error) {
    console.log('❌ Auth service test failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Check current session
  try {
    console.log('2. Testing session endpoint...');
    const response = await makeRequest('/auth/v1/user');
    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Session endpoint accessible');
    } else if (response.status === 401) {
      console.log('✅ Session endpoint working (no active session)');
    } else {
      console.log('❌ Session endpoint issue');
    }
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Session test failed:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Test signup endpoint (without actually signing up)
  try {
    console.log('3. Testing signup endpoint structure...');
    const response = await makeRequest('/auth/v1/signup', 'POST', {
      email: 'test@example.com',
      password: 'invalid'
    });
    console.log(`Status: ${response.status}`);
    console.log('Response:', response.data);
    
    if (response.status === 400 || response.status === 422) {
      console.log('✅ Signup endpoint is working (expected validation error)');
    } else {
      console.log('❓ Unexpected signup response');
    }
  } catch (error) {
    console.log('❌ Signup test failed:', error.message);
  }
}

testAuthEndpoints();