// Simple Node.js test for Supabase connection
// Run with: node test-auth-simple.js

import https from 'https';

const SUPABASE_URL = 'https://uttnerhggnyocazsfmou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dG5lcmhnZ255b2NhenNmbW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODE5MTIsImV4cCI6MjA3MTE1NzkxMn0.7TDkVqvPDgWUlTv9SrGfPPW8di3Nvuc7iwDTRgGQCLA';

console.log('Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

// Test basic connection to Supabase
const options = {
  hostname: 'uttnerhggnyocazsfmou.supabase.co',
  port: 443,
  path: '/rest/v1/users?select=count&limit=1',
  method: 'GET',
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response:', data);
    
    if (res.statusCode === 200) {
      console.log('✅ Supabase connection successful');
    } else if (res.statusCode === 401) {
      console.log('❌ Authentication failed - check your API key');
    } else if (res.statusCode === 404) {
      console.log('❌ Table not found - check if users table exists');
    } else {
      console.log('❌ Connection failed with status:', res.statusCode);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();