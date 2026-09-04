import { expect, test } from "@playwright/test";

test("player can enter locally, navigate the league phase, and see standings", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: /optic_oracle/i }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: /optic_oracle/i })).toBeVisible();
  await expect(page.locator(".player-page .eyebrow")).toHaveCount(0);
  await expect(page.getByText(/Calificări \/ trofeu/i)).toHaveCount(0);
  await expect(page.locator('link[rel="icon"][href="/icon.png"]')).toHaveCount(1);
  await page.getByRole("link", { name: "Predicții" }).click();
  await expect(page.getByRole("heading", { name: "Predicții" })).toBeVisible();
  await expect(page.locator(".nav-highlight")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.playerNavigating ?? "")).toBe("");
  await expect(page.getByLabel("Progresul predicțiilor")).toBeVisible();
  await expect(page.locator(".match-card .prediction-state").first()).toBeVisible();
  await page.getByRole("link", { name: "Clasament UCL" }).click();
  await expect(page.getByRole("heading", { name: "Clasament UCL" })).toBeVisible();
  await expect(page.locator(".league-table tbody tr")).toHaveCount(36);
  await page.getByRole("link", { name: "Jucători" }).click();
  await expect(page.getByRole("heading", { name: "Clasament jucători" })).toBeVisible();
  await expect(page.getByText(/calificări\/câștigătoare/i)).toHaveCount(0);
});

test("the Reddit admin can inspect ESPN diagnostics", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: /satibagipula/i }).click();
  await expect(page).toHaveURL(/\/admin\/diagnostics/);
  await expect(page.getByRole("heading", { name: "ESPN Debug" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sync scoruri" })).toBeVisible();
});
