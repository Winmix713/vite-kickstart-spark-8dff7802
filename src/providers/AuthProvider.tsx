import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthContext, UserProfile, UserRole, AuthContextType } from './AuthContext';

export { AuthContext };
export type { UserRole, UserProfile, AuthContextType };

// Constants
const AUTH_INIT_DELAY = 50;
const isDevelopment = process.env.NODE_ENV === 'development';

// Types
interface AuthProviderProps {
  children: React.ReactNode;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  supabaseAvailable: boolean;
}

// Error messages
const ERROR_MESSAGES = {
  SUPABASE_UNAVAILABLE: 'Authentication service is currently unavailable. Please check your configuration.',
  SIGN_IN_FAILED: 'Sign in failed',
  SIGN_UP_FAILED: 'Sign up failed',
  SIGN_OUT_FAILED: 'Sign out failed',
  PROFILE_FETCH_FAILED: 'Failed to fetch user profile',
} as const;

// Success messages
const SUCCESS_MESSAGES = {
  SIGN_IN: 'Welcome back!',
  SIGN_IN_DESC: 'You have successfully signed in.',
  SIGN_UP: 'Account created!',
  SIGN_UP_DESC: 'Please check your email to verify your account.',
  SIGN_OUT: 'Signed out',
  SIGN_OUT_DESC: 'You have been signed out successfully.',
} as const;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State management
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
    supabaseAvailable: false,
  });

  // Refs for cleanup and preventing memory leaks
  const mountedRef = useRef(true);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);
  // ELTÁVOLÍTVA: const isInitializedRef = useRef(false); - Ez okozta a blokkolást
  const profileFetchRef = useRef<Map<string, Promise<void>>>(new Map());

  const { toast } = useToast();

  const safeSetState = useCallback((updates: Partial<AuthState>) => {
    if (mountedRef.current) {
      setAuthState((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  const logAuthEvent = useCallback((event: string, details?: unknown) => {
    if (isDevelopment) {
      console.log(`[Auth] ${event}`, details || '');
    }
  }, []);

  const fetchProfile = useCallback(
    async (userId: string): Promise<void> => {
      if (!isSupabaseConfigured()) return;

      const existingFetch = profileFetchRef.current.get(userId);
      if (existingFetch) {
        return existingFetch;
      }

      const fetchPromise = (async () => {
        try {
          // logAuthEvent('Fetching profile', { userId }); // Opcionális: Zaj csökkentése

          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) throw error;

          if (mountedRef.current) {
            safeSetState({ profile: data as UserProfile });
            // logAuthEvent('Profile fetched successfully', data);
          }
        } catch (error) {
          console.error(ERROR_MESSAGES.PROFILE_FETCH_FAILED, error);
          if (mountedRef.current) {
            safeSetState({ profile: null });
          }
        } finally {
          profileFetchRef.current.delete(userId);
        }
      })();

      profileFetchRef.current.set(userId, fetchPromise);
      return fetchPromise;
    },
    [logAuthEvent, safeSetState]
  );

  const refreshProfile = useCallback(async (): Promise<void> => {
    const userId = authState.user?.id;
    if (userId) {
      await fetchProfile(userId);
    }
  }, [authState.user?.id, fetchProfile]);

  const handleAuthStateChange = useCallback(
    async (event: AuthChangeEvent, session: Session | null): Promise<void> => {
      if (!mountedRef.current) return;

      if (event === 'INITIAL_SESSION') {
        logAuthEvent(session ? 'Session restored' : 'No active session');
      } else {
        logAuthEvent(`Auth event: ${event}`);
      }

      safeSetState({
        session,
        user: session?.user ?? null,
        loading: false,
      });

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        safeSetState({ profile: null });
      }
    },
    [fetchProfile, logAuthEvent, safeSetState]
  );

  useEffect(() => {
    // 1. Reset mounted ref on effect run
    mountedRef.current = true;

    // 2. Initialize Logic
    const initializeAuth = async () => {
      const isConfigured = isSupabaseConfigured();

      if (!isConfigured) {
        logAuthEvent('⚠️ Supabase not configured - running in demo mode');
        safeSetState({
          supabaseAvailable: false,
          loading: false,
        });
        return;
      }

      safeSetState({ supabaseAvailable: true });

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Supabase auth error:', error);
          safeSetState({
            supabaseAvailable: false,
            loading: false,
          });
          return;
        }

        if (mountedRef.current) {
          safeSetState({
            session,
            user: session?.user ?? null,
          });

          if (session?.user) {
            await fetchProfile(session.user.id);
          }
          
          // Fontos: Itt állítjuk le a loading-ot, ha sikeres a session lekérés
          safeSetState({ loading: false });
        }

        const { data } = supabase.auth.onAuthStateChange(handleAuthStateChange);
        subscriptionRef.current = data.subscription;
        logAuthEvent('Auth listener initialized');

      } catch (error) {
        console.error('Failed to initialize auth:', error);
        safeSetState({
          supabaseAvailable: false,
          loading: false,
        });
      }
    };

    // Delay initialization slightly to ensure environment is ready
    initTimeoutRef.current = setTimeout(initializeAuth, AUTH_INIT_DELAY);

    // 3. Cleanup Function
    return () => {
      mountedRef.current = false; // Megakadályozza a state update-eket unmount után
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      profileFetchRef.current.clear();
      logAuthEvent('Auth provider unmounted');
    };
  }, []); // Empty dependency array

  const signIn = useCallback(
    async (email: string, password: string): Promise<void> => {
      if (!authState.supabaseAvailable) {
        toast({
          title: 'Authentication unavailable',
          description: ERROR_MESSAGES.SUPABASE_UNAVAILABLE,
          variant: 'destructive',
        });
        throw new Error('Supabase not available');
      }

      try {
        logAuthEvent('Sign in attempt', { email });

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await fetchProfile(data.user.id);
          toast({
            title: SUCCESS_MESSAGES.SIGN_IN,
            description: SUCCESS_MESSAGES.SIGN_IN_DESC,
          });
          logAuthEvent('Sign in successful');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign in';
        logAuthEvent('Sign in failed', { error: errorMessage });
        toast({
          title: ERROR_MESSAGES.SIGN_IN_FAILED,
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [authState.supabaseAvailable, fetchProfile, toast, logAuthEvent]
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string): Promise<void> => {
      if (!authState.supabaseAvailable) {
        toast({
          title: 'Authentication unavailable',
          description: ERROR_MESSAGES.SUPABASE_UNAVAILABLE,
          variant: 'destructive',
        });
        throw new Error('Supabase not available');
      }

      try {
        logAuthEvent('Sign up attempt', { email });

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          toast({
            title: SUCCESS_MESSAGES.SIGN_UP,
            description: SUCCESS_MESSAGES.SIGN_UP_DESC,
          });
          logAuthEvent('Sign up successful');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign up';
        logAuthEvent('Sign up failed', { error: errorMessage });
        toast({
          title: ERROR_MESSAGES.SIGN_UP_FAILED,
          description: errorMessage,
          variant: 'destructive',
        });
        throw error;
      }
    },
    [authState.supabaseAvailable, toast, logAuthEvent]
  );

  const signOut = useCallback(async (): Promise<void> => {
    if (!authState.supabaseAvailable) {
      toast({
        title: 'Authentication unavailable',
        description: ERROR_MESSAGES.SUPABASE_UNAVAILABLE,
        variant: 'destructive',
      });
      throw new Error('Supabase not available');
    }

    try {
      logAuthEvent('Sign out attempt');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      safeSetState({
        user: null,
        session: null,
        profile: null,
      });

      toast({
        title: SUCCESS_MESSAGES.SIGN_OUT,
        description: SUCCESS_MESSAGES.SIGN_OUT_DESC,
      });
      logAuthEvent('Sign out successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign out';
      logAuthEvent('Sign out failed', { error: errorMessage });
      toast({
        title: ERROR_MESSAGES.SIGN_OUT_FAILED,
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [authState.supabaseAvailable, toast, logAuthEvent, safeSetState]);

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return authState.profile?.role === role;
    },
    [authState.profile?.role]
  );

  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      return authState.profile ? roles.includes(authState.profile.role) : false;
    },
    [authState.profile?.role]
  );

  const isAdmin = useCallback((): boolean => {
    return authState.profile?.role === 'admin';
  }, [authState.profile?.role]);

  const isAnalyst = useCallback((): boolean => {
    return authState.profile?.role === 'analyst';
  }, [authState.profile?.role]);

  const value: AuthContextType = useMemo(
    () => ({
      user: authState.user,
      session: authState.session,
      profile: authState.profile,
      loading: authState.loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      hasRole,
      hasAnyRole,
      isAdmin,
      isAnalyst,
    }),
    [
      authState.user,
      authState.session,
      authState.profile,
      authState.loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      hasRole,
      hasAnyRole,
      isAdmin,
      isAnalyst,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};