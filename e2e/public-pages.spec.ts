import { test, expect } from "@playwright/test";

test.describe("Public pages", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Cloud Drive|Files/);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/Login|Sign in/i);
  });

  test("forgot password page loads", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page).toHaveTitle(/Forgot|Reset/i);
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page).toHaveTitle(/Privacy/i);
  });

  test("health endpoint returns ok", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
  });
});
