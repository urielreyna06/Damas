import { Hono } from "hono";
import { col } from "../db/index.ts";
import type { Difficulty } from "../../../packages/shared/src/types.ts";

export const leaderboardRouter = new Hono();

// GET /api/leaderboard?difficulty=easy|medium|hard&limit=N — public, no auth required
leaderboardRouter.get("/", async (c) => {
  const diffParam = c.req.query("difficulty");
  if (!diffParam || !["easy", "medium", "hard"].includes(diffParam)) {
    return c.json(
      { code: "INVALID_DIFFICULTY", message: "difficulty query param must be easy|medium|hard" },
      400
    );
  }

  const difficulty = diffParam as Difficulty;
  const rawLimit = parseInt(c.req.query("limit") ?? "20", 10);
  const limit = Number.isNaN(rawLimit) ? 20 : Math.min(Math.max(rawLimit, 1), 100);

  const entries = await col
    .leaderboard()
    .find({ difficulty })
    .sort({ movementsToWin: 1, gameDurationMs: 1, endedAt: 1 })
    .limit(limit)
    .toArray();

  return c.json(entries);
});
