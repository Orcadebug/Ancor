// Debug version of auth store - paste this in browser console on login page
// This will help identify where the auth process is getting stuck

console.log('=== AUTH DEBUG STARTED ===');

// Check if Supabase is loaded
console.log('1. Checking Supabase client...');
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'NOT SET');

// Check if auth store is accessible
console.log('2. Checking auth store...');
const authStore = window.__ZUSTAND_STORE__?.getState?.();
console.log('Auth store state:', authStore);

// Test Supabase connection
console.log('3. Testing Supabase connection...');
if (window.supabase) {
  console.log('Supabase client found:', window.supabase);
  
  // Test basic query
  window.supabase.from('users').select('count').limit(1)
    .then(result => {
      console.log('✅ Database connection test:', result);
    })
    .catch(error => {
      console.log('❌ Database connection failed:', error);
    });
    
  // Test auth session
  window.supabase.auth.getSession()
    .then(result => {
      console.log('✅ Auth session test:', result);
    })
    .catch(error => {
      console.log('❌ Auth session failed:', error);
    });
    
  // Test Google OAuth (without actually signing in)
  console.log('4. Testing Google OAuth configuration...');
  // This won't actually sign in, just test if the method works
  const testGoogleAuth = async () => {
    try {
      // Just test the method exists and doesn't throw immediately
      console.log('Google OAuth method exists:', typeof window.supabase.auth.signInWithOAuth === 'function');
    } catch (error) {
      console.log('❌ Google OAuth test failed:', error);
    }
  };
  testGoogleAuth();
  
} else {
  console.log('❌ Supabase client not found');
}

// Test email auth with dummy data (won't actually work but will show errors)
console.log('5. Testing email auth method...');
const testEmailAuth = async () => {
  try {
    if (window.supabase) {
      const result = await window.supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'wrongpassword'
      });
      console.log('Email auth test result:', result);
    }
  } catch (error) {
    console.log('Expected email auth error (wrong credentials):', error);
  }
};
testEmailAuth();

console.log('=== AUTH DEBUG COMPLETED ===');
console.log('Please check the results above and look for any ❌ errors');