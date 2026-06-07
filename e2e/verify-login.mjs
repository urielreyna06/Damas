// One-off browser verification: confirms the SSR page hydrates, Clerk initializes,
// the login button becomes available, and CSS is applied. Run: bun run e2e/verify-login.mjs
import { chromium } from "@playwright/test";

const URL = process.env.URL ?? "http://localhost:3000/";
const errors = [];

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });

let loginVisible = false;
try {
  await page.waitForSelector("text=Iniciar sesión", { timeout: 15000 });
  loginVisible = true;
} catch {
  /* button never appeared → hydration/Clerk failed */
}

const probe = await page.evaluate(() => ({
  bodyBg: document.body ? getComputedStyle(document.body).backgroundColor : null,
  navExists: !!document.querySelector("nav, .nav"),
  navBg: document.querySelector("nav, .nav")
    ? getComputedStyle(document.querySelector("nav, .nav")).backgroundColor
    : null,
  clerkGlobal: typeof window.Clerk !== "undefined",
}));

console.log(
  JSON.stringify(
    { loginVisible, ...probe, errorCount: errors.length, errors: errors.slice(0, 12) },
    null,
    2,
  ),
);

await browser.close();
process.exit(loginVisible ? 0 : 1);
