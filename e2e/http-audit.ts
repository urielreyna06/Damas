#!/usr/bin/env bun
/**
 * HTTP-based audit — runs without a browser.
 * Tests: routes respond 200, CSS injected in SSR HTML, API endpoints healthy.
 */

const FRONTEND = "http://localhost:3000";
const BACKEND  = "http://localhost:3001";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function ok(name: string) {
  console.log(`  ✅ ${name}`);
  passed++;
}

function fail(name: string, detail: string) {
  console.log(`  ❌ ${name}\n     → ${detail}`);
  failed++;
  failures.push(`${name}: ${detail}`);
}

async function get(url: string): Promise<{ status: number; body: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) }).catch((e) => {
    throw new Error(`fetch failed: ${e.message}`);
  });
  const body = await res.text();
  return { status: res.status, body };
}

// ─── Section 1: Frontend routes ───────────────────────────────────────────────
console.log("\n🔍  Frontend routes\n");

const routes = ["/", "/leaderboard", "/shop", "/play"];
for (const route of routes) {
  try {
    const { status } = await get(`${FRONTEND}${route}`);
    if (status === 200) ok(`GET ${route} → 200`);
    else fail(`GET ${route}`, `expected 200, got ${status}`);
  } catch (e: any) {
    fail(`GET ${route}`, e.message);
  }
}

// ─── Section 2: 404 handling ──────────────────────────────────────────────────
console.log("\n🔍  404 handling\n");
try {
  const { status } = await get(`${FRONTEND}/this-does-not-exist-zzzz`);
  if (status === 404) ok("Unknown route → 404");
  else if (status === 200) ok("Unknown route → 200 (SPA catch-all, expected)");
  else fail("Unknown route 404 handling", `unexpected status ${status}`);
} catch (e: any) {
  fail("Unknown route 404 handling", e.message);
}

// ─── Section 3: Favicon served ────────────────────────────────────────────────
console.log("\n🔍  Static assets\n");
try {
  const { status, body } = await get(`${FRONTEND}/favicon.svg`);
  if (status === 200 && body.includes("<svg")) ok("favicon.svg served correctly");
  else fail("favicon.svg", `status=${status}, svg present=${body.includes("<svg")}`);
} catch (e: any) {
  fail("favicon.svg", e.message);
}

// ─── Section 4: SSR HTML structure audit ─────────────────────────────────────
console.log("\n🔍  SSR HTML structure (CSS injection via <Meta/>)\n");
try {
  const { body } = await get(`${FRONTEND}/`);

  // <html lang="es"> present
  if (body.includes('<html lang="es"')) ok("HTML has lang=es");
  else fail("<html lang=es>", "not found in SSR output");

  // React SSR outputs charSet (capital S) — both casings are valid
  if (body.includes('charset="utf-8"') || body.includes('charSet="utf-8"') || body.includes("charset=utf-8"))
    ok("<meta charset> injected");
  else fail("<meta charset>", "not found — Meta component may not be rendering");

  // Viewport meta
  if (body.includes("viewport")) ok("viewport meta tag present");
  else fail("viewport meta", "not found in <head>");

  // Dev mode: CSS loaded via Vinxi bootstrap script (createElement + dynamic import).
  // Prod mode: static <link rel="stylesheet"> tags from build manifest.
  const hasBootstrap = body.includes("_build/src/client.tsx") || body.includes("/_build/");
  const cssLinks = (body.match(/<link[^>]+\.css[^>]*>/g) || []).length;
  if (hasBootstrap) ok("Vinxi dev bootstrap script present → CSS will load via Vite HMR");
  else if (cssLinks > 0) ok(`CSS link tags present (prod build): ${cssLinks}`);
  else fail("CSS delivery", "no bootstrap script and no <link> CSS tags — styles will not load");

  // <Scripts/> — should inject the JS bundle script tag
  if (body.includes("<script")) ok("<script> tags present (Scripts component)");
  else fail("<Scripts/>", "no <script> tags — hydration will fail");

  // Title
  if (body.includes("Damas")) ok("Page title contains 'Damas'");
  else fail("Page title", "missing Damas in title");

  // favicon link
  if (body.includes("favicon.svg")) ok("Favicon linked in <head>");
  else fail("favicon link", "favicon.svg not referenced in HTML head");

} catch (e: any) {
  fail("SSR HTML audit", e.message);
}

// ─── Section 5: Backend API health ───────────────────────────────────────────
console.log("\n🔍  Backend API\n");

const apiTests: Array<[string, string]> = [
  [`${BACKEND}/api/leaderboard?difficulty=easy&limit=5`, "leaderboard (easy)"],
  [`${BACKEND}/api/leaderboard?difficulty=hard&limit=5`, "leaderboard (hard)"],
];

for (const [url, label] of apiTests) {
  try {
    const { status, body } = await get(url);
    if (status < 500) ok(`${label} → ${status} (non-500)`);
    else fail(label, `500 error: ${body.slice(0, 120)}`);
  } catch (e: any) {
    fail(label, e.message);
  }
}

// ─── Section 6: Leaderboard data ─────────────────────────────────────────────
console.log("\n🔍  Leaderboard data\n");
try {
  const { status, body } = await get(`${BACKEND}/api/leaderboard?difficulty=easy&limit=5`);
  if (status !== 200) {
    fail("leaderboard response", `status ${status}: ${body.slice(0, 100)}`);
  } else {
    const data = JSON.parse(body);
    if (Array.isArray(data) || Array.isArray(data?.entries) || Array.isArray(data?.data)) {
      ok(`leaderboard returns array (${Array.isArray(data) ? data.length : "nested"} entries)`);
    } else {
      fail("leaderboard shape", `unexpected: ${JSON.stringify(data).slice(0, 100)}`);
    }
  }
} catch (e: any) {
  fail("leaderboard data", e.message);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(52)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log("\n  Failures to fix:");
  failures.forEach((f) => console.log(`    • ${f}`));
}
console.log(`${"─".repeat(52)}\n`);

if (failed > 0) process.exit(1);
