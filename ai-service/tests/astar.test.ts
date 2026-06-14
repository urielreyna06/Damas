import { describe, it, expect, vi, afterEach } from "vitest";
import { findBestMoveAstar } from "../src/astar.ts";
import { generateLegalMoves, initialBoard } from "../src/moveGen.ts";
import type { Board, Piece, Move } from "../../packages/shared/src/types.ts";

// A* best-first search (powers easy/medium, plus a multi-ply variant for hard/expert).
// `easy` injects 30% random noise, so those tests stub Math.random for determinism.

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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("findBestMoveAstar — contract", () => {
  it("throws when the side to move has no legal moves", () => {
    const board = emptyBoard();
    board[0]![1] = { side: "black", kind: "man" }; // only black has a piece
    expect(() => findBestMoveAstar(board, "red", "easy", defaultRules)).toThrow(/no legal moves/i);
  });

  it.each(["easy", "medium", "hard", "expert"] as const)(
    "returns a legal move on the opening board (%s)",
    (difficulty) => {
      const board = initialBoard();
      vi.spyOn(Math, "random").mockReturnValue(0.99); // force greedy branch for easy
      const result = findBestMoveAstar(board, "red", difficulty, defaultRules);
      expect(result.move.path.length).toBeGreaterThanOrEqual(2);
      expect(isLegal(board, "red", result.move)).toBe(true);
      expect(typeof result.score).toBe("number");
    }
  );
});

describe("findBestMoveAstar — easy randomness", () => {
  it("plays greedily when Math.random() >= 0.3", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const board = initialBoard();
    const result = findBestMoveAstar(board, "red", "easy", defaultRules);
    expect(result.depth).toBe(1);
    expect(isLegal(board, "red", result.move)).toBe(true);
  });

  it("still returns a legal move when the random (exploration) branch fires", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1); // < 0.3 → random pick
    const board = initialBoard();
    const result = findBestMoveAstar(board, "red", "easy", defaultRules);
    expect(isLegal(board, "red", result.move)).toBe(true);
  });
});

describe("findBestMoveAstar — tactical behavior", () => {
  it("medium takes a forced capture", () => {
    const board = emptyBoard();
    board[5]![2] = { side: "red", kind: "man" };
    board[4]![3] = { side: "black", kind: "man" };
    const result = findBestMoveAstar(board, "red", "medium", defaultRules);
    expect(result.move.captures.length).toBeGreaterThan(0);
  });

  it("medium is deterministic — same input yields the same move", () => {
    const board = initialBoard();
    const a = findBestMoveAstar(board, "red", "medium", defaultRules);
    const b = findBestMoveAstar(board, "red", "medium", defaultRules);
    expect(a.move.path).toEqual(b.move.path);
  });

  it("hard explores beyond 1 ply (reports its max search depth)", () => {
    const result = findBestMoveAstar(initialBoard(), "red", "hard", defaultRules);
    expect(result.depth).toBeGreaterThan(1);
  });
});
