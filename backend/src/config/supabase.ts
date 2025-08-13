import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  logger.error('Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

// Client for general operations (with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Admin client for bypassing RLS when needed
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);

    if (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }

    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection test error:', error);
    return false;
  }
};

export default supabase;