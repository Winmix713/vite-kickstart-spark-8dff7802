import { expect, test } from "@playwright/test";
import type { Route } from "@playwright/test";

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

test.beforeEach(async ({ page }) => {
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
      {
        error: {
          message: "Invalid login credentials",
        },
      },
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

  await page.route("**/rest/v1/predictions*", async (route) => {
    const url = route.request().url();

    if (url.includes("select=was_correct")) {
      await respondJson(route, [{ was_correct: true }, { was_correct: false }]);
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
        total_predictions: 12,
        correct_predictions: 9,
        accuracy_rate: 75,
        template: { name: "home_winning_streak" },
      },
    ]);
  });
});

test("user can log in and reach the dashboard", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(validUser.email);
  await page.getByLabel("Password").fill("Password123!");

  await Promise.all([
    page.waitForURL(/dashboard/),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);

  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("WinMix City"))
    .toBeVisible();
});
