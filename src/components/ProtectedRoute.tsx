import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Carry the intended destination through the login round-trip; Auth
    // reads ?next= and only honours same-origin relative paths. Without this
    // a deep link to a project always landed on the dashboard after signing in.
    const next = `${location.pathname}${location.search}${location.hash}`;
    const target = next && next !== '/' ? `/auth?next=${encodeURIComponent(next)}` : '/auth';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
