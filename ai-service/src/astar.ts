import type { Board, Side, Move } from "../../packages/shared/src/types.ts";
import type { AiMoveRequest } from "../../packages/shared/src/types.ts";
import { generateLegalMoves, applyMove } from "./moveGen.ts";
import { evaluate, type HeuristicWeights, DEFAULT_WEIGHTS } from "./heuristic.ts";

export interface AStarResult {
  move: Move;
  score: number;
  depth: 1;
}

// 1-ply greedy best-first search.
// easy: 30% random mistake to make it beatable.
// medium: pure greedy (always picks highest-scored move).
export function findBestMoveAstar(
  board: Board,
  sideToMove: Side,
  difficulty: "easy" | "medium",
  rules: AiMoveRequest["rules"],
  weights: HeuristicWeights = DEFAULT_WEIGHTS
): AStarResult {
  const moves = generateLegalMoves(board, sideToMove, rules);
  if (moves.length === 0) throw new Error("No legal moves available");

  const scored = moves.map((move) => ({
    move,
    score: evaluate(applyMove(board, move), sideToMove, weights),
  }));

  if (difficulty === "easy" && Math.random() < 0.3) {
    const idx = Math.floor(Math.random() * scored.length);
    return { move: scored[idx]!.move, score: scored[idx]!.score, depth: 1 };
  }

  const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
  return { move: best.move, score: best.score, depth: 1 };
}
