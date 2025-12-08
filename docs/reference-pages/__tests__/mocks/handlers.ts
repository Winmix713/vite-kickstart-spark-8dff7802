import { http, HttpResponse } from "msw";

const API_BASE = "https://api.test";

const defaultUser = {
  id: "user-123",
  email: "user@example.com",
  aud: "authenticated",
  role: "authenticated",
};

let crowdWisdomState = {
  id: "crowd-123",
  match_id: "match-123",
  total_predictions: 1,
  home_win_predictions: 1,
  draw_predictions: 0,
  away_win_predictions: 0,
  average_confidence: 72,
  consensus_prediction: "home_win" as const,
  consensus_confidence: 72,
  model_vs_crowd_divergence: 12,
  last_calculated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const handlers = [
  http.get(`${API_BASE}/auth/session`, () =>
    HttpResponse.json({
      data: { session: null },
      error: null,
    }),
  ),
  http.post(`${API_BASE}/auth/sign-in`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };

    if (body.email === "user@example.com" && body.password === "Password123!") {
      return HttpResponse.json({
        data: {
          user: defaultUser,
          session: {
            access_token: "access-token",
            refresh_token: "refresh-token",
            token_type: "bearer",
            user: defaultUser,
          },
        },
        error: null,
      });
    }

    return HttpResponse.json(
      {
        data: { user: null, session: null },
        error: { message: "Invalid credentials" },
      },
      { status: 400 },
    );
  }),
  http.post(`${API_BASE}/auth/sign-up`, async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          data: { user: null, session: null },
          error: { message: "Missing credentials" },
        },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      data: {
        user: {
          ...defaultUser,
          email: body.email,
        },
        session: null,
      },
      error: null,
    });
  }),
  http.post(`${API_BASE}/auth/sign-out`, async () =>
    HttpResponse.json({
      error: null,
    }),
  ),
  http.get(`${API_BASE}/user_profiles`, () =>
    HttpResponse.json({
      data: {
        id: defaultUser.id,
        email: defaultUser.email,
        full_name: "Test User",
        role: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      error: null,
    }),
  ),
  http.get(`${API_BASE}/phase9_settings`, () =>
    HttpResponse.json({
      data: {
        id: 1,
        collaborative_intelligence_enabled: true,
        temporal_decay_enabled: true,
        temporal_decay_rate: 0.35,
        freshness_check_seconds: 45,
        staleness_threshold_days: 6,
        market_integration_mode: "test",
        market_api_key: null,
        cross_league_enabled: true,
        cross_league_league_count: 4,
        cross_league_depth: "medium",
        updated_at: new Date().toISOString(),
      },
      error: null,
    }),
  ),
  http.post(`${API_BASE}/phase9_settings`, async ({ request }) => {
    const updates = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      data: {
        id: 1,
        collaborative_intelligence_enabled: Boolean(
          updates.collaborative_intelligence_enabled ?? true,
        ),
        temporal_decay_enabled: Boolean(updates.temporal_decay_enabled ?? true),
        temporal_decay_rate: Number(updates.temporal_decay_rate ?? 0.35),
        freshness_check_seconds: Number(updates.freshness_check_seconds ?? 45),
        staleness_threshold_days: Number(updates.staleness_threshold_days ?? 6),
        market_integration_mode: (updates.market_integration_mode as string) || "test",
        market_api_key: (updates.market_api_key as string) ?? null,
        cross_league_enabled: Boolean(updates.cross_league_enabled ?? true),
        cross_league_league_count: Number(updates.cross_league_league_count ?? 4),
        cross_league_depth: (updates.cross_league_depth as string) || "medium",
        updated_at: new Date().toISOString(),
      },
      error: null,
    });
  }),
  http.post(`${API_BASE}/rest/v1/user_predictions`, async ({ request }) => {
    const payload = (await request.json()) as Record<string, unknown>;

    const record = {
      id: "prediction-123",
      match_id: payload.match_id ?? "match-123",
      user_id: payload.user_id ?? defaultUser.id,
      predicted_outcome: payload.predicted_outcome ?? "home_win",
      confidence_score: payload.confidence_score ?? 72,
      predicted_home_score: payload.predicted_home_score ?? 2,
      predicted_away_score: payload.predicted_away_score ?? 1,
      btts_prediction: payload.btts_prediction ?? true,
      over_under_prediction: payload.over_under_prediction ?? "over_2.5",
      reasoning: payload.reasoning ?? "Confidence in home form",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return HttpResponse.json({
      data: record,
      error: null,
    });
  }),
  http.post(`${API_BASE}/rest/v1/rpc/update_crowd_wisdom`, async ({ request }) => {
    const body = (await request.json()) as { p_match_id?: string } | undefined;

    if (body?.p_match_id) {
      crowdWisdomState = {
        ...crowdWisdomState,
        match_id: body.p_match_id,
        updated_at: new Date().toISOString(),
      };
    }

    return HttpResponse.json({
      data: null,
      error: null,
    });
  }),
  http.get(`${API_BASE}/rest/v1/crowd_wisdom`, () =>
    HttpResponse.json({
      data: [crowdWisdomState],
      error: null,
    }),
  ),
];
