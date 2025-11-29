import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePhaseFlags } from '@/hooks/usePhaseFlags';
import { useRequireAuth, useRequireRole } from '@/hooks/useAuth';
import PageLoading from '@/components/ui/PageLoading';
import AppLayout from '@/components/layout/AppLayout';

// Public pages
import Index from '@/pages/Index';
import Login from '@/pages/Auth/Login';
import Signup from '@/pages/Auth/Signup';
import PredictionsView from '@/pages/PredictionsView';
import Teams from '@/pages/Teams';
import Leagues from '@/pages/Leagues';
import MatchesPage from '@/pages/MatchesPage';
import MatchDetail from '@/pages/MatchDetail';
import TeamDetail from '@/pages/TeamDetail';
import AIChat from '@/pages/AIChat';
import NotFound from '@/pages/NotFound';
import Unauthorized from '@/pages/Unauthorized';
import FeatureFlagsDemo from '@/pages/FeatureFlagsDemo';

// Protected pages
import Dashboard from '@/pages/Dashboard';
import NewPredictions from '@/pages/NewPredictions';
import Phase9 from '@/pages/Phase9';

// Lazy load heavy components
const CrossLeague = React.lazy(() => import('@/pages/CrossLeague'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const EnvVariables = React.lazy(() => import('@/pages/EnvVariables'));
const ScheduledJobsPage = React.lazy(() => import('@/pages/ScheduledJobsPage'));
const ModelsPage = React.lazy(() => import('@/pages/ModelsPage'));
const MonitoringPage = React.lazy(() => import('@/pages/MonitoringPage'));
const PredictionAnalyzerPage = React.lazy(() => import('@/pages/PredictionAnalyzerPage'));

// Lazy load admin components
const AdminDashboard = React.lazy(() => import('@/pages/admin/AdminDashboard'));
const UsersPage = React.lazy(() => import('@/pages/admin/users/UsersPage'));
const RunningJobsPage = React.lazy(() => import('@/pages/admin/jobs/RunningJobsPage'));
const Phase9SettingsPage = React.lazy(() => import('@/pages/admin/phase9/Phase9SettingsPage'));
const HealthDashboard = React.lazy(() => import('@/pages/admin/HealthDashboard'));
const IntegrationsPage = React.lazy(() => import('@/pages/admin/IntegrationsPage'));
const StatsPage = React.lazy(() => import('@/pages/admin/StatsPage'));
const ModelStatusDashboard = React.lazy(() => import('@/pages/admin/ModelStatusDashboard'));
const FeedbackInboxPage = React.lazy(() => import('@/pages/admin/FeedbackInboxPage'));
const PredictionReviewPage = React.lazy(() => import('@/pages/admin/PredictionReviewPage'));

// Route wrapper for protected routes with layout
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
  
  return (
    <AppLayout showSidebar={showSidebar}>
      {children}
    </AppLayout>
  );
};

// Route wrapper for public routes
const PublicRoute: React.FC<{
  children: React.ReactNode;
  showSidebar?: boolean;
}> = ({ children, showSidebar = false }) => {
  return (
    <AppLayout showSidebar={showSidebar}>
      {children}
    </AppLayout>
  );
};

const AppRoutes: React.FC = () => {
  const { isPhase5Enabled, isPhase6Enabled, isPhase7Enabled, isPhase8Enabled, isPhase9Enabled } = usePhaseFlags();

  return (
    <Routes>
      {/* Public routes - minimal layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Main app routes - all use AppLayout with sidebar */}
      <Route element={<AppLayout showSidebar />}>

        {/* Public pages */}
        <Route path="/" element={<Index />} />
        <Route path="/feature-flags" element={<FeatureFlagsDemo />} />
        <Route path="/predictions" element={<PredictionsView />} />
      <Route path="/matches" element={
        <PublicRoute showSidebar>
          <Suspense fallback={<PageLoading message="Loading matches..." />}>
            <MatchesPage />
          </Suspense>
        </PublicRoute>
      } />
        <Route path="/match/:id" element={
          <Suspense fallback={<PageLoading message="Loading match details..." />}>
            <MatchDetail />
          </Suspense>
        } />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:teamName" element={
          <Suspense fallback={<PageLoading message="Loading team details..." />}>
            <TeamDetail />
          </Suspense>
        } />
        <Route path="/leagues" element={<Leagues />} />
        <Route path="/ai-chat" element={
          <Suspense fallback={<PageLoading message="Loading AI Chat..." />}>
            <AIChat />
          </Suspense>
        } />

        {/* Protected routes - authentication wrapper */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/predictions/new" element={
          <ProtectedRoute>
            <NewPredictions />
          </ProtectedRoute>
        } />
      
      {/* Phase 5: Advanced pattern detection */}
      {isPhase5Enabled && (
        <Route path="/patterns" element={
          <ProtectedRoute>
            <div>Phase 5 Pattern Detection</div>
          </ProtectedRoute>
        } />
      )}
      
        {/* Phase features */}
        {isPhase5Enabled && (
          <Route path="/patterns" element={
            <ProtectedRoute>
              <div>Phase 5 Pattern Detection</div>
            </ProtectedRoute>
          } />
        )}
        
        {isPhase6Enabled && (
          <Route path="/models" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading message="Loading models..." />}>
                <ModelsPage />
              </Suspense>
            </ProtectedRoute>
          } />
        )}
        
        {isPhase7Enabled && (
          <Route path="/crossleague" element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading message="Loading cross-league intelligence..." />}>
                <CrossLeague />
              </Suspense>
            </ProtectedRoute>
          } />
        )}
        
        {isPhase8Enabled && (
          <>
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoading message="Loading analytics..." />}>
                  <Analytics />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/monitoring" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoading message="Loading monitoring..." />}>
                  <MonitoringPage />
                </Suspense>
              </ProtectedRoute>
            } />
            <Route path="/prediction-analyzer" element={
              <ProtectedRoute>
                <Suspense fallback={<PageLoading message="Loading prediction analyzer..." />}>
                  <PredictionAnalyzerPage />
                </Suspense>
              </ProtectedRoute>
            } />
          </>
        )}
        
        {isPhase9Enabled && (
          <Route path="/phase9" element={
            <ProtectedRoute>
              <Phase9 />
            </ProtectedRoute>
          } />
        )}

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRoles={['admin', 'analyst']}>
            <Suspense fallback={<PageLoading message="Loading admin dashboard..." />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        } />
      <Route path="/admin/users" element={
        <ProtectedRoute requiredRoles={['admin']}>
          <Suspense fallback={<PageLoading message="Loading user management..." />}>
            <UsersPage />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/admin/jobs" element={
        <ProtectedRoute requiredRoles={['admin', 'analyst']}>
          <Suspense fallback={<PageLoading message="Loading job management..." />}>
            <RunningJobsPage />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/admin/phase9" element={
        <ProtectedRoute requiredRoles={['admin', 'analyst']}>
          <Suspense fallback={<PageLoading message="Loading Phase 9 settings..." />}>
            <Phase9SettingsPage />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/admin/health" element={
        <ProtectedRoute requiredRoles={['admin', 'analyst']}>
          <Suspense fallback={<PageLoading message="Loading health dashboard..." />}>
            <HealthDashboard />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/admin/stats" element={
        <ProtectedRoute requiredRoles={['admin', 'analyst']}>
          <Suspense fallback={<PageLoading message="Loading stats..." />}>
            <StatsPage />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/admin/integrations" element={
        <ProtectedRoute requiredRoles={['admin', 'analyst']}>
          <Suspense fallback={<PageLoading message="Loading integrations..." />}>
            <IntegrationsPage />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/admin/model-status" element={
        <ProtectedRoute requiredRoles={['admin', 'analyst']}>
          <Suspense fallback={<PageLoading message="Loading model status..." />}>
            <ModelStatusDashboard />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/admin/feedback" element={
        <ProtectedRoute requiredRoles={['admin', 'analyst']}>
          <Suspense fallback={<PageLoading message="Loading feedback inbox..." />}>
            <FeedbackInboxPage />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/admin/predictions" element={
        <ProtectedRoute requiredRoles={['admin', 'analyst']}>
          <Suspense fallback={<PageLoading message="Loading prediction review..." />}>
            <PredictionReviewPage />
          </Suspense>
        </ProtectedRoute>
      } />

      {/* Legacy routes for backward compatibility */}
      {(isPhase5Enabled || isPhase6Enabled || isPhase7Enabled || isPhase8Enabled) && (
        <Route path="/jobs" element={
          <ProtectedRoute requiredRoles={['admin', 'analyst']}>
            <Suspense fallback={<PageLoading message="Loading scheduled jobs..." />}>
              <ScheduledJobsPage />
            </Suspense>
          </ProtectedRoute>
        } />
      )}

      {(isPhase6Enabled || isPhase8Enabled) && (
        <Route path="/admin/models" element={
          <ProtectedRoute requiredRoles={['admin', 'analyst']}>
            <Suspense fallback={<PageLoading message="Loading models..." />}>
              <ModelsPage />
            </Suspense>
          </ProtectedRoute>
        } />
      )}

      {isPhase8Enabled && (
        <>
          <Route path="/admin/matches" element={
            <ProtectedRoute requiredRoles={['admin', 'analyst']}>
              <Suspense fallback={<PageLoading message="Loading matches..." />}>
                <MatchesPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/admin/monitoring" element={
            <ProtectedRoute requiredRoles={['admin', 'analyst']}>
              <Suspense fallback={<PageLoading message="Loading monitoring..." />}>
                <MonitoringPage />
              </Suspense>
            </ProtectedRoute>
          } />
        </>
      )}
      
        <Route path="/admin/environment" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <Suspense fallback={<PageLoading message="Loading environment variables..." />}>
              <EnvVariables />
            </Suspense>
          </ProtectedRoute>
        } />
      </Route>

      {/* 404 - no sidebar */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;