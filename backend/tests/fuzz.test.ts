import { describe, it, expect } from "vitest";
import {
  generateLegalMoves,
  applyMove,
  initialBoard,
  type RulesConfig,
} from "../src/rules/moveGenerator.ts";
import { detectGameEnd } from "../src/rules/gameEnd.ts";
import type { Board, Side } from "../../packages/shared/src/types.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Property-based / "monkey" testing for the rules engine.
//
// Why TypeScript and not pytest+hypothesis (as the brief suggested): this is a
// pure Bun/TypeScript monorepo with no Python toolchain, and the engine under
// test is TS. Driving it from pytest would mean a subprocess bridge and a second
// language runtime in CI — pure over-engineering. We get the same value with a
// seeded PRNG here, and seeding keeps every run fully deterministic.
// ─────────────────────────────────────────────────────────────────────────────

const MVP_RULES: RulesConfig = {
  menCaptureBackward: false,
  flyingKings: false,
  forceMaximumCapture: false,
};

// mulberry32 — tiny deterministic PRNG so failures are reproducible.
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function countPieces(board: Board): { red: number; black: number } {
  let red = 0;
  let black = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r]![c];
      if (p?.side === "red") red++;
      else if (p?.side === "black") black++;
    }
  }
  return { red, black };
}

function assertBoardInvariants(board: Board): void {
  expect(board.length).toBe(8);
  for (let r = 0; r < 8; r++) {
    expect(board[r]!.length).toBe(8);
    for (let c = 0; c < 8; c++) {
      const p = board[r]![c];
      if (p) {
        // every piece must live on a dark square
        expect((r + c) % 2).toBe(1);
        expect(["red", "black"]).toContain(p.side);
        expect(["man", "king"]).toContain(p.kind);
      }
    }
  }
}

/** Play one fully random game and assert engine invariants at every ply. */
function playRandomGame(rng: () => number, maxPlies = 200): void {
  let board = initialBoard();
  let turn: Side = "red";
  let plySinceProgress = 0;
  let prevCount = countPieces(board);

  for (let ply = 0; ply < maxPlies; ply++) {
    const moves = generateLegalMoves(board, turn, MVP_RULES);

    // Mandatory-capture invariant: if any capture exists, EVERY legal move captures.
    const anyCapture = moves.some((m) => m.captures.length > 0);
    if (anyCapture) {
      expect(moves.every((m) => m.captures.length > 0)).toBe(true);
    }

    // detectGameEnd returns null while in progress, or a {status} object when over.
    const end = detectGameEnd(board, turn, plySinceProgress, MVP_RULES);
    if (moves.length === 0) {
      // No moves → the engine must report a terminal state (a non-null result).
      expect(end).not.toBeNull();
      return;
    }
    if (end !== null) return;

    const move = moves[Math.floor(rng() * moves.length)]!;
    const before = countPieces(board);
    // backend applyMove returns { newBoard, progress } (unlike the ai-service copy).
    const { newBoard, progress } = applyMove(board, move);
    board = newBoard;
    assertBoardInvariants(board);

    const after = countPieces(board);
    // applyMove must never create pieces; total can only stay or shrink (captures).
    expect(after.red).toBeLessThanOrEqual(before.red);
    expect(after.black).toBeLessThanOrEqual(before.black);
    // The number of captured pieces must match the drop in opponent count.
    const opponentDrop = turn === "red" ? before.black - after.black : before.red - after.red;
    expect(opponentDrop).toBe(move.captures.length);

    // `progress` (capture or promotion) resets the draw counter.
    if (progress) plySinceProgress = 0;
    else plySinceProgress++;

    prevCount = after;
    turn = turn === "red" ? "black" : "red";
  }

  // Reaching the cap is fine; just assert we still hold a sane board.
  assertBoardInvariants(board);
  expect(prevCount.red + prevCount.black).toBeGreaterThan(0);
}

describe("Fuzz: rules engine never violates its invariants over random play", () => {
  // Fixed seed list → deterministic across runs while still covering varied lines.
  const seeds = [1, 7, 42, 99, 123, 777, 2024, 31337];

  it.each(seeds)("random playout with seed %i holds all invariants", (seed) => {
    const rng = makeRng(seed);
    playRandomGame(rng);
  });

  it("generateLegalMoves never throws on many random reachable positions", () => {
    const rng = makeRng(20260613);
    for (let game = 0; game < 25; game++) {
      let board = initialBoard();
      let turn: Side = "red";
      for (let ply = 0; ply < 40; ply++) {
        const moves = generateLegalMoves(board, turn, MVP_RULES);
        if (moves.length === 0) break;
        board = applyMove(board, moves[Math.floor(rng() * moves.length)]!).newBoard;
        turn = turn === "red" ? "black" : "red";
        // generating for the *other* side must also be safe
        expect(() => generateLegalMoves(board, turn, MVP_RULES)).not.toThrow();
      }
    }
  });
});
