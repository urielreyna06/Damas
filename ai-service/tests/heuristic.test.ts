import { describe, it, expect } from "vitest";
import { evaluate, DEFAULT_WEIGHTS, type HeuristicWeights } from "../src/heuristic.ts";
import { initialBoard } from "../src/moveGen.ts";
import type { Board, Piece } from "../../packages/shared/src/types.ts";

// Pure, deterministic unit tests for the static evaluation function used by both
// the A* and minimax searches. evaluate() must be side-relative and free of any
// time/random dependency.

function emptyBoard(): Board {
  return Array.from({ length: 8 }, () => Array(8).fill(null) as (Piece | null)[]);
}

describe("evaluate — material balance", () => {
  it("scores an empty board as 0 from either side", () => {
    const board = emptyBoard();
    expect(evaluate(board, "red")).toBe(0);
    expect(evaluate(board, "black")).toBe(0);
  });

  it("a lone red piece is good for red and bad for black (opposite signs)", () => {
    const board = emptyBoard();
    board[5]![0] = { side: "red", kind: "man" }; // red has one extra man, no exposure
    expect(evaluate(board, "red")).toBeGreaterThan(0);
    expect(evaluate(board, "black")).toBeLessThan(0);
  });

  it("material-only positions are exact mirror images (off-center king has no positional bonus)", () => {
    // A king earns no advancement term and an off-center square earns no center term,
    // so only the (anti-symmetric) material term remains → the two views are exact opposites.
    const board = emptyBoard();
    board[0]![1] = { side: "red", kind: "king" };
    const redScore = evaluate(board, "red");
    const blackScore = evaluate(board, "black");
    expect(redScore).toBeGreaterThan(0);
    expect(blackScore).toBe(-redScore);
  });

  it("prefers more material — two men beat one man", () => {
    const oneMan = emptyBoard();
    oneMan[5]![0] = { side: "red", kind: "man" };

    const twoMen = emptyBoard();
    twoMen[5]![0] = { side: "red", kind: "man" };
    twoMen[5]![2] = { side: "red", kind: "man" };

    expect(evaluate(twoMen, "red")).toBeGreaterThan(evaluate(oneMan, "red"));
  });

  it("values a king above a man (kingValue > manValue in weights)", () => {
    expect(DEFAULT_WEIGHTS.kingValue).toBeGreaterThan(DEFAULT_WEIGHTS.manValue);

    const withMan = emptyBoard();
    withMan[3]![2] = { side: "red", kind: "man" };

    const withKing = emptyBoard();
    withKing[3]![2] = { side: "red", kind: "king" };

    expect(evaluate(withKing, "red")).toBeGreaterThan(evaluate(withMan, "red"));
  });
});

describe("evaluate — positional terms", () => {
  it("rewards central control (rows 3-4, cols 2-5)", () => {
    const central = emptyBoard();
    central[3]![2] = { side: "red", kind: "king" }; // king avoids advancement-term skew

    const edge = emptyBoard();
    edge[1]![0] = { side: "red", kind: "king" }; // off-center, same material

    expect(evaluate(central, "red")).toBeGreaterThan(evaluate(edge, "red"));
  });

  it("penalizes exposure — an immediately capturable man scores worse", () => {
    // red man at (5,2); black man at (4,3) can capture it landing on (3,1)
    const exposed = emptyBoard();
    exposed[5]![2] = { side: "red", kind: "man" };
    exposed[4]![3] = { side: "black", kind: "man" };

    // same two pieces but not aligned for a capture
    const safe = emptyBoard();
    safe[5]![2] = { side: "red", kind: "man" };
    safe[1]![6] = { side: "black", kind: "man" };

    expect(evaluate(exposed, "red")).toBeLessThan(evaluate(safe, "red"));
  });
});

describe("evaluate — weights are honored", () => {
  it("zeroing every weight collapses the score to 0", () => {
    const zero: HeuristicWeights = {
      manValue: 0, kingValue: 0, w1: 0, w2: 0, w3: 0, w4: 0, w5: 0,
    };
    expect(evaluate(initialBoard(), "red", zero)).toBe(0);
  });

  it("the symmetric initial board evaluates near 0 for the side to move", () => {
    // Opening position is mirror-symmetric, so material/center/advancement cancel.
    const score = evaluate(initialBoard(), "red");
    expect(Math.abs(score)).toBeLessThan(DEFAULT_WEIGHTS.manValue);
  });
});
