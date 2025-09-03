const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔧 Initializing Supabase client...');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role for backend operations
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // For JWT verification

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL environment variable is required');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found, using anon key (limited permissions)');
}

// Create Supabase client with service role key for backend operations
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create client for JWT verification (uses anon key)
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

console.log('✅ Supabase client initialized');

module.exports = {
  supabase,
  supabaseAuth,
  supabaseUrl,
  supabaseAnonKey
};