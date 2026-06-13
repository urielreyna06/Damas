// Drives the golden path using Clerk DEV test-mode (no Google): a +clerk_test email
// accepts the fixed OTP 424242. Captures screenshots + console + /api/games calls so
// we can see exactly whether "Continuar partida" loads the board or hangs.
// Run: bun run e2e/golden-login.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.URL ?? "http://localhost:3000";
const EMAIL = process.env.GEMAIL ?? "damastest+clerk_test@example.com";
const PASS = process.env.GPASS ?? "Damas!Test#4242";
const OTP = "424242";
const DIR = "e2e/_artifacts";
mkdirSync(DIR, { recursive: true });

const log = (...a) => console.log("[golden]", ...a);
const shot = async (p, n) => { try { await p.screenshot({ path: `${DIR}/${n}.png` }); log("shot", n); } catch (e) { log("shot-fail", n, e.message); } };
const typeOtp = async (p) => {
  // Clerk OTP can be one input or 6 segments; typing into the focused field works for both.
  const seg = p.locator('input[autocomplete="one-time-code"], input[name^="codeInput"], input[inputmode="numeric"]').first();
  await seg.click({ timeout: 8000 }).catch(() => {});
  await p.keyboard.type(OTP, { delay: 60 });
};

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ locale: "es-ES" });
const page = await ctx.newPage();

const apiCalls = [];
ctx.on("request", (r) => { if (r.url().includes("/api/games")) apiCalls.push(`→ ${r.method()} ${r.url()}`); });
ctx.on("response", (r) => { if (r.url().includes("/api/games")) apiCalls.push(`← ${r.status()} ${r.url()}`); });
const cerr = [];
page.on("console", (m) => { if (m.type() === "error") cerr.push(m.text()); });
page.on("pageerror", (e) => cerr.push("PAGEERROR: " + e.message));

const fillIf = async (sel, val, name) => {
  const el = page.locator(sel).first();
  if (await el.isVisible().catch(() => false)) { await el.fill(val); log("filled", name); return true; }
  return false;
};
const clickContinue = async () => {
  // Target Clerk's primary submit button — NOT "Continue with Google" (which also matches /continue/i).
  const btn = page.locator(".cl-formButtonPrimary, button[data-localization-key='formButtonPrimary']").first();
  if (await btn.isVisible().catch(() => false)) { await btn.click({ timeout: 8000 }); return; }
  await page.keyboard.press("Enter");
};

try {
  log("1. goto /play"); await page.goto(`${BASE}/play`, { waitUntil: "networkidle", timeout: 30000 });
  log("2. Iniciar sesión"); await page.getByText("Iniciar sesión", { exact: false }).first().click({ timeout: 15000 });
  await page.waitForTimeout(2000); await shot(page, "02-modal");

  // Go to sign-up (test user likely doesn't exist yet).
  await page.getByText(/sign up|regístrate|registrarse/i).first().click({ timeout: 6000 }).catch(() => log("no signup link, staying on sign-in"));
  await page.waitForTimeout(1500); await shot(page, "03-form");

  await fillIf('input[type="email"], input[name="emailAddress"]', EMAIL, "email");
  await fillIf('input[type="password"], input[name="password"]', PASS, "password");
  await clickContinue(); await page.waitForTimeout(2500); await shot(page, "04-after-continue");

  const OTP_SEL = 'input[autocomplete="one-time-code"], input[name^="codeInput"], input[inputmode="numeric"], input[data-otp-input]';
  // After sign-up, Clerk shows the email-verification OTP step. Wait for it (or the modal to close).
  log("waiting for OTP step…");
  await page.locator(OTP_SEL).first().waitFor({ state: "visible", timeout: 25000 }).catch(() => log("no OTP input appeared"));
  await shot(page, "05-otp-step");
  if (await page.locator(OTP_SEL).first().isVisible().catch(() => false)) {
    log("entering OTP 424242"); await typeOtp(page); await page.waitForTimeout(5000); await shot(page, "06-after-otp");
    await clickContinue().catch(() => {});
  }
  // Wait for the Clerk modal to disappear (sign-in complete).
  await page.locator(".cl-modalContent, .cl-card").first().waitFor({ state: "hidden", timeout: 20000 }).catch(() => log("modal still open"));
  await page.waitForTimeout(2000);

  log("3. wait for app"); await page.waitForURL(/localhost:3000/, { timeout: 30000 }).catch(() => {});
  await page.goto(`${BASE}/play`, { waitUntil: "networkidle", timeout: 30000 }); await page.waitForTimeout(2500);
  await shot(page, "07-play"); log("url:", page.url());

  const signedIn = await page.getByText(/nueva partida|partidas en progreso|jugar/i).first().isVisible().catch(() => false);
  log("signedIn(heuristic):", signedIn);

  const cont = page.getByRole("link", { name: /continuar/i }).first();
  if (await cont.isVisible().catch(() => false)) { log("4. Continuar (existing)"); await cont.click(); }
  else { log("4. crear Fácil"); await page.getByText("Fácil", { exact: false }).first().click({ timeout: 10000 }).catch((e) => log("create fail", e.message)); }

  await page.waitForTimeout(2500); await shot(page, "08-after-click");
  const board = await page.waitForSelector('[data-testid="board"], .board, table', { timeout: 16000 }).then(() => true).catch(() => false);
  const skeleton = await page.locator(".skeleton").first().isVisible().catch(() => false);
  const errBox = await page.getByText(/algo salió mal|reintentar/i).first().isVisible().catch(() => false);
  await shot(page, "09-final");
  log("RESULT", JSON.stringify({ url: page.url(), board, skeleton, errBox }));
} catch (e) { log("ERROR", e.message); await shot(page, "99-error"); }
finally {
  log("API CALLS:\n" + (apiCalls.join("\n") || "  (none)"));
  log("CONSOLE ERRORS:\n" + (cerr.slice(0, 12).join("\n") || "  (none)"));
  await browser.close();
}
