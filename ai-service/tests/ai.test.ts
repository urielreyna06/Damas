import { describe, it, expect } from "vitest";
import { findBestMove } from "../src/minimax.ts";
import { initialBoard } from "../src/moveGen.ts";
import type { Board } from "../../packages/shared/src/types.ts";

const defaultRules = {
  menCaptureBackward: false,
  flyingKings: false,
  forceMaximumCapture: false,
};

// ─── CA-09: Stateless — no MongoDB dependency ─────────────────────────────────

describe("CA-09: AI Service is stateless (no DB dependency)", () => {
  it("findBestMove resolves without any database import or error", () => {
    const board = initialBoard();
    const result = findBestMove(board, "red", "easy", defaultRules, 1800);

    expect(result).toBeDefined();
    expect(result.move).toBeDefined();
    expect(Array.isArray(result.move.path)).toBe(true);
    expect(result.move.path.length).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(result.move.captures)).toBe(true);
    expect(typeof result.move.promotion).toBe("boolean");
    expect(typeof result.score).toBe("number");
    expect(typeof result.depth).toBe("number");
    expect(result.depth).toBeGreaterThanOrEqual(1);
  });
});

// ─── CA-10: Response time < 2s for hard difficulty ───────────────────────────

describe("CA-10: findBestMove completes within 2 seconds on hard difficulty", () => {
  it("hard difficulty on initial board finishes in < 2000ms", () => {
    const board = initialBoard();
    const start = Date.now();
    const result = findBestMove(board, "red", "hard", defaultRules, 1800);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(2000);
    expect(result.move).toBeDefined();
    expect(result.move.path.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Bonus: obvious capture is selected ──────────────────────────────────────

describe("Bonus: AI selects a capture when one is available", () => {
  it("returns a move with captures when a capture is forced", () => {
    const board: Board = Array.from({ length: 8 }, () =>
      Array(8).fill(null) as (import("../../packages/shared/src/types.ts").Piece | null)[]
    );
    board[5]![0] = { side: "red", kind: "man" };
    board[4]![1] = { side: "black", kind: "man" };

    const result = findBestMove(board, "red", "hard", defaultRules, 1800);
    expect(result.move.captures.length).toBeGreaterThan(0);
  });

  it("medium difficulty also captures when forced", () => {
    const board: Board = Array.from({ length: 8 }, () =>
      Array(8).fill(null) as (import("../../packages/shared/src/types.ts").Piece | null)[]
    );
    board[5]![2] = { side: "red", kind: "man" };
    board[4]![3] = { side: "black", kind: "man" };

    const result = findBestMove(board, "red", "medium", defaultRules, 1800);
    expect(result.move.captures.length).toBeGreaterThan(0);
  });
});

// ─── initialBoard shape ───────────────────────────────────────────────────────

describe("initialBoard", () => {
  it("places 12 black pieces in rows 0-2 and 12 red pieces in rows 5-7", () => {
    const board = initialBoard();
    let red = 0;
    let black = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const p = board[row]![col];
        if (p?.side === "red") red++;
        if (p?.side === "black") black++;
      }
    }
    expect(red).toBe(12);
    expect(black).toBe(12);
  });

  it("only places pieces on dark squares (row+col odd)", () => {
    const board = initialBoard();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 0) {
          expect(board[row]![col]).toBeNull();
        }
      }
    }
  });
});
