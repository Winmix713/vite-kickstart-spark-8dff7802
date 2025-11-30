import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePhaseFlags } from '@/hooks/usePhaseFlags';
import { useRequireAuth, useRequireRole } from '@/hooks/useAuth';
import PageLoading from '@/components/ui/PageLoading';
import AppLayout from '@/components/layout/AppLayout';

// Public pages - eager load for better initial performance
import Index from '@/pages/Index';
import Login from '@/pages/Auth/Login';
import Signup from '@/pages/Auth/Signup';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import FeatureFlagsDemo from '@/pages/FeatureFlagsDemo';

// Protected pages - eager load frequently accessed
import Dashboard from '@/pages/Dashboard';

// Lazy load everything else
const PredictionsView = lazy(() => import('@/pages/PredictionsView'));
const Teams = lazy(() => import('@/pages/Teams'));
const Leagues = lazy(() => import('@/pages/Leagues'));
const MatchesPage = lazy(() => import('@/pages/MatchesPage'));
const MatchDetail = lazy(() => import('@/pages/MatchDetail'));
const TeamDetail = lazy(() => import('@/pages/TeamDetail'));
const AIChat = lazy(() => import('@/pages/AIChat'));
const NewPredictions = lazy(() => import('@/pages/NewPredictions'));
const Phase9 = lazy(() => import('@/pages/Phase9'));
const CrossLeague = lazy(() => import('@/pages/CrossLeague'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const ModelsPage = lazy(() => import('@/pages/ModelsPage'));
const MonitoringPage = lazy(() => import('@/pages/MonitoringPage'));
const PredictionAnalyzerPage = lazy(() => import('@/pages/PredictionAnalyzerPage'));
const EnvVariables = lazy(() => import('@/pages/EnvVariables'));
const ScheduledJobsPage = lazy(() => import('@/pages/ScheduledJobsPage'));

// Admin pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const UsersPage = lazy(() => import('@/pages/admin/users/UsersPage'));
const RunningJobsPage = lazy(() => import('@/pages/admin/jobs/RunningJobsPage'));
const Phase9SettingsPage = lazy(() => import('@/pages/admin/phase9/Phase9SettingsPage'));
const HealthDashboard = lazy(() => import('@/pages/admin/HealthDashboard'));
const IntegrationsPage = lazy(() => import('@/pages/admin/IntegrationsPage'));
const StatsPage = lazy(() => import('@/pages/admin/StatsPage'));
const ModelStatusDashboard = lazy(() => import('@/pages/admin/ModelStatusDashboard'));
const FeedbackInboxPage = lazy(() => import('@/pages/admin/FeedbackInboxPage'));
const PredictionReviewPage = lazy(() => import('@/pages/admin/PredictionReviewPage'));

// WinmixPro
const WinmixProLayout = lazy(() => import('@/winmixpro/WinmixProLayout'));

// Reusable Suspense wrapper
const LazyRoute: React.FC<{ 
  children: React.ReactNode;
  message?: string;
}> = ({ children, message = "Loading..." }) => (
  <Suspense fallback={<PageLoading message={message} />}>
    {children}
  </Suspense>
);

// Protected route wrapper
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRoles?: string[];
  showSidebar?: boolean;
}> = ({ children, requiredRoles, showSidebar = true }) => {
  const { loading: authLoading, authenticated } = useRequireAuth();
  const { loading: roleLoading, authorized } = useRequireRole(requiredRoles || []);

  if (authLoading || roleLoading) {
    return <PageLoading message="Checking permissions..." />;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !authorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <AppLayout showSidebar={showSidebar}>{children}</AppLayout>;
};

// Public route wrapper
const PublicRoute: React.FC<{
  children: React.ReactNode;
  showSidebar?: boolean;
}> = ({ children, showSidebar = false }) => (
  <AppLayout showSidebar={showSidebar}>{children}</AppLayout>
);

// Smart home route
const HomeRoute: React.FC = () => {
  const { loading, authenticated } = useRequireAuth();

  if (loading) {
    return <PageLoading message="Loading..." />;
  }

  if (authenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PublicRoute>
      <Index />
    </PublicRoute>
  );
};

// Route configuration types
interface RouteConfig {
  path: string;
  element: React.ReactNode;
  phaseRequired?: 'phase5' | 'phase6' | 'phase7' | 'phase8' | 'phase9';
}

const AppRoutes: React.FC = () => {
  const {
    isPhase5Enabled,
    isPhase6Enabled,
    isPhase7Enabled,
    isPhase8Enabled,
    isPhase9Enabled
  } = usePhaseFlags();

  // Helper to check if phase is enabled
  const isPhaseEnabled = (phase?: string): boolean => {
    if (!phase) return true;
    
    const phaseMap = {
      phase5: isPhase5Enabled,
      phase6: isPhase6Enabled,
      phase7: isPhase7Enabled,
      phase8: isPhase8Enabled,
      phase9: isPhase9Enabled,
    };
    
    return phaseMap[phase as keyof typeof phaseMap] ?? true;
  };

  // Protected routes configuration
  const protectedRoutes: RouteConfig[] = [
    {
      path: '/dashboard',
      element: <Dashboard />
    },
    {
      path: '/predictions/new',
      element: <LazyRoute message="Loading predictions..."><NewPredictions /></LazyRoute>
    },
    {
      path: '/patterns',
      element: <div>Phase 5 Pattern Detection</div>,
      phaseRequired: 'phase5'
    },
    {
      path: '/models',
      element: <LazyRoute message="Loading models..."><ModelsPage /></LazyRoute>,
      phaseRequired: 'phase6'
    },
    {
      path: '/crossleague',
      element: <LazyRoute message="Loading cross-league intelligence..."><CrossLeague /></LazyRoute>,
      phaseRequired: 'phase7'
    },
    {
      path: '/analytics',
      element: <LazyRoute message="Loading analytics..."><Analytics /></LazyRoute>,
      phaseRequired: 'phase8'
    },
    {
      path: '/monitoring',
      element: <LazyRoute message="Loading monitoring..."><MonitoringPage /></LazyRoute>,
      phaseRequired: 'phase8'
    },
    {
      path: '/prediction-analyzer',
      element: <LazyRoute message="Loading prediction analyzer..."><PredictionAnalyzerPage /></LazyRoute>,
      phaseRequired: 'phase8'
    },
    {
      path: '/phase9',
      element: <LazyRoute message="Loading Phase 9..."><Phase9 /></LazyRoute>,
      phaseRequired: 'phase9'
    }
  ];

  // Admin routes configuration
  const adminRoutes: RouteConfig[] = [
    {
      path: '/admin',
      element: <LazyRoute message="Loading admin dashboard..."><AdminDashboard /></LazyRoute>
    },
    {
      path: '/admin/users',
      element: <LazyRoute message="Loading user management..."><UsersPage /></LazyRoute>
    },
    {
      path: '/admin/jobs',
      element: <LazyRoute message="Loading job management..."><RunningJobsPage /></LazyRoute>
    },
    {
      path: '/admin/phase9',
      element: <LazyRoute message="Loading Phase 9 settings..."><Phase9SettingsPage /></LazyRoute>
    },
    {
      path: '/admin/health',
      element: <LazyRoute message="Loading health dashboard..."><HealthDashboard /></LazyRoute>
    },
    {
      path: '/admin/stats',
      element: <LazyRoute message="Loading stats..."><StatsPage /></LazyRoute>
    },
    {
      path: '/admin/integrations',
      element: <LazyRoute message="Loading integrations..."><IntegrationsPage /></LazyRoute>
    },
    {
      path: '/admin/model-status',
      element: <LazyRoute message="Loading model status..."><ModelStatusDashboard /></LazyRoute>
    },
    {
      path: '/admin/feedback',
      element: <LazyRoute message="Loading feedback inbox..."><FeedbackInboxPage /></LazyRoute>
    },
    {
      path: '/admin/predictions',
      element: <LazyRoute message="Loading prediction review..."><PredictionReviewPage /></LazyRoute>
    },
    {
      path: '/admin/environment',
      element: <LazyRoute message="Loading environment variables..."><EnvVariables /></LazyRoute>
    },
    {
      path: '/jobs',
      element: <LazyRoute message="Loading scheduled jobs..."><ScheduledJobsPage /></LazyRoute>,
      phaseRequired: 'phase5' // Shows if any phase 5-8 is enabled
    },
    {
      path: '/admin/models',
      element: <LazyRoute message="Loading models..."><ModelsPage /></LazyRoute>,
      phaseRequired: 'phase6'
    }
  ];

  return (
    <Routes>
      {/* Home route */}
      <Route path="/" element={<HomeRoute />} />

      {/* Public routes - no auth required */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/unauthorized" element={<PublicRoute><Unauthorized /></PublicRoute>} />
      <Route path="/feature-flags" element={<PublicRoute><FeatureFlagsDemo /></PublicRoute>} />

      {/* Public demo routes with sidebar */}
      <Route 
        path="/predictions" 
        element={
          <PublicRoute showSidebar>
            <LazyRoute message="Loading predictions..."><PredictionsView /></LazyRoute>
          </PublicRoute>
        } 
      />
      <Route 
        path="/matches" 
        element={
          <PublicRoute showSidebar>
            <LazyRoute message="Loading matches..."><MatchesPage /></LazyRoute>
          </PublicRoute>
        } 
      />
      <Route 
        path="/match/:id" 
        element={
          <PublicRoute showSidebar>
            <LazyRoute message="Loading match details..."><MatchDetail /></LazyRoute>
          </PublicRoute>
        } 
      />
      <Route 
        path="/teams" 
        element={
          <PublicRoute showSidebar>
            <LazyRoute message="Loading teams..."><Teams /></LazyRoute>
          </PublicRoute>
        } 
      />
      <Route 
        path="/teams/:teamName" 
        element={
          <PublicRoute showSidebar>
            <LazyRoute message="Loading team details..."><TeamDetail /></LazyRoute>
          </PublicRoute>
        } 
      />
      <Route 
        path="/leagues" 
        element={
          <PublicRoute showSidebar>
            <LazyRoute message="Loading leagues..."><Leagues /></LazyRoute>
          </PublicRoute>
        } 
      />
      <Route 
        path="/ai-chat" 
        element={
          <PublicRoute showSidebar>
            <LazyRoute message="Loading AI Chat..."><AIChat /></LazyRoute>
          </PublicRoute>
        } 
      />

      {/* Protected routes */}
      {protectedRoutes.map(({ path, element, phaseRequired }) => 
        isPhaseEnabled(phaseRequired) && (
          <Route 
            key={path}
            path={path} 
            element={<ProtectedRoute>{element}</ProtectedRoute>} 
          />
        )
      )}

      {/* Admin routes */}
      {adminRoutes.map(({ path, element, phaseRequired }) => 
        isPhaseEnabled(phaseRequired) && (
          <Route 
            key={path}
            path={path} 
            element={
              <ProtectedRoute requiredRoles={path === '/admin/users' || path === '/admin/environment' ? ['admin'] : ['admin', 'analyst']}>
                {element}
              </ProtectedRoute>
            } 
          />
        )
      )}

      {/* WinmixPro routes */}
      <Route 
        path="/winmixpro" 
        element={
          <PublicRoute>
            <LazyRoute message="Loading WinmixPro..."><WinmixProLayout /></LazyRoute>
          </PublicRoute>
        } 
      />

      {/* 404 */}
      <Route path="*" element={<PublicRoute><NotFound /></PublicRoute>} />
    </Routes>
  );
};

export default AppRoutes;