import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types based on your schema
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  organization_id?: string;
  organization_name?: string;
  created_at: string;
}

export interface Deployment {
  id: string;
  user_id: string;
  name: string;
  industry: string;
  model: string;
  provider: string;
  status: string;
  chat_url?: string;
  api_url?: string;
  monthly_cost?: number;
  platform_fee?: number;
  configuration: any;
  created_at: string;
  deployed_at?: string;
}

export interface Document {
  id: string;
  user_id: string;
  deployment_id?: string;
  name: string;
  type: string;
  size: number;
  status: string;
  upload_progress: number;
  processed_at?: string;
  created_at: string;
}