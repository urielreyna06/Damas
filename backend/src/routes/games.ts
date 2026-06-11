import { Hono } from "hono";
import type { Context } from "hono";
import { ObjectId } from "mongodb";
import { requireAuth, getClerkUser } from "../clerk/middleware.ts";
import { col } from "../db/index.ts";
import { generateLegalMoves, applyMove, initialBoard } from "../rules/moveGenerator.ts";
import { validateMove } from "../rules/moveValidator.ts";
import { detectGameEnd } from "../rules/gameEnd.ts";
import type {
  Difficulty,
  Game,
  MoveRecord,
  AiMoveRequest,
  AiMoveResponse,
  Square,
} from "../../../packages/shared/src/types.ts";

const MVP_RULES = {
  menCaptureBackward: false,
  flyingKings: false,
  forceMaximumCapture: false,
} as const;

const AI_SERVICE_URL = process.env["AI_SERVICE_URL"] ?? "http://localhost:3002";

export const gamesRouter = new Hono();
gamesRouter.use("*", requireAuth);

// ─────────────────────────────────────────────
// POST /api/games
// ─────────────────────────────────────────────
gamesRouter.post("/", async (c) => {
  const { clerkUserId } = getClerkUser(c);
  const body = await c.req.json<{ difficulty: unknown }>();

  if (!["easy", "medium", "hard", "expert"].includes(body.difficulty as string)) {
    return c.json({ code: "INVALID_DIFFICULTY", message: "difficulty must be easy|medium|hard|expert" }, 400);
  }

  const now = new Date().toISOString();
  const doc = {
    clerkUserId,
    humanSide: "red" as const,
    difficulty: body.difficulty as Difficulty,
    status: "in_progress" as const,
    board: initialBoard(),
    turn: "red" as const,
    moves: [] as MoveRecord[],
    humanMoveCount: 0,
    plySinceProgress: 0,
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const result = await col.games().insertOne(doc);
  return c.json({ ...doc, _id: result.insertedId.toHexString() }, 201);
});

// ─────────────────────────────────────────────
// GET /api/games
// ─────────────────────────────────────────────
gamesRouter.get("/", async (c) => {
  const { clerkUserId } = getClerkUser(c);
  const docs = await col.games()
    .find({ clerkUserId })
    .sort({ updatedAt: -1 })
    .project({ moves: 0 })
    .toArray();
  return c.json(docs);
});

// ─────────────────────────────────────────────
// GET /api/games/:id
// ─────────────────────────────────────────────
gamesRouter.get("/:id", async (c) => {
  const { clerkUserId } = getClerkUser(c);
  const game = await loadGame(c.req.param("id"), clerkUserId);
  if (!game) return c.json({ code: "NOT_FOUND", message: "Game not found" }, 404);
  return c.json(game);
});

// ─────────────────────────────────────────────
// GET /api/games/:id/legal-moves
// ─────────────────────────────────────────────
gamesRouter.get("/:id/legal-moves", async (c) => {
  const { clerkUserId } = getClerkUser(c);
  const game = await loadGame(c.req.param("id"), clerkUserId);
  if (!game) return c.json({ code: "NOT_FOUND", message: "Game not found" }, 404);
  if (game.status !== "in_progress") return c.json([]);
  return c.json(generateLegalMoves(game.board, game.turn, MVP_RULES));
});

// ─────────────────────────────────────────────
// POST /api/games/:id/moves
// ─────────────────────────────────────────────
gamesRouter.post("/:id/moves", async (c) => {
  const { clerkUserId, displayName } = getClerkUser(c);
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ code: "NOT_FOUND", message: "Game not found" }, 404);

  const body = await c.req.json<{ path: Square[] }>();
  if (!Array.isArray(body.path) || body.path.length < 2) {
    return c.json({ code: "INVALID_PATH", message: "path must have at least 2 squares" }, 400);
  }

  // CA-08, CA-11: always load from DB — never trust client state or timestamps
  const game = await loadGame(id, clerkUserId);
  if (!game) return c.json({ code: "NOT_FOUND", message: "Game not found" }, 404);
  if (game.status !== "in_progress") {
    return c.json({ code: "GAME_OVER", message: "Game has already ended" }, 409);
  }
  if (game.turn !== game.humanSide) {
    return c.json({ code: "NOT_YOUR_TURN", message: "Not the human's turn" }, 409);
  }

  const validation = validateMove(game.board, body.path, game.humanSide, MVP_RULES);
  if (!validation.valid) {
    return c.json({ code: "ILLEGAL_MOVE", message: validation.error }, 409);
  }

  const humanMove = validation.move;
  const ply = game.moves.length;
  const aiSide: "red" | "black" = game.humanSide === "red" ? "black" : "red";

  const { newBoard: boardAfterHuman, progress: humanProgress } = applyMove(game.board, humanMove);
  const plsAfterHuman = humanProgress ? 0 : game.plySinceProgress + 1;
  const newHumanMoveCount = game.humanMoveCount + 1;

  const humanRecord: MoveRecord = {
    ply,
    side: game.humanSide,
    byAI: false,
    move: humanMove,
    resultingBoard: boardAfterHuman,
    createdAt: new Date().toISOString(),
  };

  const endAfterHuman = detectGameEnd(boardAfterHuman, aiSide, plsAfterHuman, MVP_RULES);
  if (endAfterHuman) {
    return finalize(c, id, game, {
      board: boardAfterHuman,
      turn: aiSide,
      status: endAfterHuman.status,
      humanMoveCount: newHumanMoveCount,
      plySinceProgress: plsAfterHuman,
      records: [humanRecord],
      clerkUserId,
      displayName,
    });
  }

  // Call AI Service
  const aiReq: AiMoveRequest = {
    board: boardAfterHuman,
    sideToMove: aiSide,
    difficulty: game.difficulty,
    rules: MVP_RULES,
  };

  let aiRes: AiMoveResponse;
  try {
    const resp = await fetch(`${AI_SERVICE_URL}/internal/ai/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aiReq),
    });
    if (!resp.ok) throw new Error(`AI Service returned ${resp.status}`);
    aiRes = (await resp.json()) as AiMoveResponse;
  } catch (err) {
    console.error("AI Service error:", err);
    return c.json({ code: "AI_SERVICE_ERROR", message: "Could not get AI move" }, 502);
  }

  const { newBoard: boardAfterAI, progress: aiProgress } = applyMove(boardAfterHuman, aiRes.move);
  const plsAfterAI = aiProgress ? 0 : plsAfterHuman + 1;

  const aiRecord: MoveRecord = {
    ply: ply + 1,
    side: aiSide,
    byAI: true,
    move: aiRes.move,
    resultingBoard: boardAfterAI,
    createdAt: new Date().toISOString(),
    thinkMs: aiRes.thinkMs,
  };

  const endAfterAI = detectGameEnd(boardAfterAI, game.humanSide, plsAfterAI, MVP_RULES);
  if (endAfterAI) {
    return finalize(c, id, game, {
      board: boardAfterAI,
      turn: game.humanSide,
      status: endAfterAI.status,
      humanMoveCount: newHumanMoveCount,
      plySinceProgress: plsAfterAI,
      records: [humanRecord, aiRecord],
      clerkUserId,
      displayName,
      lastAiMove: aiRecord,
    });
  }

  // Game still in progress
  await col.games().updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        board: boardAfterAI,
        turn: game.humanSide,
        status: "in_progress",
        humanMoveCount: newHumanMoveCount,
        plySinceProgress: plsAfterAI,
        updatedAt: new Date().toISOString(),
      },
      $push: { moves: { $each: [humanRecord, aiRecord] } } as any,
    }
  );

  return c.json({
    game: { ...game, board: boardAfterAI, turn: game.humanSide, humanMoveCount: newHumanMoveCount, plySinceProgress: plsAfterAI },
    lastAiMove: aiRecord,
  });
});

// ─────────────────────────────────────────────
// DELETE /api/games/:id
// ─────────────────────────────────────────────
gamesRouter.delete("/:id", async (c) => {
  const { clerkUserId } = getClerkUser(c);
  const id = c.req.param("id");
  if (!ObjectId.isValid(id)) return c.json({ code: "NOT_FOUND", message: "Game not found" }, 404);

  const r = await col.games().updateOne(
    { _id: new ObjectId(id), clerkUserId, status: "in_progress" },
    { $set: { status: "abandoned", updatedAt: new Date().toISOString() } }
  );
  if (r.matchedCount === 0) return c.json({ code: "NOT_FOUND", message: "Active game not found" }, 404);
  return c.json({ ok: true });
});

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

async function loadGame(id: string, clerkUserId: string): Promise<Game | null> {
  if (!ObjectId.isValid(id)) return null;
  const doc = await col.games().findOne({ _id: new ObjectId(id), clerkUserId });
  if (!doc) return null;
  return { ...doc, _id: doc["_id"].toString() } as unknown as Game;
}

interface FinalizeOpts {
  board: Game["board"];
  turn: Game["turn"];
  status: Game["status"];
  humanMoveCount: number;
  plySinceProgress: number;
  records: MoveRecord[];
  clerkUserId: string;
  displayName: string;
  lastAiMove?: MoveRecord;
}

async function finalize(
  c: Context,
  id: string,
  game: Game,
  opts: FinalizeOpts
): Promise<Response> {
  const endedAt = new Date().toISOString();
  const durationMs = new Date(endedAt).getTime() - new Date(game.startedAt).getTime();

  await col.games().updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        board: opts.board,
        turn: opts.turn,
        status: opts.status,
        humanMoveCount: opts.humanMoveCount,
        plySinceProgress: opts.plySinceProgress,
        endedAt,
        durationMs,
        updatedAt: endedAt,
      },
      $push: { moves: { $each: opts.records } } as any,
    }
  );

  if (opts.status === "human_won") {
    try {
      await col.leaderboard().insertOne({
        clerkUserId: opts.clerkUserId,
        displayName: opts.displayName,
        gameId: id,
        movementsToWin: opts.humanMoveCount,
        gameDurationMs: durationMs,
        difficulty: game.difficulty,
        endedAt,
      });
    } catch (err) {
      console.error("Failed to insert leaderboard entry:", err);
    }
  }

  return c.json({
    game: { ...game, board: opts.board, turn: opts.turn, status: opts.status, humanMoveCount: opts.humanMoveCount, plySinceProgress: opts.plySinceProgress, endedAt, durationMs },
    ...(opts.lastAiMove ? { lastAiMove: opts.lastAiMove } : {}),
  });
}
