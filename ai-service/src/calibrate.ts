/**
 * INV-02 — Calibración heurística vía auto-juego (v2)
 *
 * Rediseño tras observar que la v1 producía W0 L0 D2 en todas las iteraciones:
 *  - Problema 1: DRAW_PLY_LIMIT=40 + W5=50 (exposición) → ambas IAs evitan capturas
 *    → tablas inmediatas. Solución: eliminar la regla de tablas por progreso en calibración.
 *  - Problema 2: hard (depth 6) compensa pesos malos con búsqueda → señal nula.
 *    Solución: usar easy (depth 2) donde la calidad del heurístico domina.
 *  - Problema 3: ±20% perturbaciones demasiado pequeñas. Solución: [×2, ×0.5, ×1.5, ×0.67].
 *  - Fix extra: desempate por piezas cuando se alcanza MAX_PLIES.
 *
 * Uso: bun run src/calibrate.ts
 *      (o dentro del contenedor: bun run /app/ai-service/src/calibrate.ts)
 */

import type { Board, Side } from "../../packages/shared/src/types.ts";
import { generateLegalMoves, applyMove } from "./moveGen.ts";
import { findBestMove } from "./minimax.ts";
import { DEFAULT_WEIGHTS, type HeuristicWeights } from "./heuristic.ts";

// ─── Config ───────────────────────────────────────────────────────────────────

const RULES = {
  menCaptureBackward: false,
  flyingKings: false,
  forceMaximumCapture: false,
} as const;

// easy (depth 2): máxima sensibilidad a la calidad del heurístico.
// Los pesos mejorados a depth 2 se transfieren a depth 4/6 porque afectan
// todos los nodos hoja por igual.
const DIFFICULTY = "easy" as const;

const TIME_LIMIT_MS = 200;
const MAX_PLIES = 600;      // límite de seguridad
const GAMES_PER_PAIRING = 4; // 2 como red + 2 como black → comparación justa
const ITERATIONS = 40;
const ACCEPT_THRESHOLD = 0.55; // score promedio > 55% → aceptar candidato

// Perturbaciones más agresivas: ciclo de 4 factores por cada peso
const FACTORS = [2.0, 0.5, 1.5, 0.67];

// ─── Tablero inicial ──────────────────────────────────────────────────────────

function initialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () =>
    Array.from<null>({ length: 8 }).fill(null)
  );
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 !== 1) continue;
      if (row <= 2) board[row]![col] = { side: "black", kind: "man" };
      else if (row >= 5) board[row]![col] = { side: "red", kind: "man" };
    }
  }
  return board;
}

// ─── Conteo de piezas ─────────────────────────────────────────────────────────

function countPieces(board: Board, side: Side): number {
  let n = 0;
  for (let row = 0; row < 8; row++)
    for (let col = 0; col < 8; col++)
      if (board[row]![col]?.side === side) n++;
  return n;
}

// ─── Detección de fin de partida (SIN la regla de tablas por progreso) ────────
// La regla de 40 plies se omite deliberadamente en calibración: con W5 alto
// ambas IAs la activan de inmediato y no produce señal útil.

type GameResult = Side | "draw";

function checkGameOver(board: Board, currentTurn: Side): GameResult | null {
  // Sin piezas → pierde el turno actual
  if (countPieces(board, currentTurn) === 0)
    return currentTurn === "red" ? "black" : "red";

  // Sin movimientos legales → pierde el turno actual
  if (generateLegalMoves(board, currentTurn, RULES).length === 0)
    return currentTurn === "red" ? "black" : "red";

  return null;
}

// ─── Una partida AI vs AI ─────────────────────────────────────────────────────

function runGame(
  weightsRed: HeuristicWeights,
  weightsBlack: HeuristicWeights
): GameResult {
  let board = initialBoard();
  let turn: Side = "red";

  for (let ply = 0; ply < MAX_PLIES; ply++) {
    const over = checkGameOver(board, turn);
    if (over !== null) return over;

    const weights = turn === "red" ? weightsRed : weightsBlack;
    const { move } = findBestMove(board, turn, DIFFICULTY, RULES, TIME_LIMIT_MS, weights);

    board = applyMove(board, move);
    turn = turn === "red" ? "black" : "red";
  }

  // Desempate por piezas cuando se alcanza MAX_PLIES
  const red = countPieces(board, "red");
  const black = countPieces(board, "black");
  if (red > black) return "red";
  if (black > red) return "black";
  return "draw";
}

// ─── Score de una partida (1=win, 0.5=draw, 0=loss) ──────────────────────────

