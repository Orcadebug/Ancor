import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  organization_id?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, userData: {
    fullName: string;
    organizationName?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,

      signInWithEmail: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          if (!supabase) {
            throw new Error('Supabase not configured. Please set up your environment variables.');
          }
          
          console.log('Attempting email sign in for:', email);
          
          // Add timeout to prevent hanging
          const signInPromise = supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Sign in timeout - please try again')), 15000);
          });
          
          const { data, error } = await Promise.race([signInPromise, timeoutPromise]);
          
          if (error) {
            console.error('Sign in error:', error);
            throw error;
          }
          
          console.log('Sign in successful, fetching profile...');
          
          // Fetch user profile from public.users table
          if (data.user) {
            try {
              const profilePromise = supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single();
                
              const profileTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
              });
              
              const { data: profile, error: profileError } = await Promise.race([
                profilePromise, 
                profileTimeoutPromise
              ]);
              
              if (profileError) {
                console.warn('Profile fetch error, using basic profile:', profileError);
                // If profile doesn't exist, create a basic one
                const basicProfile = {
                  id: data.user.id,
                  email: data.user.email || '',
                  full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
                  avatar_url: data.user.user_metadata?.avatar_url || '',
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                set({ 
                  user: basicProfile, 
                  session: data.session,
                  isAuthenticated: true,
                  isLoading: false 
                });
              } else {
                set({ 
                  user: profile, 
                  session: data.session,
                  isAuthenticated: true,
                  isLoading: false 
                });
              }
            } catch (profileError) {
              console.warn('Profile fetch failed, proceeding with basic profile:', profileError);
              // Still set authenticated with basic profile
              const basicProfile = {
                id: data.user.id,
                email: data.user.email || '',
                full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
                avatar_url: data.user.user_metadata?.avatar_url || '',
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              set({ 
                user: basicProfile, 
                session: data.session,
                isAuthenticated: true,
                isLoading: false 
              });
            }
          }
        } catch (error) {
          console.error('Auth error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      signInWithGoogle: async () => {
        set({ isLoading: true });
        try {
          if (!supabase) {
            throw new Error('Supabase not configured. Please set up your environment variables.');
          }
          
          console.log('Attempting Google sign in...');
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`
            }
          });
          
          if (error) {
            console.error('Google sign in error:', error);
            throw error;
          }
          
          // The actual user setting will happen in the auth callback
          // Don't set loading to false here as we're redirecting
        } catch (error) {
          console.error('Google auth error:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      signUp: async (email: string, password: string, userData: {
        fullName: string;
        organizationName?: string;
      }) => {
        set({ isLoading: true });
        try {
          if (!supabase) {
            throw new Error('Supabase not configured. Please set up your environment variables.');
          }
          
          console.log('Attempting to sign up user:', email);
          
          // Add timeout to prevent hanging
          const signUpPromise = supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: userData.fullName,
                organization_name: userData.organizationName
              }
            }
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Sign up timeout - please try again')), 15000);
          });
          
          const { data, error } = await Promise.race([signUpPromise, timeoutPromise]);
          
          if (error) {
            console.error('Sign up error:', error);
            throw error;
          }
          
          console.log('Sign up successful:', data.user ? 'User created' : 'Confirmation required');
          set({ isLoading: false });
          
          // User profile will be created automatically by the database trigger
        } catch (error) {
          console.error('Sign up failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({ 
          user: null, 
          session: null,
          isAuthenticated: false 
        });
      },

      initialize: async () => {
        set({ isLoading: true });
        
        try {
          if (!supabase) {
            console.warn('Supabase not configured, skipping auth initialization');
            set({ 
              user: null, 
              session: null,
              isAuthenticated: false,
              isLoading: false 
            });
            return;
          }
          
          console.log('Initializing auth...');
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Auth initialization timeout')), 10000);
          });
          
          // Get initial session with timeout
          const sessionPromise = supabase.auth.getSession();
          const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
          
          console.log('Initial session:', session ? 'Found' : 'None');
          
          if (session?.user) {
            console.log('Fetching user profile for:', session.user.id);
            
            // Fetch user profile with timeout
            const profilePromise = supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            const { data: profile, error: profileError } = await Promise.race([
              profilePromise, 
              new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 5000))
            ]);
            
            if (profileError) {
              console.warn('Profile fetch error, using basic profile:', profileError);
              // Create basic profile from auth user
              const basicProfile = {
                id: session.user.id,
                email: session.user.email || '',
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                avatar_url: session.user.user_metadata?.avatar_url || '',
                role: 'user',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              set({ 
                user: basicProfile, 
                session,
                isAuthenticated: true,
                isLoading: false 
              });
            } else {
              set({ 
                user: profile, 
                session,
                isAuthenticated: true,
                isLoading: false 
              });
            }
          } else {
            set({ 
              user: null, 
              session: null,
              isAuthenticated: false,
              isLoading: false 
            });
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event, session ? 'with session' : 'no session');
            
            if (event === 'SIGNED_IN' && session?.user) {
              // Fetch user profile
              const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (profileError) {
                console.warn('Profile fetch error on sign in:', profileError);
                // Use basic profile
                const basicProfile = {
                  id: session.user.id,
                  email: session.user.email || '',
                  full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                  avatar_url: session.user.user_metadata?.avatar_url || '',
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                };
                
                set({ 
                  user: basicProfile, 
                  session,
                  isAuthenticated: true,
                  isLoading: false 
                });
              } else {
                set({ 
                  user: profile, 
                  session,
                  isAuthenticated: true,
                  isLoading: false 
                });
              }
            } else if (event === 'SIGNED_OUT') {
              set({ 
                user: null, 
                session: null,
                isAuthenticated: false,
                isLoading: false 
              });
            }
          });
          
          console.log('Auth initialization completed');
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ 
            user: null, 
            session: null,
            isAuthenticated: false,
            isLoading: false 
          });
        }
      },

      updateProfile: async (userData: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) throw new Error('No user logged in');

        const { error } = await supabase
          .from('users')
          .update(userData)
          .eq('id', currentUser.id);

        if (error) throw error;

        set({ user: { ...currentUser, ...userData } });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        session: state.session,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);