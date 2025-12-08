import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../mocks/server";
import type { UserPredictionForm } from "@/types/phase9";
import { CollaborativeIntelligenceService } from "@/lib/phase9-api";

const API_BASE = "https://api.test";

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

const supabaseMock = {
  from: (table: string) => {
    if (table === "user_predictions") {
      return {
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: async () => {
              const response = await jsonRequest(`${API_BASE}/rest/v1/user_predictions`, {
                method: "POST",
                body: JSON.stringify(payload),
              });

              return {
                data: response.data ?? null,
                error: response.error?.message ? new Error(response.error.message) : null,
              };
            },
          }),
        }),
      };
    }

    if (table === "crowd_wisdom") {
      return {
        select: () => ({
          eq: () => ({
            single: async () => {
              const response = await jsonRequest(`${API_BASE}/rest/v1/crowd_wisdom`);
              const first = Array.isArray(response.data) ? response.data[0] : null;
              return {
                data: first,
                error: response.error?.message ? new Error(response.error.message) : null,
              };
            },
          }),
        }),
      };
    }

    return {
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          order: async () => ({ data: [], error: null }),
        }),
      }),
    };
  },
  rpc: vi.fn(async (fn: string, args?: Record<string, unknown>) => {
    await jsonRequest(`${API_BASE}/rest/v1/rpc/${fn}`, {
      method: "POST",
      body: JSON.stringify(args ?? {}),
    });
    return { data: null, error: null };
  }),
};

const createClientMock = vi.fn(() => supabaseMock);

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

describe("Collaborative intelligence integration", () => {
  it("submits user predictions and triggers aggregation", async () => {
    const payload: UserPredictionForm = {
      match_id: "match-456",
      predicted_outcome: "home_win",
      confidence_score: 68,
      predicted_home_score: 2,
      predicted_away_score: 1,
      reasoning: "Better form",
    };

    const response = await CollaborativeIntelligenceService.submitUserPrediction(
      payload,
      "user-456",
    );

    expect(response.success).toBe(true);
    expect(response.prediction).toMatchObject({
      match_id: "match-456",
      user_id: "user-456",
      predicted_outcome: "home_win",
    });
    expect(supabaseMock.rpc).toHaveBeenCalledWith("update_crowd_wisdom", {
      p_match_id: "match-456",
    });

    const crowdResult = await CollaborativeIntelligenceService.getCrowdWisdom("match-456");
    expect(crowdResult.success).toBe(true);
    expect(crowdResult.crowdWisdom?.match_id).toBe("match-456");
  });

  it("returns an error when the insert fails", async () => {
    server.use(
      http.post(`${API_BASE}/rest/v1/user_predictions`, async () =>
        HttpResponse.json(
          {
            data: null,
            error: { message: "constraint violation" },
          },
          { status: 400 },
        ),
      ),
    );

    const payload: UserPredictionForm = {
      match_id: "match-error",
      predicted_outcome: "draw",
      confidence_score: 55,
    };

    const response = await CollaborativeIntelligenceService.submitUserPrediction(
      payload,
      "user-789",
    );

    expect(response.success).toBe(false);
    expect(response.error).toContain("constraint violation");
  });
});