function gameScore(result: GameResult, candidateSide: Side): number {
  if (result === candidateSide) return 1;
  if (result === "draw") return 0.5;
  return 0;
}

// ─── Comparar dos conjuntos de pesos (GAMES_PER_PAIRING partidas) ─────────────

interface MatchResult {
  score: number;     // promedio de [0,1]
  detail: string;    // "W2 D1 L1" etc.
}

function matchup(candidate: HeuristicWeights, base: HeuristicWeights): MatchResult {
  let totalScore = 0;
  let wins = 0, draws = 0, losses = 0;

  for (let g = 0; g < GAMES_PER_PAIRING; g++) {
    const candidateSide: Side = g < GAMES_PER_PAIRING / 2 ? "red" : "black";
    const result =
      candidateSide === "red"
        ? runGame(candidate, base)
        : runGame(base, candidate);

    const s = gameScore(result, candidateSide);
    totalScore += s;
    if (s === 1) wins++;
    else if (s === 0.5) draws++;
    else losses++;
  }

  return {
    score: totalScore / GAMES_PER_PAIRING,
    detail: `W${wins} D${draws} L${losses}`,
  };
}

// ─── Hill-climbing ────────────────────────────────────────────────────────────

function hillClimb(base: HeuristicWeights, iterations: number): HeuristicWeights {
  let current = { ...base };
  const keys = Object.keys(current) as (keyof HeuristicWeights)[];
  let improved = 0;

  for (let i = 0; i < iterations; i++) {
    const key = keys[i % keys.length]!;
    const factor = FACTORS[Math.floor(i / keys.length) % FACTORS.length]!;
    const newVal = Math.max(0.01, current[key] * factor);
    const candidate: HeuristicWeights = { ...current, [key]: newVal };

    const start = Date.now();
    const { score, detail } = matchup(candidate, current);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const accepted = score > ACCEPT_THRESHOLD;

    console.log(
      `[${String(i + 1).padStart(2)}/${iterations}] ${key.padEnd(9)} ` +
        `×${factor.toFixed(2)} → ${newVal.toFixed(2).padStart(7)} | ` +
        `${detail} score=${score.toFixed(2)} | ` +
        `${elapsed}s${accepted ? " ✓ ACCEPTED" : ""}`
    );

    if (accepted) {
      current = candidate;
      improved++;
    }
  }

  console.log(`\nMejoras aceptadas: ${improved}/${iterations}`);
  return current;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("═══════════════════════════════════════════════════════");
console.log(" INV-02 — Calibración heurística v2");
console.log("═══════════════════════════════════════════════════════");
console.log(
  `Dificultad: ${DIFFICULTY} (depth 2) | Time/move: ${TIME_LIMIT_MS}ms | ` +
    `Iteraciones: ${ITERATIONS} | ${GAMES_PER_PAIRING} partidas/pareja`
);
console.log("Sin regla de tablas por progreso (para señal más limpia)");
console.log("\nPesos base:");
console.log(JSON.stringify(DEFAULT_WEIGHTS, null, 2));
console.log("\nEjecutando hill-climbing...\n");

const t0 = Date.now();
const best = hillClimb(DEFAULT_WEIGHTS, ITERATIONS);
const totalMin = ((Date.now() - t0) / 60000).toFixed(1);

console.log("\n═══════════════════════════════════════════════════════");
console.log(` Calibración terminada en ${totalMin} min`);
console.log("═══════════════════════════════════════════════════════");
console.log("\nMejores pesos encontrados:");
console.log(JSON.stringify(best, null, 2));

if (JSON.stringify(best) !== JSON.stringify(DEFAULT_WEIGHTS)) {
  console.log("\nValidación final: mejores pesos vs base (6 partidas)...");
  let fw = 0, fd = 0, fl = 0;
  for (let g = 0; g < 6; g++) {
    const side: Side = g < 3 ? "red" : "black";
    const r = side === "red" ? runGame(best, DEFAULT_WEIGHTS) : runGame(DEFAULT_WEIGHTS, best);
    const s = gameScore(r, side);
    if (s === 1) fw++;
    else if (s === 0.5) fd++;
    else fl++;
  }
  console.log(`Resultado final: W${fw} D${fd} L${fl}`);
  if (fw > fl) {
    console.log("✓ Los nuevos pesos superan al baseline.");
    console.log("\nActualiza DEFAULT_WEIGHTS en heuristic.ts con estos valores.");
  } else {
    console.log("⚠ Los nuevos pesos no superan claramente al baseline.");
  }
} else {
  console.log("\nNo se encontraron mejoras sobre los pesos base.");
}
