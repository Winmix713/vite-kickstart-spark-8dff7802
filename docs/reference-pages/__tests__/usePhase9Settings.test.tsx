import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePhase9Settings } from "@/hooks/admin/usePhase9Settings";

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

const logMock = vi.fn();

vi.mock("@/hooks/admin/useAuditLog", () => ({
  useAuditLog: () => ({
    log: logMock,
  }),
}));

const maybeSingleMock = vi.fn();
const upsertSingleMock = vi.fn();

const supabaseMock = {
  from: vi.fn((table: string) => {
    if (table === "phase9_settings") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: maybeSingleMock,
            single: upsertSingleMock,
          })),
        })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: upsertSingleMock,
            })),
          })),
        })),
      };
    }

    return {};
  }),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock,
}));

const createWrapper = (client: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

describe("usePhase9Settings", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
    logMock.mockClear();
    maybeSingleMock.mockReset();
    upsertSingleMock.mockReset();

    maybeSingleMock.mockResolvedValue({
      data: {
        id: 1,
        collaborative_intelligence_enabled: 0,
        temporal_decay_enabled: 1,
        temporal_decay_rate: "0.42",
        freshness_check_seconds: "30",
        staleness_threshold_days: "5",
        market_integration_mode: "prod",
        market_api_key: null,
        cross_league_enabled: "true",
        cross_league_league_count: "8",
        cross_league_depth: "high",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
      error: null,
    });

    upsertSingleMock.mockResolvedValue({
      data: {
        id: 1,
        collaborative_intelligence_enabled: false,
        temporal_decay_enabled: true,
        temporal_decay_rate: 0.55,
        freshness_check_seconds: 50,
        staleness_threshold_days: 6,
        market_integration_mode: "test",
        market_api_key: null,
        cross_league_enabled: true,
        cross_league_league_count: 5,
        cross_league_depth: "medium",
        updated_at: "2024-01-02T00:00:00.000Z",
      },
      error: null,
    });
  });

  it("returns normalized settings from Supabase", async () => {
    const { result } = renderHook(() => usePhase9Settings(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.settings).not.toBeNull());

    const settings = result.current.settings;
    expect(settings?.collaborative_intelligence_enabled).toBe(false);
    expect(settings?.temporal_decay_enabled).toBe(true);
    expect(settings?.temporal_decay_rate).toBeCloseTo(0.42, 2);
    expect(settings?.cross_league_depth).toBe("high");
    expect(settings?.cross_league_league_count).toBe(8);
  });

  it("saves settings and logs the update", async () => {
    const { result } = renderHook(() => usePhase9Settings(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.settings).not.toBeNull());

    await act(async () => {
      await result.current.saveSettings({
        collaborative_intelligence_enabled: false,
        temporal_decay_rate: 0.55,
      });
    });

    await waitFor(() => expect(logMock).toHaveBeenCalled());

    expect(logMock).toHaveBeenCalledWith(
      "phase9_updated",
      expect.objectContaining({
        collaborative_intelligence_enabled: false,
        temporal_decay_rate: 0.55,
      }),
    );
    expect(toastSuccessMock).toHaveBeenCalledWith("Phase 9 settings saved");
    expect(toastErrorMock).not.toHaveBeenCalled();
  });
});
