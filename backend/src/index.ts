import { Hono } from "hono";
import { cors } from "hono/cors";
import { connectDb } from "./db/index.ts";
import { gamesRouter } from "./routes/games.ts";
import { leaderboardRouter } from "./routes/leaderboard.ts";
import { themesRouter } from "./routes/themes.ts";
import { meRouter } from "./routes/me.ts";
import { stripeWebhookRouter } from "./stripe/webhook.ts";

const app = new Hono();

// CORS — allow frontend origin
app.use(
  "*",
  cors({
    origin: process.env["FRONTEND_URL"] ?? "http://localhost:3000",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Health check (no auth)
app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

// Stripe webhook — must be before JSON body parsing (raw body needed)
app.route("/api/stripe/webhook", stripeWebhookRouter);

// API routes
app.route("/api/games", gamesRouter);
app.route("/api/leaderboard", leaderboardRouter);
app.route("/api/themes", themesRouter);
app.route("/api/me", meRouter);

// Connect DB then start server
const port = Number(process.env["PORT"] ?? 3001);

await connectDb();
console.log(`Backend running on port ${port}`);

export default { port, fetch: app.fetch };
