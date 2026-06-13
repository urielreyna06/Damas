// Verifies the game flow using injected Clerk session cookies (no login UI / CAPTCHA).
// Cookies live OUTSIDE the repo at /tmp/clerk-cookies.json (session secrets, never committed).
// Run: bun run e2e/golden-cookies.mjs
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.env.URL ?? "http://localhost:3000";
const DIR = "e2e/_artifacts";
mkdirSync(DIR, { recursive: true });
const log = (...a) => console.log("[cookies]", ...a);
const shot = async (p, n) => { try { await p.screenshot({ path: `${DIR}/${n}.png` }); log("shot", n); } catch (e) { log("shot-fail", n, e.message); } };

const cookies = JSON.parse(readFileSync("/tmp/clerk-cookies.json", "utf8"))
  .map((c) => ({ ...c, sameSite: "Lax" }));

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ locale: "es-ES" });
await ctx.addCookies(cookies);
log("injected", cookies.length, "cookies");

const page = await ctx.newPage();
const api = [];
ctx.on("request", (r) => { if (r.url().includes("/api/")) api.push(`→ ${r.method()} ${r.url().replace(BASE, "")}`); });
ctx.on("response", (r) => { if (r.url().includes("/api/")) api.push(`← ${r.status()} ${r.url().replace(BASE, "")}`); });
const cerr = [];
page.on("console", (m) => { if (m.type() === "error") cerr.push(m.text()); });
page.on("pageerror", (e) => cerr.push("PAGEERROR: " + e.message));

try {
  log("1. goto /play"); await page.goto(`${BASE}/play`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3500); await shot(page, "c01-play");

  const clerkState = await page.evaluate(() => ({
    hasClerk: typeof window.Clerk !== "undefined",
    user: window.Clerk?.user?.id ?? null,
    session: window.Clerk?.session?.status ?? null,
  }));
  log("clerk state:", JSON.stringify(clerkState));
  const signedOut = await page.getByText(/inicia sesión para jugar/i).first().isVisible().catch(() => false);
  log("signedOut screen:", signedOut);

  const cont = page.getByRole("link", { name: /continuar/i }).first();
  if (await cont.isVisible().catch(() => false)) { log("2. Continuar (existing game)"); await cont.click(); }
  else { log("2. crear Fácil"); await page.getByText("Fácil", { exact: false }).first().click({ timeout: 12000 }).catch((e) => log("create click fail:", e.message)); }

  await page.waitForTimeout(2500); await shot(page, "c02-after-click");
  log("url:", page.url());

  const board = await page.waitForSelector('[data-testid="board"], .board, table, .cell', { timeout: 18000 }).then(() => true).catch(() => false);
  const skeleton = await page.locator(".skeleton").first().isVisible().catch(() => false);
  const errBox = await page.getByText(/algo salió mal|reintentar/i).first().isVisible().catch(() => false);
  await page.waitForTimeout(1500); await shot(page, "c03-final");

  log("RESULT", JSON.stringify({ url: page.url(), board, skeleton, errBox }));
} catch (e) { log("ERROR", e.message); await shot(page, "c99-error"); }
finally {
  log("API CALLS:\n" + (api.join("\n") || "  (none)"));
  log("CONSOLE ERRORS:\n" + (cerr.slice(0, 12).join("\n") || "  (none)"));
  await browser.close();
}
