import type { Board, Side } from "../../../packages/shared/src/types.ts";
import { generateLegalMoves, type RulesConfig } from "./moveGenerator.ts";

/**
 * Detects whether the game has ended after the most recent move.
 * `currentTurn` is the side that must play NOW (after the move was applied).
 * Returns null if the game is still in progress.
 *
 * humanSide is always "red" per PRD convention.
 */
export function detectGameEnd(
  board: Board,
  currentTurn: Side,
  plySinceProgress: number,
  rules: RulesConfig
): { status: "human_won" | "ai_won" | "draw"; humanSide: Side } | null {
  const humanSide: Side = "red";

  // Draw by 40-ply rule
  if (plySinceProgress >= 40) {
    return { status: "draw", humanSide };
  }

  // Count pieces for the current turn side
  let pieceCount = 0;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row]?.[col] ?? null;
      if (piece && piece.side === currentTurn) pieceCount++;
    }
  }

  // No pieces left → current turn side loses
  if (pieceCount === 0) {
    const rival: Side = currentTurn === "red" ? "black" : "red";
    return {
      status: rival === humanSide ? "human_won" : "ai_won",
      humanSide,
    };
  }

  // No legal moves → current turn side loses (blocked)
  const legalMoves = generateLegalMoves(board, currentTurn, rules);
  if (legalMoves.length === 0) {
    const rival: Side = currentTurn === "red" ? "black" : "red";
    return {
      status: rival === humanSide ? "human_won" : "ai_won",
      humanSide,
    };
  }

  return null;
}
