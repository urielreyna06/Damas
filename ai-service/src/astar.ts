import type { Board, Side, Move, Difficulty } from "../../packages/shared/src/types.ts";
import type { AiMoveRequest } from "../../packages/shared/src/types.ts";
import { generateLegalMoves, applyMove } from "./moveGen.ts";
import { evaluate, type HeuristicWeights, DEFAULT_WEIGHTS } from "./heuristic.ts";

export interface AStarResult {
  move: Move;
  score: number;
  depth: number;
}

// A* best-first search for checkers move selection.
//
// easy:   1-ply greedy + 30% random noise to make it beatable.
// medium: 1-ply greedy (always picks highest-scored move).
// hard:   multi-ply A* — open list ordered by heuristic, node budget 1000, max depth 4.
// expert: multi-ply A* — node budget 2500, max depth 6.
//
// hard/expert use single-agent best-first expansion: all successors (ours AND opponent's)
// are scored from the AI perspective and enqueued by that score. This is A* without
// adversarial alternation — distinct from minimax / alpha-beta / Monte Carlo.
export function findBestMoveAstar(
  board: Board,
  sideToMove: Side,
  difficulty: Difficulty,
  rules: AiMoveRequest["rules"],
  weights: HeuristicWeights = DEFAULT_WEIGHTS
): AStarResult {
  const moves = generateLegalMoves(board, sideToMove, rules);
  if (moves.length === 0) throw new Error("No legal moves available");

  // Score every immediate (1-ply) move from the AI's perspective.
  const firstPly = moves.map((move) => {
    const nextBoard = applyMove(board, move);
    return { move, nextBoard, score: evaluate(nextBoard, sideToMove, weights) };
  });

  if (difficulty === "easy") {
    if (Math.random() < 0.3) {
      const i = Math.floor(Math.random() * firstPly.length);
      return { move: firstPly[i]!.move, score: firstPly[i]!.score, depth: 1 };
    }
    const best = firstPly.reduce((a, b) => (b.score > a.score ? b : a));
    return { move: best.move, score: best.score, depth: 1 };
  }

  if (difficulty === "medium") {
    const best = firstPly.reduce((a, b) => (b.score > a.score ? b : a));
    return { move: best.move, score: best.score, depth: 1 };
  }

  // ── Multi-ply A* for hard / expert ──────────────────────────────────────────
  // Open list: candidate search states ordered by heuristic score (f = h, g = 0).
  // rootIdx tracks which initial move each node descended from, allowing us to
  // report the best root move after the search budget is exhausted.
  const maxNodes = difficulty === "hard" ? 1000 : 2500;
  const maxDepth = difficulty === "hard" ? 4 : 6;
  const oppSide: Side = sideToMove === "red" ? "black" : "red";

  interface OpenNode {
    board: Board;
    rootIdx: number;
    score: number;
    depth: number;
    side: Side;
  }

  // Best heuristic score discovered per root move (initialised to 1-ply scores).
  const bestByRoot: number[] = firstPly.map((fp) => fp.score);

  const open: OpenNode[] = firstPly.map((fp, idx) => ({
    board: fp.nextBoard,
    rootIdx: idx,
    score: fp.score,
    depth: 1,
    side: oppSide,
  }));

  let expanded = open.length;

  while (open.length > 0 && expanded < maxNodes) {
    // Pop node with highest heuristic score (greedy best-first = A* with h only).
    let topIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i]!.score > open[topIdx]!.score) topIdx = i;
    }
    const node = open.splice(topIdx, 1)[0]!;

    if (node.depth >= maxDepth) continue;

    const childMoves = generateLegalMoves(node.board, node.side, rules);
    if (childMoves.length === 0) continue;

    const nextSide: Side = node.side === "red" ? "black" : "red";

    for (const childMove of childMoves) {
      const nextBoard = applyMove(node.board, childMove);
      // Always evaluate from the AI's perspective (sideToMove).
      const childScore = evaluate(nextBoard, sideToMove, weights);

      if (childScore > bestByRoot[node.rootIdx]!) {
        bestByRoot[node.rootIdx] = childScore;
      }

      open.push({
        board: nextBoard,
        rootIdx: node.rootIdx,
        score: childScore,
        depth: node.depth + 1,
        side: nextSide,
      });
      expanded++;
    }
  }

  // Return root move with the best score found across the search.
  let bestRoot = 0;
  for (let i = 1; i < bestByRoot.length; i++) {
    if (bestByRoot[i]! > bestByRoot[bestRoot]!) bestRoot = i;
  }

  return { move: moves[bestRoot]!, score: bestByRoot[bestRoot]!, depth: maxDepth };
}
