import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '@/stores/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user, fetchCurrentUser, isLoading } = useAuthStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If no user but token exists, try to fetch current user
    if (!user && !isLoading) {
      fetchCurrentUser().catch(() => {
        setLocation('/login');
      });
    }
    
    // If not authenticated and not loading, redirect to login
    if (!isAuthenticated && !isLoading) {
      setLocation('/login');
    }
  }, [isAuthenticated, user, isLoading, fetchCurrentUser, setLocation]);

  // Show loading spinner while checking authentication
  if (isLoading || (!isAuthenticated && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, render children
  if (isAuthenticated && user) {
    return <>{children}</>;
  }

  // Default fallback (shouldn't reach here)
  return null;
}