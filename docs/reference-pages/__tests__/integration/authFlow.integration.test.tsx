import { renderHook, act, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/providers/AuthProvider";

const toastFn = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastFn,
  }),
}));

const API_BASE = "https://api.test";

type AuthListener = (event: string, session: unknown) => void;
const authStateListeners = new Set<AuthListener>();
let currentSession: Record<string, unknown> | null = null;

const jsonRequest = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  return response.json() as Promise<{
    data?: unknown;
    error?: { message?: string } | null;
  }>;
};

const normalizeResponse = <T,>(payload: { data?: T; error?: { message?: string } | null }) => ({
  data: payload.data ?? null,
  error: payload.error?.message ? new Error(payload.error.message) : null,
});

const notifyAuthListeners = (event: string, session: unknown) => {
  for (const listener of authStateListeners) {
    listener(event, session);
  }
};

const getUserProfilesChain = () => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(async () => {
        const response = await jsonRequest(`${API_BASE}/user_profiles`);
        return {
          data: response.data as Record<string, unknown>,
          error: response.error?.message ? new Error(response.error.message) : null,
        };
      }),
    })),
  })),
});

const supabaseMock = {
  auth: {
    getSession: vi.fn(async () => ({
      data: { session: currentSession },
      error: null,
    })),
    signInWithPassword: vi.fn(async (credentials: Record<string, unknown>) => {
      const response = await jsonRequest(`${API_BASE}/auth/sign-in`, {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      const result = normalizeResponse(response);
      if (!result.error && result.data && (result.data as { user?: unknown }).user) {
        currentSession = (result.data as { session?: Record<string, unknown> | null }).session ?? null;
        notifyAuthListeners("SIGNED_IN", currentSession);
      }

      return result;
    }),
    signUp: vi.fn(async (credentials: Record<string, unknown>) => {
      const response = await jsonRequest(`${API_BASE}/auth/sign-up`, {
        method: "POST",
        body: JSON.stringify(credentials),
      });

      return normalizeResponse(response);
    }),
    signOut: vi.fn(async () => {
      await jsonRequest(`${API_BASE}/auth/sign-out`, {
        method: "POST",
        body: JSON.stringify({}),
      });

      currentSession = null;
      notifyAuthListeners("SIGNED_OUT", null);

      return { error: null };
    }),
    onAuthStateChange: vi.fn((callback: AuthListener) => {
      authStateListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => authStateListeners.delete(callback),
          },
        },
      };
    }),
  },
  from: vi.fn((table: string) => {
    if (table === "user_profiles") {
      return getUserProfilesChain();
    }
    return {};
  }),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock,
}));

const createWrapper = () =>
  ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

describe("AuthProvider integration", () => {
  beforeEach(() => {
    toastFn.mockClear();
    currentSession = null;
    authStateListeners.clear();
  });

  it("signs up, signs in, and signs out successfully", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signUp("user@example.com", "Password123!", "Test User");
    });

    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Account created!",
      }),
    );

    toastFn.mockClear();

    await act(async () => {
      await result.current.signIn("user@example.com", "Password123!");
    });

    await waitFor(() => expect(result.current.user?.email).toBe("user@example.com"));
    expect(result.current.profile?.full_name).toBe("Test User");
    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Welcome back!",
      }),
    );

    toastFn.mockClear();

    await act(async () => {
      await result.current.signOut();
    });

    await waitFor(() => expect(result.current.user).toBeNull());
    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Signed out",
      }),
    );
  });

  it("surfaces sign in errors", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.signIn("wrong@example.com", "invalid"))
      .rejects.toThrow("Invalid credentials");

    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Sign in failed",
        variant: "destructive",
      }),
    );
  });
});
