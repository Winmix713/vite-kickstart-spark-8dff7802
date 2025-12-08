import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AuthContext, AuthContextType } from "@/providers/AuthProvider";
import { useAuth } from "@/hooks/useAuth";

const createWrapper = (value: AuthContextType) =>
  ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );

describe("useAuth", () => {
  it("returns context values when used within provider", () => {
    const value: AuthContextType = {
      user: null,
      session: null,
      profile: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    };

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(value),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.signIn).toBe(value.signIn);
  });

  it("throws an error when used outside of AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrowError(
      /useAuth must be used within an AuthProvider/,
    );
  });
});
