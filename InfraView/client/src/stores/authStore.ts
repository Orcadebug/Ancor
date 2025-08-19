import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, type User } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, userData: {
    username: string;
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
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (error) throw error;
          
          // Fetch user profile from public.users table
          if (data.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();
            
            set({ 
              user: profile, 
              session: data.session,
              isAuthenticated: true,
              isLoading: false 
            });
          }
        } catch (error) {
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
          
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`
            }
          });
          
          if (error) throw error;
          
          // The actual user setting will happen in the auth callback
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signUp: async (email: string, password: string, userData: {
        username: string;
        organizationName?: string;
      }) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username: userData.username,
                organization_name: userData.organizationName
              }
            }
          });
          
          if (error) throw error;
          
          set({ isLoading: false });
          
          // User profile will be created automatically by the database trigger
        } catch (error) {
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
            // If Supabase is not configured, just set loading to false
            set({ 
              user: null, 
              session: null,
              isAuthenticated: false,
              isLoading: false 
            });
            return;
          }
          
          // Get initial session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Fetch user profile
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            set({ 
              user: profile, 
              session,
              isAuthenticated: true,
              isLoading: false 
            });
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
            if (event === 'SIGNED_IN' && session?.user) {
              // Fetch user profile
              const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              set({ 
                user: profile, 
                session,
                isAuthenticated: true,
                isLoading: false 
              });
            } else if (event === 'SIGNED_OUT') {
              set({ 
                user: null, 
                session: null,
                isAuthenticated: false,
                isLoading: false 
              });
            }
          });
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