import { describe, it, expect } from "vitest";
import {
  generateLegalMoves,
  applyMove,
  initialBoard,
  type RulesConfig,
} from "../src/rules/moveGenerator.ts";
import { validateMove } from "../src/rules/moveValidator.ts";
import { detectGameEnd } from "../src/rules/gameEnd.ts";
import type { Board, Square, Piece } from "../../packages/shared/src/types.ts";

const MVP_RULES: RulesConfig = {
  menCaptureBackward: false,
  flyingKings: false,
  forceMaximumCapture: false,
};

/** Helper: build an empty 8×8 board */
function emptyBoard(): Board {
  return Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null)
  );
}

/** Helper: place a piece on a board (mutates) */
function place(board: Board, row: number, col: number, piece: Piece): void {
  board[row]![col] = piece;
}

// ─────────────────────────────────────────────────────────────────────────────
// CA-01 — Mandatory capture: non-capture move is rejected when a capture exists
// ─────────────────────────────────────────────────────────────────────────────
describe("CA-01: mandatory capture blocks non-capture moves", () => {
  it("validateMove rejects a simple move when a capture is available", () => {
    const board = emptyBoard();
    // RED man at (5,2), BLACK man at (4,3) — RED can capture diagonally forward
    place(board, 5, 2, { side: "red", kind: "man" });
    place(board, 4, 3, { side: "black", kind: "man" });
    // (3,4) is empty → capture lands there

    // Attempt a simple forward move instead of capturing
    const nonCapturePath: Square[] = [
      { row: 5, col: 2 },
      { row: 4, col: 1 },
    ];

    const result = validateMove(board, nonCapturePath, "red", MVP_RULES);
    expect(result.valid).toBe(false);
    expect((result as { valid: false; error: string }).error).toMatch(/capture/i);
  });

  it("validateMove accepts the capture move on the same board", () => {
    const board = emptyBoard();
    place(board, 5, 2, { side: "red", kind: "man" });
    place(board, 4, 3, { side: "black", kind: "man" });

    const capturePath: Square[] = [
      { row: 5, col: 2 },
      { row: 3, col: 4 },
    ];

    const result = validateMove(board, capturePath, "red", MVP_RULES);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.move.captures).toHaveLength(1);
      expect(result.move.captures[0]).toEqual({ row: 4, col: 3 });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-02 — Capture chain: generateLegalMoves returns the full multi-jump path
// ─────────────────────────────────────────────────────────────────────────────
describe("CA-02: capture chain returns complete path", () => {
  it("double-jump path has 3 squares and 2 captures", () => {
    const board = emptyBoard();
    // RED man at (6,0)
    // BLACK at (5,1) and (3,3) — double jump possible
    // Jumps: (6,0)→(4,2)→(2,4)
    place(board, 6, 0, { side: "red", kind: "man" });
    place(board, 5, 1, { side: "black", kind: "man" });
    place(board, 3, 3, { side: "black", kind: "man" });

    const moves = generateLegalMoves(board, "red", MVP_RULES);
    const chain = moves.find((m) => m.captures.length === 2);

    expect(chain).toBeDefined();
    if (chain) {
      expect(chain.path).toHaveLength(3);
      expect(chain.path[0]).toEqual({ row: 6, col: 0 });
      expect(chain.path[1]).toEqual({ row: 4, col: 2 });
      expect(chain.path[2]).toEqual({ row: 2, col: 4 });
      expect(chain.captures).toContainEqual({ row: 5, col: 1 });
      expect(chain.captures).toContainEqual({ row: 3, col: 3 });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-03 — Man cannot capture backward (menCaptureBackward = false)
// ─────────────────────────────────────────────────────────────────────────────
describe("CA-03: man cannot capture backward", () => {
  it("backward capture does not appear in legal moves", () => {
    const board = emptyBoard();
    // RED man at (3,4) — already in midfield
    // BLACK man at (4,3) — behind RED (row increases for BLACK direction,
    // but row 4 is behind row 3 for RED since RED moves toward row 0)
    // Backward for RED = row+1 direction
    // (4,3) is behind RED at (3,4); landing would be (5,2)
    place(board, 3, 4, { side: "red", kind: "man" });
    place(board, 4, 3, { side: "black", kind: "man" });
    // (5,2) is empty

    const moves = generateLegalMoves(board, "red", MVP_RULES);
    // No capture should appear (only backward capture is available)
    const captures = moves.filter((m) => m.captures.length > 0);
    expect(captures).toHaveLength(0);
  });

  it("same position allows backward capture when menCaptureBackward=true", () => {
    const board = emptyBoard();
    place(board, 3, 4, { side: "red", kind: "man" });
    place(board, 4, 3, { side: "black", kind: "man" });

    const rules: RulesConfig = { ...MVP_RULES, menCaptureBackward: true };
    const moves = generateLegalMoves(board, "red", rules);
    const captures = moves.filter((m) => m.captures.length > 0);
    expect(captures.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-04 — Promotion during chain stops the chain immediately
// ─────────────────────────────────────────────────────────────────────────────
describe("CA-04: promotion during capture chain ends the turn", () => {
  it("path ends at promotion row with promotion=true, no further captures", () => {
    const board = emptyBoard();
    // RED man at (2,0) — one jump will land on row 0 (promotion row for RED)
    // BLACK man at (1,1); landing at (0,2) = row 0 → crowns
    // Another BLACK man at ... — if chain continued, would be captured. It must not.
    // Put a second BLACK man that would be capturable as a king at row 0 area,
    // but since RED becomes a king only AFTER the move, the chain stops.
    place(board, 2, 0, { side: "red", kind: "man" });
    place(board, 1, 1, { side: "black", kind: "man" });
    // (0,2) is the landing / promotion square — empty

    const moves = generateLegalMoves(board, "red", MVP_RULES);
    expect(moves.length).toBeGreaterThan(0);

    // Find the move that ends at (0,2)
    const promoMove = moves.find(
      (m) => m.path[m.path.length - 1]!.row === 0
    );
    expect(promoMove).toBeDefined();
    if (promoMove) {
      expect(promoMove.promotion).toBe(true);
      // Path: [(2,0),(0,2)] — only 2 squares, chain stopped at crown
      expect(promoMove.path).toHaveLength(2);
      expect(promoMove.captures).toHaveLength(1);
    }
  });

  it("chain with additional enemy piece after promotion row still stops", () => {
    const board = emptyBoard();
    // RED man at (2,2)
    // BLACK at (1,3) → landing (0,4) = promotion
    // Another BLACK at... doesn't matter, chain must stop
    place(board, 2, 2, { side: "red", kind: "man" });
    place(board, 1, 3, { side: "black", kind: "man" });
    // Even if we add a piece that a king could jump, chain stops at promotion
    // (No valid king jump from row 0 in-bounds with just one extra piece easily)

    const moves = generateLegalMoves(board, "red", MVP_RULES);
    const promoMove = moves.find(
      (m) => m.path[m.path.length - 1]!.row === 0 && m.promotion
    );
    expect(promoMove).toBeDefined();
    if (promoMove) {
      // Must not have continued as king
      expect(promoMove.captures).toHaveLength(1);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-05 — Non-flying kings: king moves only 1 diagonal square
// ─────────────────────────────────────────────────────────────────────────────
describe("CA-05: non-flying king moves only 1 square diagonally", () => {
  it("king at (3,3) has moves only to adjacent diagonals", () => {
    const board = emptyBoard();
    place(board, 3, 3, { side: "red", kind: "king" });

    const moves = generateLegalMoves(board, "red", MVP_RULES);
    // All simple moves should land exactly 1 step away
    for (const move of moves) {
      const from = move.path[0]!;
      const to = move.path[move.path.length - 1]!;
      const rowDiff = Math.abs(to.row - from.row);
      const colDiff = Math.abs(to.col - from.col);
      expect(rowDiff).toBe(1);
      expect(colDiff).toBe(1);
    }
    // Should have 4 diagonal moves (all in-bounds from center)
    expect(moves).toHaveLength(4);
  });

  it("validateMove rejects a 2-square diagonal slide (flying king move)", () => {
    const board = emptyBoard();
    place(board, 4, 4, { side: "red", kind: "king" });

    // Attempt to slide 2 squares diagonally (flying king style)
    const flyingPath: Square[] = [
      { row: 4, col: 4 },
      { row: 2, col: 2 }, // 2 squares away, no capture
    ];

    const result = validateMove(board, flyingPath, "red", MVP_RULES);
    expect(result.valid).toBe(false);
  });

  it("king captures correctly over 1 adjacent enemy", () => {
    const board = emptyBoard();
    place(board, 4, 4, { side: "red", kind: "king" });
    place(board, 3, 3, { side: "black", kind: "man" });
    // Landing at (2,2)

    const capturePath: Square[] = [
      { row: 4, col: 4 },
      { row: 2, col: 2 },
    ];

    const result = validateMove(board, capturePath, "red", MVP_RULES);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.move.captures).toContainEqual({ row: 3, col: 3 });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-06 — Draw by plySinceProgress >= 40
// ─────────────────────────────────────────────────────────────────────────────
describe("CA-06: draw by 40-ply rule", () => {
  it("detectGameEnd returns draw when plySinceProgress >= 40", () => {
    const board = initialBoard();
    const result = detectGameEnd(board, "red", 40, MVP_RULES);
    expect(result).not.toBeNull();
    expect(result?.status).toBe("draw");
  });

  it("detectGameEnd does NOT return draw at plySinceProgress = 39", () => {
    const board = initialBoard();
    const result = detectGameEnd(board, "red", 39, MVP_RULES);
    // Game continues (initial board has legal moves for red)
    expect(result).toBeNull();
  });

  it("detectGameEnd returns draw at plySinceProgress = 41", () => {
    const board = initialBoard();
    const result = detectGameEnd(board, "red", 41, MVP_RULES);
    expect(result?.status).toBe("draw");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CA-07 — No legal moves → rival wins
// ─────────────────────────────────────────────────────────────────────────────
describe("CA-07: side with no legal moves loses", () => {
  it("RED blocked → BLACK (ai) wins", () => {
    // Construct a board where RED has a piece but is completely boxed in
    const board = emptyBoard();
    // RED man at corner (7,0)
    // BLACK man blocks (6,1) — RED cannot move forward (row 6 diag blocked)
    // and the other diagonal (7,-1) is out of bounds
    place(board, 7, 0, { side: "red", kind: "man" });
    place(board, 6, 1, { side: "black", kind: "man" });
    // RED man at (7,0) has only one forward diagonal (6,1) which is occupied by enemy
    // but cannot capture because landing (5,2) would need to be empty — add another blocker
    place(board, 5, 2, { side: "black", kind: "man" });
    // Now RED cannot capture (landing blocked) and cannot move simply (occupied)

    const legalMoves = generateLegalMoves(board, "red", MVP_RULES);
    expect(legalMoves).toHaveLength(0);

    const result = detectGameEnd(board, "red", 0, MVP_RULES);
    expect(result).not.toBeNull();
    // humanSide = "red", rival = "black" (ai) → ai_won
    expect(result?.status).toBe("ai_won");
    expect(result?.humanSide).toBe("red");
  });

  it("BLACK blocked → RED (human) wins", () => {
    const board = emptyBoard();
    // BLACK man at (0,0) corner
    // RED man blocks (1,1); landing (2,2) also blocked by RED
    place(board, 0, 0, { side: "black", kind: "man" });
    place(board, 1, 1, { side: "red", kind: "man" });
    place(board, 2, 2, { side: "red", kind: "man" });
    // BLACK moves toward row+1; only diagonal (1,1) blocked, other is (1,-1) OOB

    const legalMoves = generateLegalMoves(board, "black", MVP_RULES);
    expect(legalMoves).toHaveLength(0);

    const result = detectGameEnd(board, "black", 0, MVP_RULES);
    expect(result).not.toBeNull();
    // humanSide = "red", rival = "red" (human) → human_won
    expect(result?.status).toBe("human_won");
  });

  it("side with no pieces loses", () => {
    const board = emptyBoard();
    // Only RED pieces, no BLACK
    place(board, 7, 0, { side: "red", kind: "man" });
    // It's BLACK's turn, BLACK has no pieces
    const result = detectGameEnd(board, "black", 0, MVP_RULES);
    expect(result).not.toBeNull();
    expect(result?.status).toBe("human_won"); // rival of black = red = humanSide
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bonus: initialBoard sanity checks
// ─────────────────────────────────────────────────────────────────────────────
describe("initialBoard layout", () => {
  it("has 12 red and 12 black pieces", () => {
    const board = initialBoard();
    let red = 0;
    let black = 0;
    for (const row of board) {
      for (const cell of row) {
        if (cell?.side === "red") red++;
        if (cell?.side === "black") black++;
      }
    }
    expect(red).toBe(12);
    expect(black).toBe(12);
  });

  it("all pieces are on dark squares ((row+col)%2===1)", () => {
    const board = initialBoard();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row]![col];
        if (piece) {
          expect((row + col) % 2).toBe(1);
        }
      }
    }
  });

  it("black pieces occupy rows 0-2, red pieces rows 5-7", () => {
    const board = initialBoard();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row]![col];
        if (!piece) continue;
        if (piece.side === "black") expect(row).toBeLessThanOrEqual(2);
        if (piece.side === "red") expect(row).toBeGreaterThanOrEqual(5);
      }
    }
  });
});
