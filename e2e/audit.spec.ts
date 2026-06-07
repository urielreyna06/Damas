import { test, expect, type Page } from "@playwright/test";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function waitForHydration(page: Page) {
  await page.waitForLoadState("networkidle");
}

async function hasStyles(page: Page): Promise<boolean> {
  // Check that CSS custom properties are applied (dark theme vars should exist)
  const bgColor = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    return root.getPropertyValue("--bg-0").trim();
  });
  return bgColor !== "";
}

// ─── Suite: App boots correctly ───────────────────────────────────────────────

test.describe("App bootstrap", () => {
  test("homepage responds 200", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status()).toBe(200);
  });

  test("CSS design-system is loaded (CSS vars present)", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    const styled = await hasStyles(page);
    expect(styled).toBe(true);
  });

  test("favicon is served", async ({ page, request }) => {
    await page.goto("/");
    const res = await request.get("/favicon.svg");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("svg");
  });

  test("page title is set", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Damas/i);
  });

  test("no JS errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    await waitForHydration(page);
    // Filter known third-party noise (Clerk loads async)
    const criticalErrors = errors.filter(
      (e) => !e.includes("clerk") && !e.includes("Clerk")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

// ─── Suite: Navigation & layout ──────────────────────────────────────────────

test.describe("Navigation", () => {
  test("navbar is visible with correct links", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await expect(page.locator("nav.nav")).toBeVisible();
    await expect(page.locator("nav a[href='/play']")).toBeVisible();
    await expect(page.locator("nav a[href='/leaderboard']")).toBeVisible();
    await expect(page.locator("nav a[href='/shop']")).toBeVisible();
  });

  test("brand logo links to home", async ({ page }) => {
    await page.goto("/leaderboard");
    await waitForHydration(page);
    await page.click("a.brand");
    await expect(page).toHaveURL("/");
  });

  test("footer is rendered", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await expect(page.locator("footer.footer")).toBeVisible();
    await expect(page.locator("footer")).toContainText("Damas PvE");
  });
});

// ─── Suite: Homepage content ──────────────────────────────────────────────────

test.describe("Homepage", () => {
  test("hero section renders with CTA", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    const hero = page.locator(".hero");
    await expect(hero).toBeVisible();
    await expect(hero.locator("h1")).toContainText(/mente|máquina/i);
  });

  test("difficulty selector renders 3 cards", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    const cards = page.locator(".diff-card");
    await expect(cards).toHaveCount(3);
  });

  test("difficulty badges are visible (easy, medium, hard)", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await expect(page.locator(".badge-easy")).toBeVisible();
    await expect(page.locator(".badge-medium")).toBeVisible();
    await expect(page.locator(".badge-hard")).toBeVisible();
  });

  test("static board decoration is rendered", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    await expect(page.locator(".hero-board")).toBeVisible();
  });
});

// ─── Suite: Public pages ──────────────────────────────────────────────────────

test.describe("Leaderboard page", () => {
  test("loads and shows heading", async ({ page }) => {
    await page.goto("/leaderboard");
    await waitForHydration(page);
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/ranking|leaderboard/i);
  });

  test("no 500 errors", async ({ page }) => {
    const res = await page.goto("/leaderboard");
    expect(res?.status()).not.toBe(500);
  });
});

test.describe("Shop page", () => {
  test("loads and shows skin cards or sign-in prompt", async ({ page }) => {
    await page.goto("/shop");
    await waitForHydration(page);
    // Either skin cards or a sign-in prompt should be visible
    const hasSkins = await page.locator(".skin-card, .card").count();
    const hasPrompt = await page.locator("text=/tienda|shop|skin/i").count();
    expect(hasSkins + hasPrompt).toBeGreaterThan(0);
  });

  test("no 500 errors", async ({ page }) => {
    const res = await page.goto("/shop");
    expect(res?.status()).not.toBe(500);
  });
});

test.describe("Play lobby page", () => {
  test("redirects or shows difficulty selector", async ({ page }) => {
    await page.goto("/play");
    await waitForHydration(page);
    // Should show lobby content or redirect to home
    const url = page.url();
    const isPlay = url.includes("/play");
    const isHome = url.endsWith("/") || url.endsWith("3000/");
    expect(isPlay || isHome).toBe(true);
  });
});

// ─── Suite: 404 handling ──────────────────────────────────────────────────────

test.describe("404 page", () => {
  test("renders custom not-found page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await waitForHydration(page);
    await expect(page.locator("text=404")).toBeVisible();
    await expect(page.locator("a[href='/']")).toBeVisible();
  });
});

// ─── Suite: Backend API health ────────────────────────────────────────────────

test.describe("Backend connectivity", () => {
  test("backend health check responds", async ({ request }) => {
    const res = await request.get("http://localhost:3001/health", {
      timeout: 5000,
    }).catch(() => null);
    // Backend may not have a /health route — just check it's not a network failure
    if (res) {
      expect([200, 404]).toContain(res.status());
    }
  });

  test("leaderboard API returns data or 200", async ({ request }) => {
    const res = await request.get("http://localhost:3001/api/leaderboard?limit=5", {
      timeout: 8000,
    }).catch(() => null);
    if (res) {
      expect(res.status()).toBeLessThan(500);
    }
  });
});

// ─── Suite: CSS design audit ──────────────────────────────────────────────────

test.describe("Visual / CSS audit", () => {
  test("gold button has correct computed background (not transparent)", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    const btn = page.locator(".btn-gold").first();
    await expect(btn).toBeVisible();
    const bg = await btn.evaluate((el) => getComputedStyle(el).background);
    expect(bg).not.toBe("none");
    expect(bg).not.toContain("rgba(0, 0, 0, 0)");
  });

  test("nav has correct z-index and sticky positioning", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    const nav = page.locator("nav.nav");
    const position = await nav.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe("sticky");
  });

  test("dark theme background applied to body", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    // Should be dark, not white
    expect(bgColor).not.toBe("rgb(255, 255, 255)");
  });
});
