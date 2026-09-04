import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("player can enter locally, navigate the league phase, and see standings", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: /optic_oracle/i }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: /optic_oracle/i })).toBeVisible();
  await expect(page.getByText("UCL r/fotbal", { exact: true }).first()).toBeVisible();
  const subredditLink = page.getByRole("link", { name: "Deschide r/fotbal pe Reddit" });
  await expect(subredditLink).toHaveAttribute("href", "https://www.reddit.com/r/fotbal/");
  await expect(subredditLink.locator("svg")).toBeVisible();
  if ((page.viewportSize()?.width ?? 0) <= 760) {
    await expect(subredditLink.locator("span")).toBeHidden();
  } else {
    await expect(subredditLink.locator("span")).toBeVisible();
    await expect.poll(() => page.locator(".topbar-inner").evaluate((toolbar) => toolbar.getBoundingClientRect().height)).toBeLessThanOrEqual(62);
    await expect.poll(() => page.locator(".bottom-nav a").first().evaluate((link) => Number.parseFloat(getComputedStyle(link).fontSize))).toBeGreaterThanOrEqual(15);
    await expect.poll(() => page.locator(".topbar .brand-title").evaluate((title) => Number.parseFloat(getComputedStyle(title).fontSize))).toBeGreaterThanOrEqual(18);
    await expect.poll(() => page.locator(".topbar .brand-title").evaluate((title) => Number.parseInt(getComputedStyle(title).fontWeight, 10))).toBeGreaterThanOrEqual(680);
  }
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await expect.poll(() => page.evaluate(() => Number.parseFloat(getComputedStyle(document.body).fontSize))).toBeGreaterThanOrEqual(17);
  await expect(page.locator(".player-page .eyebrow")).toHaveCount(0);
  await expect(page.getByText(/Calificări \/ trofeu/i)).toHaveCount(0);
  await expect(page.locator('link[rel="icon"][href="/icon.png"]')).toHaveCount(1);
  const persistentHighlight = await page.locator(".nav-highlight").elementHandle();
  const predictionsVersion = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/live-version" && url.searchParams.get("scope") === "/app";
  });
  await page.getByRole("link", { name: "Predicții" }).click();
  await expect(page.getByRole("heading", { name: "Predicții" })).toBeVisible();
  await predictionsVersion;
  await expect(page.locator(".nav-highlight")).toHaveCount(1);
  await expect.poll(() => page.locator(".player-page").evaluate((pageRoot) => getComputedStyle(pageRoot).animationName)).toBe("none");
  await expect.poll(() => page.locator(".topbar-inner").evaluate((toolbar) => getComputedStyle(toolbar).backdropFilter)).toBe("none");
  await expect.poll(() => page.locator(".team-crest img").first().evaluate((crest) => getComputedStyle(crest).filter)).toBe("none");
  await expect.poll(() => page.locator(".match-card").first().evaluate((card) => getComputedStyle(card).contentVisibility)).toBe("visible");
  const initialScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await page.waitForTimeout(100);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBe(initialScrollHeight);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await expect.poll(() => persistentHighlight?.evaluate((node) => node === document.querySelector(".nav-highlight"))).toBe(true);
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.playerNavigating ?? "")).toBe("");
  await expect(page.getByLabel("Progresul predicțiilor")).toBeVisible();
  await expect(page.locator(".match-card .prediction-state").first()).toBeVisible();
  const saveAll = page.getByRole("button", { name: "Salvează toate predicțiile" });
  await expect(saveAll).toHaveCount(0);
  for (const index of [0, 1]) {
    const form = page.locator(".prediction-form").nth(index);
    const newSelection = await form.locator('input[name="selection"]').evaluateAll((inputs) =>
      (inputs as HTMLInputElement[]).find((input) => !input.checked)?.value,
    );
    await form.locator(`input[name="selection"][value="${newSelection}"]`).check();
  }
  await expect(saveAll).toBeVisible();
  await saveAll.click();
  await expect(saveAll).toHaveCount(0);
  await page.getByRole("link", { name: "Clasament UCL" }).click();
  await expect(page.getByRole("heading", { name: "Clasament UCL" })).toBeVisible();
  await expect(page.locator(".league-table tbody tr")).toHaveCount(36);
  await page.getByRole("link", { name: "Jucători" }).click();
  await expect(page.getByRole("heading", { name: "Clasament jucători" })).toBeVisible();
  await expect(page.getByText(/calificări\/câștigătoare/i)).toHaveCount(0);
});

test("unchanged live data does not refresh or rebuild the toolbar", async ({ page }) => {
  const firstVersion = page.waitForResponse((response) => new URL(response.url()).pathname === "/api/live-version");
  await page.goto("/test-login");
  await page.getByRole("button", { name: /optic_oracle/i }).click();
  await firstVersion;

  let dynamicRscRequests = 0;
  page.on("request", (request) => {
    const headers = request.headers();
    if (headers.rsc === "1" && headers["next-router-prefetch"] !== "1") dynamicRscRequests += 1;
  });
  const toolbar = await page.locator(".topbar-inner").elementHandle();
  await page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/live-version",
    { timeout: 20_000 },
  );

  expect(dynamicRscRequests).toBe(0);
  await expect.poll(() => toolbar?.evaluate((node) => node === document.querySelector(".topbar-inner"))).toBe(true);
});

test("the Reddit admin can inspect ESPN diagnostics", async ({ page }) => {
  await page.goto("/test-login");
  await page.getByRole("button", { name: /satibagipula/i }).click();
  await expect(page).toHaveURL(/\/admin\/diagnostics/);
  await expect(page.getByRole("heading", { name: "ESPN Debug" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sync scoruri" })).toBeVisible();
});
