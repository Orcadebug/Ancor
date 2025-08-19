import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { initialize } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setLocation('/login?error=auth_failed');
          return;
        }

        if (data.session) {
          // Initialize the auth store with the new session
          await initialize();
          // Redirect to dashboard
          setLocation('/');
        } else {
          // No session found, redirect to login
          setLocation('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setLocation('/login?error=auth_failed');
      }
    };

    handleAuthCallback();
  }, [initialize, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-medium text-slate-900">Completing sign in...</h2>
        <p className="text-sm text-slate-600 mt-2">Please wait while we redirect you.</p>
      </div>
    </div>
  );
}