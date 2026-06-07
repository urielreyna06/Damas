import type { Board, Side } from "../../packages/shared/src/types.ts";
import type { AiMoveRequest } from "../../packages/shared/src/types.ts";
import { generateLegalMoves } from "./moveGen.ts";

// ─── Weights ──────────────────────────────────────────────────────────────────

export interface HeuristicWeights {
  manValue: number;
  kingValue: number;
  w1: number; // material difference
  w2: number; // king count difference
  w3: number; // center control
  w4: number; // man advancement
  w5: number; // exposure to capture
}

export const DEFAULT_WEIGHTS: HeuristicWeights = {
  manValue: 100,
  kingValue: 175,
  w1: 1.0,
  w2: 0.5,
  w3: 10,
  w4: 2,
  w5: 50,
};

// Central squares: rows 3-4, cols 2-5
function isCentral(row: number, col: number): boolean {
  return row >= 3 && row <= 4 && col >= 2 && col <= 5;
}

function opponent(side: Side): Side {
  return side === "red" ? "black" : "red";
}

// ─── Evaluate ─────────────────────────────────────────────────────────────────

export function evaluate(board: Board, sideToMove: Side, weights: HeuristicWeights = DEFAULT_WEIGHTS): number {
  let propiasMaterial = 0;
  let rivalMaterial = 0;
  let propiasDamas = 0;
  let rivalDamas = 0;
  let controlCentro = 0;
  let avancePropias = 0;
  let exposicion = 0;

  const rival = opponent(sideToMove);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row]![col];
      if (!piece) continue;

      const isOwn = piece.side === sideToMove;
      const value = piece.kind === "king" ? weights.kingValue : weights.manValue;

      if (isOwn) {
        propiasMaterial += value;
        if (piece.kind === "king") propiasDamas++;
        if (isCentral(row, col)) controlCentro++;
        if (piece.kind === "man") {
          avancePropias += sideToMove === "red" ? 7 - row : row;
        }
      } else {
        rivalMaterial += value;
        if (piece.kind === "king") rivalDamas++;
      }
    }
  }

  // Exposure: count own pieces that can be captured by rival on next turn
  // We generate all rival captures and collect landing squares
  const rules: AiMoveRequest["rules"] = {
    menCaptureBackward: false,
    flyingKings: false,
    forceMaximumCapture: false,
  };
  const rivalCaptures = generateLegalMoves(board, rival, rules).filter(
    (m) => m.captures.length > 0
  );

  const capturedSquares = new Set<string>();
  for (const m of rivalCaptures) {
    for (const cap of m.captures) {
      capturedSquares.add(`${cap.row},${cap.col}`);
    }
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row]![col];
      if (piece && piece.side === sideToMove) {
        if (capturedSquares.has(`${row},${col}`)) {
          exposicion++;
        }
      }
    }
  }

  return (
    weights.w1 * (propiasMaterial - rivalMaterial) +
    weights.w2 * (propiasDamas - rivalDamas) +
    weights.w3 * controlCentro +
    weights.w4 * avancePropias -
    weights.w5 * exposicion
  );
}
