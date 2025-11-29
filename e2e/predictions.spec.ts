import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

const validUser = {
  id: "user-123",
  email: "user@example.com",
};

const respondJson = (route: Route, body: unknown, status = 200) =>
  route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });

const setupAuthRoutes = async (page: Page) => {
  await page.route("**/auth/v1/session", async (route) => {
    await respondJson(route, {
      access_token: null,
      token_type: "bearer",
      expires_in: null,
      refresh_token: null,
      user: null,
    });
  });

  await page.route("**/auth/v1/token?grant_type=password", async (route) => {
    const payload = JSON.parse(route.request().postData() ?? "{}");
    if (payload.email === validUser.email && payload.password === "Password123!") {
      await respondJson(route, {
        access_token: "access-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "refresh-token",
        user: {
          id: validUser.id,
          email: validUser.email,
          aud: "authenticated",
          role: "authenticated",
        },
      });
      return;
    }

    await respondJson(
      route,
      { error: { message: "Invalid login credentials" } },
      400,
    );
  });

  await page.route("**/rest/v1/user_profiles*", async (route) => {
    await respondJson(route, {
      id: validUser.id,
      email: validUser.email,
      full_name: "Test User",
      role: "user",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });
};

test("user views predictions and submits feedback", async ({ page }) => {
  await setupAuthRoutes(page);

  await page.route("**/rest/v1/predictions*", async (route) => {
    const url = route.request().url();

    if (url.includes("match_id")) {
      await respondJson(route, {
        id: "prediction-99",
        match_id: "match-123",
        predicted_outcome: "home_win",
        confidence_score: 68,
      });
      return;
    }

    await respondJson(route, [
      {
        id: "prediction-1",
        predicted_outcome: "home_win",
        confidence_score: 72,
        actual_outcome: null,
        was_correct: null,
        match: {
          match_date: new Date().toISOString(),
          home_team: { name: "WinMix City" },
          away_team: { name: "Tipster United" },
          league: { name: "Premier League" },
        },
      },
    ]);
  });

  await page.route("**/rest/v1/pattern_accuracy*", async (route) => {
    await respondJson(route, [
      {
        total_predictions: 8,
        correct_predictions: 6,
        accuracy_rate: 75,
        template: { name: "home_winning_streak" },
      },
    ]);
  });

  await page.route("**/rest/v1/matches*", async (route) => {
    await respondJson(route, {
      id: "match-123",
      match_date: new Date().toISOString(),
      status: "finished",
      home_score: 3,
      away_score: 1,
      home_team: { id: "team-1", name: "WinMix City" },
      away_team: { id: "team-2", name: "Tipster United" },
      league: { name: "Premier League" },
    });
  });

  const feedbackPayloads: unknown[] = [];
  await page.route("**/functions/v1/submit-feedback", async (route) => {
    const payload = JSON.parse(route.request().postData() ?? "{}");
    feedbackPayloads.push(payload);
    await respondJson(route, {});
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill(validUser.email);
  await page.getByLabel("Password").fill("Password123!");

  await Promise.all([
    page.waitForURL(/dashboard/),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);

  await page.goto("/predictions");
  await expect(page.getByRole("heading", { name: "Predikciók áttekintése" })).toBeVisible();
  await expect(page.getByText("WinMix City"))
    .toBeVisible();

  await page.goto("/match/match-123");
  await expect(page.getByRole("heading", { name: "Premier League" })).toBeVisible();
  await expect(page.getByText("Mérkőzés eredmény rögzítése")).toBeVisible();

  await page.getByRole("button", { name: "Eredmény mentése" }).click();

  await expect(page.getByText("Eredmény sikeresen rögzítve"))
    .toBeVisible();
  expect(feedbackPayloads).toHaveLength(1);
  expect(feedbackPayloads[0]).toMatchObject({ matchId: "match-123" });
});
