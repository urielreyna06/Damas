import type { Board, Side, Move, Difficulty } from "../../packages/shared/src/types.ts";
import type { AiMoveRequest } from "../../packages/shared/src/types.ts";
import { generateLegalMoves, applyMove } from "./moveGen.ts";
import { evaluate, type HeuristicWeights, DEFAULT_WEIGHTS } from "./heuristic.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MinimaxResult {
  move: Move;
  score: number;
  depth: number;
}

const MAX_DEPTH: Record<Difficulty, number> = {
  easy: 2,
  medium: 4,
  hard: 6,
};

function opponent(side: Side): Side {
  return side === "red" ? "black" : "red";
}

// ─── Move ordering: captures first ───────────────────────────────────────────

function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => b.captures.length - a.captures.length);
}

// ─── Alpha-beta ───────────────────────────────────────────────────────────────

let deadline = 0;
let timedOut = false;

function alphaBeta(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  sideToMove: Side,
  rootSide: Side,
  rules: AiMoveRequest["rules"],
  weights: HeuristicWeights
): number {
  if (timedOut) return 0;
  if (Date.now() > deadline) {
    timedOut = true;
    return 0;
  }

  const moves = generateLegalMoves(board, sideToMove, rules);

  if (moves.length === 0) {
    // Current side has no moves → loss for that side
    // If sideToMove === rootSide → bad for us (maximizer)
    return sideToMove === rootSide ? -Infinity : Infinity;
  }

  if (depth === 0) {
    return evaluate(board, rootSide, weights);
  }

  const ordered = orderMoves(moves);

  if (maximizing) {
    let best = -Infinity;
    for (const move of ordered) {
      if (timedOut) break;
      const next = applyMove(board, move);
      const score = alphaBeta(next, depth - 1, alpha, beta, false, opponent(sideToMove), rootSide, rules, weights);
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break; // beta cutoff
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of ordered) {
      if (timedOut) break;
      const next = applyMove(board, move);
      const score = alphaBeta(next, depth - 1, alpha, beta, true, opponent(sideToMove), rootSide, rules, weights);
      if (score < best) best = score;
      if (best < beta) beta = best;
      if (beta <= alpha) break; // alpha cutoff
    }
    return best;
  }
}

// ─── findBestMove with iterative deepening ────────────────────────────────────

export function findBestMove(
  board: Board,
  sideToMove: Side,
  difficulty: Difficulty,
  rules: AiMoveRequest["rules"],
  timeLimitMs = 1800,
  weights: HeuristicWeights = DEFAULT_WEIGHTS
): MinimaxResult {
  const maxDepth = MAX_DEPTH[difficulty];
  deadline = Date.now() + timeLimitMs;
  timedOut = false;

  const rootMoves = generateLegalMoves(board, sideToMove, rules);
  if (rootMoves.length === 0) {
    throw new Error("No legal moves available");
  }

  // Default result (depth 0): just pick first move
  let bestResult: MinimaxResult = {
    move: rootMoves[0]!,
    score: -Infinity,
    depth: 0,
  };

  // Iterative deepening
  for (let depth = 1; depth <= maxDepth; depth++) {
    if (Date.now() > deadline) break;

    timedOut = false;
    const ordered = orderMoves(rootMoves);
    let bestMove: Move = ordered[0]!;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    for (const move of ordered) {
      if (timedOut || Date.now() > deadline) {
        timedOut = true;
        break;
      }
      const next = applyMove(board, move);
      const score = alphaBeta(next, depth - 1, alpha, beta, false, opponent(sideToMove), sideToMove, rules, weights);
      if (!timedOut && score > bestScore) {
        bestScore = score;
        bestMove = move;
        if (bestScore > alpha) alpha = bestScore;
      }
    }

    if (!timedOut) {
      // Complete iteration — update best result
      bestResult = { move: bestMove, score: bestScore, depth };
    }
    // If timed out mid-iteration, keep previous complete result
  }

  return bestResult;
}
