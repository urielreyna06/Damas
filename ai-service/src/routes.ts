import { Hono } from "hono";
import type { AiMoveRequest, AiMoveResponse } from "../../packages/shared/src/types.ts";
import { findBestMoveAstar } from "./astar.ts";

export const router = new Hono();

router.post("/internal/ai/move", async (c) => {
  let body: AiMoveRequest;
  try {
    body = await c.req.json<AiMoveRequest>();
  } catch {
    return c.json({ code: "BAD_REQUEST", message: "Invalid JSON body" }, 400);
  }

  const { board, sideToMove, difficulty, rules } = body;

  if (!board || !sideToMove || !difficulty || !rules) {
    return c.json({ code: "BAD_REQUEST", message: "Missing required fields: board, sideToMove, difficulty, rules" }, 400);
  }

  if (!Array.isArray(board) || board.length !== 8) {
    return c.json({ code: "BAD_REQUEST", message: "board must be an 8x8 array" }, 400);
  }

  if (sideToMove !== "red" && sideToMove !== "black") {
    return c.json({ code: "BAD_REQUEST", message: "sideToMove must be 'red' or 'black'" }, 400);
  }

  if (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard" && difficulty !== "expert") {
    return c.json({ code: "BAD_REQUEST", message: "difficulty must be 'easy', 'medium', 'hard', or 'expert'" }, 400);
  }

  const start = Date.now();
  let result: ReturnType<typeof findBestMoveAstar>;

  try {
    result = findBestMoveAstar(board, sideToMove, difficulty, rules);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during move generation";
    return c.json({ code: "NO_MOVES", message }, 422);
  }

  const thinkMs = Date.now() - start;

  const response: AiMoveResponse = {
    move: result.move,
    evaluation: result.score,
    depthSearched: result.depth,
    thinkMs,
  };

  return c.json(response, 200);
});
