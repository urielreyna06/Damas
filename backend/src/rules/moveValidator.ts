import type { Board, Side, Square, Move } from "../../../packages/shared/src/types.ts";
import { generateLegalMoves, type RulesConfig } from "./moveGenerator.ts";

/**
 * Validates a path submitted by the client against the current board state.
 * Returns the full Move if valid, or an error message.
 */
export function validateMove(
  board: Board,
  path: Square[],
  side: Side,
  rules: RulesConfig
): { valid: true; move: Move } | { valid: false; error: string } {
  if (path.length < 2) {
    return { valid: false, error: "Path must have at least 2 squares." };
  }

  const legalMoves = generateLegalMoves(board, side, rules);

  const match = legalMoves.find((m) => {
    if (m.path.length !== path.length) return false;
    return m.path.every(
      (sq, i) => sq.row === path[i]!.row && sq.col === path[i]!.col
    );
  });

  if (match) {
    return { valid: true, move: match };
  }

  // Provide a more helpful error message
  const hasCaptures = legalMoves.some((m) => m.captures.length > 0);
  if (hasCaptures) {
    return {
      valid: false,
      error: "Illegal move: a capture is available and must be played.",
    };
  }

  return { valid: false, error: "Illegal move: path does not match any legal move." };
}
