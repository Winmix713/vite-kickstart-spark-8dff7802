import { ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
interface AuthGateProps {
  children: ReactNode;
  requireAuth?: boolean;
  allowedRoles?: Array<'admin' | 'analyst' | 'user'>;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/login', '/signup'];

// Routes accessible in demo mode (read-only)
const DEMO_ROUTES = ['/', '/predictions', '/matches', '/teams', '/leagues'];
const AuthGate = ({
  children,
  requireAuth = true,
  allowedRoles = ['admin', 'analyst', 'user']
}: AuthGateProps) => {
  const {
    user,
    profile,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (loading) return;
    const currentPath = location.pathname;
    const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);
    const isDemoRoute = DEMO_ROUTES.some(route => currentPath.startsWith(route));

    // If route doesn't require auth, allow access
    if (!requireAuth || isPublicRoute) {
      return;
    }

    // If user is not authenticated
    if (!user) {
      // Allow demo routes for unauthenticated users (read-only access)
      if (isDemoRoute) {
        return;
      }

      // Redirect to login for protected routes
      navigate('/login', {
        state: {
          from: location.pathname
        },
        replace: true
      });
      return;
    }

    // If user is authenticated, check role permissions
    if (profile && !allowedRoles.includes(profile.role)) {
      navigate('/dashboard', {
        replace: true
      });
      return;
    }
  }, [user, profile, loading, requireAuth, allowedRoles, navigate, location]);

  // Show loading spinner while checking auth state
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>;
  }
  return <>{children}</>;
};
export default AuthGate;