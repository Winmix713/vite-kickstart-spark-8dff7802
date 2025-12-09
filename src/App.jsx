import * as React from 'react';
import ReactGA from 'react-ga4';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect, useRef, useMemo } from 'react';
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { preventDefault } from '@utils/helpers';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import { createCache } from '@emotion/cache';

// styles
import ThemeStyles from '@styles/theme';
import './style.scss';
import '@cms/theme/theme.css';

// libs styles
import 'react-toastify/dist/ReactToastify.min.css';
import 'react-grid-layout/css/styles.css';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

// contexts
import { SidebarProvider } from '@contexts/SidebarContext';
import { useThemeProvider } from '@contexts/themeContext';
import { AuthProvider } from '@contexts/AuthContext';

// hooks
import { useWindowSize } from '@hooks/useWindowSize';
import { useAuthRoute } from '@hooks/useAuthRoute';

// components
import { Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import LoadingScreen from '@components/LoadingScreen';
import Sidebar from '@layout/Sidebar';
import BottomNav from '@layout/BottomNav';
import Navbar from '@layout/Navbar';
import ShoppingCart from '@widgets/ShoppingCart';
import ScrollToTop from '@components/ScrollToTop';
import ProtectedRoute from '@components/ProtectedRoute';
import RoleGate from '@components/RoleGate';

// pages
const ClubSummary = lazy(() => import('@pages/ClubSummary'));
const GameSummary = lazy(() => import('@pages/GameSummary'));
const Championships = lazy(() => import('@pages/Championships'));
const LeagueOverview = lazy(() => import('@pages/LeagueOverview'));
const FansCommunity = lazy(() => import('@pages/FansCommunity'));
const Statistics = lazy(() => import('@pages/Statistics'));
const PageNotFound = lazy(() => import('@pages/PageNotFound'));
const MatchSummary = lazy(() => import('@pages/MatchSummary'));
const MatchOverview = lazy(() => import('@pages/MatchOverview'));
const PlayerProfile = lazy(() => import('@pages/PlayerProfile'));
const Schedule = lazy(() => import('@pages/Schedule'));
const Tickets = lazy(() => import('@pages/Tickets'));
const FootballStore = lazy(() => import('@pages/FootballStore'));
const BrandStore = lazy(() => import('@pages/BrandStore'));
const Product = lazy(() => import('@pages/Product'));
const Login = lazy(() => import('@pages/Login'));
const SignUp = lazy(() => import('@pages/SignUp'));
const Settings = lazy(() => import('@pages/Settings'));

// winmixpro admin pages
const WinmixProAdmin = lazy(() => import('@pages/winmixpro'));

// CMS Runtime Renderer
const PublishedPage = lazy(() => import('@pages/public/PublishedPage'));

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const App = () => {
  const appRef = useRef(null);
  const { theme, direction } = useThemeProvider();
  const { width } = useWindowSize();
  const location = useLocation();
  const isAuthRoute = useAuthRoute();

  // Google Analytics inicializálás - csak egyszer fut le
  useEffect(() => {
    const gaKey = import.meta.env.VITE_PUBLIC_GA;
    if (gaKey) {
      ReactGA.initialize(gaKey);
    }
  }, []);

  // RTL pluginok memoizálása
  const plugins = useMemo(() => 
    direction === 'rtl' ? [rtlPlugin] : [], 
    [direction]
  );

  // MUI téma memoizálása
  const muiTheme = useMemo(() => createTheme({
    direction
  }), [direction]);

  // Emotion cache memoizálása
  const emotionCache = useMemo(() => createCache({
    key: direction === 'rtl' ? 'muirtl' : 'muiltr',
    stylisPlugins: plugins,
  }), [direction, plugins]);

  // Toast pozíció memoizálása
  const toastPosition = useMemo(() => 
    direction === 'ltr' ? 'top-right' : 'top-left', 
    [direction]
  );

  // Scroll to top route változáskor
  useEffect(() => {
    if (appRef.current) {
      appRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // preventDefault inicializálása - csak egyszer
  useEffect(() => {
    preventDefault();
  }, []);

  // Mobil nézet ellenőrzése
  const isMobile = width < 768;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CacheProvider value={emotionCache}>
          <MuiThemeProvider theme={muiTheme}>
            <SidebarProvider>
              <ThemeProvider theme={{ theme }}>
                <ThemeStyles />
                <ToastContainer 
                  theme={theme} 
                  autoClose={2500} 
                  position={toastPosition} 
                />
                <StyleSheetManager stylisPlugins={plugins}>
                  <div 
                    className={`app ${isAuthRoute ? 'fluid' : ''}`} 
                    ref={appRef}
                  >
                    <ScrollToTop />
                    {!isAuthRoute && (
                      <>
                        <Sidebar />
                        {isMobile && <Navbar />}
                        {isMobile && <BottomNav />}
                      </>
                    )}
                    <div className="app_container">
                      <div className="app_container-content d-flex flex-column flex-1">
                        <Suspense fallback={<LoadingScreen />}>
                          <Routes>
                            {/* Public routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/sign-up" element={<SignUp />} />
                            
                            {/* Public runtime renderer (CMS Phase 4) */}
                            <Route 
                              path="/p/:slug" 
                              element={<PublishedPage />} 
                            />

                            {/* Protected routes */}
                            <Route 
                              path="/" 
                              element={
                                <ProtectedRoute>
                                  <ClubSummary />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/game-summary" 
                              element={
                                <ProtectedRoute>
                                  <GameSummary />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/championships" 
                              element={
                                <ProtectedRoute>
                                  <Championships />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/league-overview" 
                              element={
                                <ProtectedRoute>
                                  <LeagueOverview />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/fans-community" 
                              element={
                                <ProtectedRoute>
                                  <FansCommunity />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/statistics" 
                              element={
                                <ProtectedRoute>
                                  <Statistics />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/match-summary" 
                              element={
                                <ProtectedRoute>
                                  <MatchSummary />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/match-overview" 
                              element={
                                <ProtectedRoute>
                                  <MatchOverview />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/player-profile" 
                              element={
                                <ProtectedRoute>
                                  <PlayerProfile />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/schedule" 
                              element={
                                <ProtectedRoute>
                                  <Schedule />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/tickets" 
                              element={
                                <ProtectedRoute>
                                  <Tickets />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/football-store" 
                              element={
                                <ProtectedRoute>
                                  <FootballStore />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/brand-store" 
                              element={
                                <ProtectedRoute>
                                  <BrandStore />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/product" 
                              element={
                                <ProtectedRoute>
                                  <Product />
                                </ProtectedRoute>
                              } 
                            />
                            <Route 
                              path="/settings" 
                              element={
                                <ProtectedRoute>
                                  <Settings />
                                </ProtectedRoute>
                              } 
                            />
                            
                            {/* Admin Routes */}
                            <Route 
                              path="/winmixpro/admin/*" 
                              element={
                                <ProtectedRoute>
                                  <RoleGate allowedRoles={['admin']}>
                                    <WinmixProAdmin />
                                  </RoleGate>
                                </ProtectedRoute>
                              } 
                            />
                            
                            <Route path="*" element={<PageNotFound />} />
                          </Routes>
                        </Suspense>
                      </div>
                    </div>
                    <ShoppingCart isPopup />
                  </div>
                </StyleSheetManager>
              </ThemeProvider>
            </SidebarProvider>
          </MuiThemeProvider>
        </CacheProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;