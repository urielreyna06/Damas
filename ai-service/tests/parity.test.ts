import { describe, it, expect } from "vitest";
import {
  generateLegalMoves as beMoves,
  applyMove as beApply,
  initialBoard as beInit,
  type RulesConfig,
} from "../../backend/src/rules/moveGenerator.ts";
import {
  generateLegalMoves as aiMoves,
  applyMove as aiApply,
  initialBoard as aiInit,
} from "../src/moveGen.ts";
import type { Board, Move, Side } from "../../packages/shared/src/types.ts";

/**
 * R-2 safety net — the rules engine is intentionally duplicated (backend is the
 * arbiter; the AI service is stateless and ships its own copy, CLAUDE.md §4).
 * Two hand-maintained copies can silently DRIFT: if the AI legalises a move the
 * backend would reject (or vice-versa), the AI starts "cheating" with no error.
 * The fuzz suite flagged the divergent `applyMove` signatures; this test guards
 * the behaviour both copies MUST agree on, so any future drift fails CI here
 * instead of in production.
 */

const MVP_RULES: RulesConfig = {
  menCaptureBackward: false,
  flyingKings: false,
  forceMaximumCapture: false,
};

// Deterministic PRNG (mulberry32) — same family as fuzz.test.ts.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Canonical, order-independent fingerprint of a move list.
function fingerprint(moves: Move[]): string {
  return moves
    .map((m) => JSON.stringify({ p: m.path, c: m.captures, k: m.promotion ?? false }))
    .sort()
    .join("|");
}

describe("rules-engine parity (backend ↔ ai-service)", () => {
  it("agrees on the initial board", () => {
    expect(aiInit()).toEqual(beInit());
  });

  it("agrees on legal moves and applyMove across random self-play", () => {
    const SEEDS = [1, 7, 42, 1337, 90210];
    const MAX_PLIES = 200;

    for (const seed of SEEDS) {
      const rand = mulberry32(seed);
      let board: Board = beInit();
      let side: Side = "red";

      for (let ply = 0; ply < MAX_PLIES; ply++) {
        const beList = beMoves(board, side, MVP_RULES);
        const aiList = aiMoves(board, side, MVP_RULES);

        // Both engines must enumerate the same set of legal moves.
        expect(fingerprint(aiList), `seed=${seed} ply=${ply} side=${side}`).toBe(
          fingerprint(beList)
        );

        if (beList.length === 0) break; // terminal — side to move has lost

        // Drive with one move; both engines must produce the same resulting board.
        const move = beList[Math.floor(rand() * beList.length)]!;
        const beNext = beApply(board, move).newBoard;
        const aiNext = aiApply(board, move);
        expect(aiNext, `seed=${seed} ply=${ply} applyMove`).toEqual(beNext);

        board = beNext;
        side = side === "red" ? "black" : "red";
      }
    }
  });
});
