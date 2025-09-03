import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured. Authentication will not work.');
}

// Get the current URL for redirect configuration
const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth-callback`;
  }
  return 'http://localhost:3002/auth-callback';
};

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        redirectTo: getRedirectUrl()
      }
    })
  : null;

// Database types based on your schema
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  organization_id?: string;
  role: string;
  created_at: string;
  updated_at: string;
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