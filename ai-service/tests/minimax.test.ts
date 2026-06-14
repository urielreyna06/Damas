import { describe, it, expect } from "vitest";
import { findBestMove } from "../src/minimax.ts";
import { generateLegalMoves, initialBoard } from "../src/moveGen.ts";
import type { Board, Piece, Move } from "../../packages/shared/src/types.ts";

// Alpha-beta minimax with iterative deepening — powers hard (depth 3) and expert (depth 5).
// Minimax has no randomness, so every assertion here is fully deterministic.

const defaultRules = {
  menCaptureBackward: false,
  flyingKings: false,
  forceMaximumCapture: false,
};

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null) as (Piece | null)[]);
}

function isLegal(board: Board, side: "red" | "black", move: Move): boolean {
  const legal = generateLegalMoves(board, side, defaultRules);
  return legal.some(
    (m) =>
      m.path.length === move.path.length &&
      m.path.every((sq, i) => sq.row === move.path[i]!.row && sq.col === move.path[i]!.col)
  );
}

describe("findBestMove — contract", () => {
  it("throws when no legal moves exist", () => {
    const board = emptyBoard();
    board[0]![1] = { side: "black", kind: "man" };
    expect(() => findBestMove(board, "red", "hard", defaultRules, 500)).toThrow(/no legal moves/i);
  });

  it.each(["hard", "expert"] as const)("returns a legal move on the opening board (%s)", (difficulty) => {
    const board = initialBoard();
    const result = findBestMove(board, "red", difficulty, defaultRules, 1800);
    expect(result.move.path.length).toBeGreaterThanOrEqual(2);
    expect(isLegal(board, "red", result.move)).toBe(true);
    expect(result.depth).toBeGreaterThanOrEqual(1);
  });

  it("is deterministic — identical inputs yield identical moves", () => {
    const board = initialBoard();
    const a = findBestMove(board, "red", "hard", defaultRules, 1800);
    const b = findBestMove(board, "red", "hard", defaultRules, 1800);
    expect(a.move.path).toEqual(b.move.path);
  });
});

describe("findBestMove — tactics", () => {
  it("takes a forced capture", () => {
    const board = emptyBoard();
    board[5]![0] = { side: "red", kind: "man" };
    board[4]![1] = { side: "black", kind: "man" };
    const result = findBestMove(board, "red", "hard", defaultRules, 1800);
    expect(result.move.captures.length).toBeGreaterThan(0);
  });

  it("grabs free material when an undefended capture is available", () => {
    // red can jump (5,2)->(3,0) capturing the lone black man at (4,1); nothing recaptures.
    const board = emptyBoard();
    board[5]![2] = { side: "red", kind: "man" };
    board[4]![1] = { side: "black", kind: "man" };
    board[7]![7] = { side: "red", kind: "man" }; // extra red piece, irrelevant to the jump
    const result = findBestMove(board, "red", "expert", defaultRules, 1800);
    expect(result.move.captures.length).toBeGreaterThan(0);
    expect(result.move.captures[0]).toEqual({ row: 4, col: 1 });
  });

  it("respects the time budget on the opening position", () => {
    const start = Date.now();
    findBestMove(initialBoard(), "red", "expert", defaultRules, 600);
    // Allow generous slack for CI jitter; the deadline guard must keep it bounded.
    expect(Date.now() - start).toBeLessThan(2000);
  });
});
