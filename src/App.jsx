import * as React from 'react';
import ReactGA from 'react-ga4';

// utils
import { lazy, Suspense, useEffect, useRef, useMemo } from 'react';
import { StyleSheetManager, ThemeProvider } from 'styled-components';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { preventDefault } from '@utils/helpers';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// styles
import ThemeStyles from '@styles/theme';
import './style.scss';

// libs styles
import 'react-toastify/dist/ReactToastify.min.css';
import 'react-grid-layout/css/styles.css';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

// contexts
import { SidebarProvider } from '@contexts/sidebarContext';
import { useThemeProvider } from '@contexts/themeContext';

// hooks
import { useWindowSize } from 'react-use';
import useAuthRoute from '@hooks/useAuthRoute';

// components
import { Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import LoadingScreen from '@components/LoadingScreen';
import Sidebar from '@layout/Sidebar';
import BottomNav from '@layout/BottomNav';
import Navbar from '@layout/Navbar';
import ShoppingCart from '@widgets/ShoppingCart';
import ScrollToTop from '@components/ScrollToTop';

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
    const muiTheme = useMemo(() => 
        createTheme({ direction }), 
        [direction]
    );

    // Emotion cache memoizálása
    const emotionCache = useMemo(() => 
        createCache({
            key: direction === 'rtl' ? 'muirtl' : 'muiltr',
            stylisPlugins: plugins,
        }), 
        [direction, plugins]
    );

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
                                                <Route path="/" element={<ClubSummary />} />
                                                <Route path="/game-summary" element={<GameSummary />} />
                                                <Route path="/championships" element={<Championships />} />
                                                <Route path="/league-overview" element={<LeagueOverview />} />
                                                <Route path="/fans-community" element={<FansCommunity />} />
                                                <Route path="/statistics" element={<Statistics />} />
                                                <Route path="/match-summary" element={<MatchSummary />} />
                                                <Route path="/match-overview" element={<MatchOverview />} />
                                                <Route path="/player-profile" element={<PlayerProfile />} />
                                                <Route path="/schedule" element={<Schedule />} />
                                                <Route path="/tickets" element={<Tickets />} />
                                                <Route path="/football-store" element={<FootballStore />} />
                                                <Route path="/brand-store" element={<BrandStore />} />
                                                <Route path="/product" element={<Product />} />
                                                <Route path="/login" element={<Login />} />
                                                <Route path="/sign-up" element={<SignUp />} />
                                                <Route path="/settings" element={<Settings />} />
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
    );
};

export default App;
