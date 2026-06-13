// Plays one real move (human → AI responds) on an existing in-progress game, using injected
// Clerk session cookies. Verifies the full game cycle, not just access.
// Run: bun run e2e/golden-move.mjs
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";

const BASE = process.env.URL ?? "http://localhost:3000";
const DIR = "e2e/_artifacts";
mkdirSync(DIR, { recursive: true });
const log = (...a) => console.log("[move]", ...a);
const shot = async (p, n) => { try { await p.screenshot({ path: `${DIR}/${n}.png` }); log("shot", n); } catch (e) { log("shot-fail", n, e.message); } };

const cookies = JSON.parse(readFileSync("/tmp/clerk-cookies.json", "utf8")).map((c) => ({ ...c, sameSite: "Lax" }));
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ locale: "es-ES" });
await ctx.addCookies(cookies);
const page = await ctx.newPage();

const moveCalls = [];
ctx.on("response", async (r) => {
  if (r.url().includes("/moves")) moveCalls.push(`← ${r.status()} POST /moves`);
});

try {
  await page.goto(`${BASE}/play`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2500);
  const cont = page.getByRole("link", { name: /continuar/i }).first();
  if (await cont.isVisible().catch(() => false)) { log("Continuar existing game"); await cont.click(); }
  else { log("create Fácil"); await page.getByText("Fácil", { exact: false }).first().click(); }

  await page.waitForSelector('[data-testid="checkers-board"]', { timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, "m01-board");

  // Movable origins are squares with class "clickable".
  const origins = await page.$$eval('.sq.clickable', (els) => els.map((e) => e.getAttribute("data-testid")));
  log("movable origins:", JSON.stringify(origins));
  if (origins.length === 0) throw new Error("no movable origins (not human turn or no legal moves)");

  await page.locator(`[data-testid="${origins[0]}"]`).click();
  await page.waitForTimeout(800);
  await shot(page, "m02-selected");

  // After selecting, destinations become clickable too. Exclude ALL origins (other movable
  // pieces stay clickable); a true destination is a newly-clickable square or one with a hint-dot.
  const dests = await page.$$eval('.sq.clickable', (els) => els.map((e) => e.getAttribute("data-testid")));
  const hintDests = await page.$$eval('.sq:has(.hint-dot)', (els) => els.map((e) => e.getAttribute("data-testid"))).catch(() => []);
  const dest = hintDests[0] ?? dests.find((d) => !origins.includes(d));
  log("destination:", dest);
  if (!dest) throw new Error("no destination highlighted after selecting origin");

  await page.locator(`[data-testid="${dest}"]`).click();
  log("move submitted:", origins[0], "→", dest);

  // Wait for the AI to respond: humanMoveCount should reach 1 and a move appears in history.
  await page.waitForTimeout(6000);
  await shot(page, "m03-after-move");

  const state = await page.evaluate(() => {
    const movesText = Array.from(document.querySelectorAll(".mono")).map((e) => e.textContent).join(" | ");
    const counter = document.querySelector(".mono")?.textContent ?? "?";
    const hist = document.body.innerText.includes("Sin movimientos aún") ? "empty" : "has-moves";
    return { counter, hist, movesText: movesText.slice(0, 200) };
  });
  log("RESULT", JSON.stringify({ moveCalls, ...state }));
} catch (e) { log("ERROR", e.message); await shot(page, "m99-error"); }
finally { await browser.close(); }
