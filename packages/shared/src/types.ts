// ============================================================
// Tipos base del tablero
// ============================================================

/** Color/bando. El humano siempre es RED por convención. */
export type Side = "red" | "black";

export type PieceKind = "man" | "king";

export interface Piece {
  side: Side;
  kind: PieceKind;
}

/** Coordenada. row 0 = lado BLACK, row 7 = lado RED. */
export interface Square {
  row: number; // 0..7
  col: number; // 0..7
}

/** Estado del tablero. null = casilla vacía o clara. */
export type Board = (Piece | null)[][]; // [row][col]

// ============================================================
// Movimientos
// ============================================================

/**
 * Movimiento simple: path = [from, to].
 * Cadena de captura: path = [from, paso1, paso2, ..., final].
 */
export interface Move {
  path: Square[];
  captures: Square[]; // casillas de fichas capturadas (orden de captura)
  promotion: boolean; // true si el movimiento corona un peón
}

export interface MoveRecord {
  ply: number; // 0-indexed, global por partida
  side: Side;
  byAI: boolean;
  move: Move;
  resultingBoard: Board;
  createdAt: string; // ISO 8601
  thinkMs?: number; // tiempo de cómputo si byAI=true
}

// ============================================================
// Partida
// ============================================================

export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type GameStatus =
  | "in_progress"
  | "human_won"
  | "ai_won"
  | "draw"
  | "abandoned";

export interface Game {
  _id: string;
  clerkUserId: string;
  humanSide: Side; // "red" por defecto
  difficulty: Difficulty;
  status: GameStatus;
  board: Board; // estado actual del tablero
  turn: Side;
  moves: MoveRecord[]; // historial completo embebido
  humanMoveCount: number; // métrica para ranking
  plySinceProgress: number; // para regla de tablas (reset en captura/coronación)
  startedAt: string; // ISO 8601 — fijado por el backend
  endedAt?: string; // ISO 8601 — fijado por el backend al terminar
  durationMs?: number; // endedAt - startedAt
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Usuario (espejo mínimo de Clerk)
// ============================================================

export interface User {
  _id: string;
  clerkUserId: string; // único — FK lógica hacia Clerk
  displayName: string;
  stripeCustomerId?: string;
  activeThemeId?: string; // skin activa seleccionada por el usuario
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Skins (marketplace single-seller)
// ============================================================

export type ThemeKind = "pieces" | "board" | "bundle";

export interface Theme {
  _id: string;
  name: string;
  description: string;
  kind: ThemeKind;
  tag?: string; // display label (e.g. "Warm", "Cyberpunk", "Fantasy")
  priceUsdCents: number; // precio en centavos USD
  stripePriceId: string; // ID del Price en Stripe
  boardLightColor?: string;
  boardDarkColor?: string;
  redPieceAsset?: string;
  blackPieceAsset?: string;
  previewImageUrl?: string;
  createdAt: string;
}

/** Desbloqueo individual de una skin para un usuario. */
export interface UserSkin {
  _id: string;
  clerkUserId: string;
  themeId: string;
  stripePaymentIntentId: string; // trazabilidad del pago
  purchasedAt: string;
}

// ============================================================
// Leaderboard (segmentado por dificultad)
// ============================================================

export interface LeaderboardEntry {
  _id: string;
  clerkUserId: string;
  displayName: string;
  gameId: string;
  movementsToWin: number; // métrica primaria (asc)
  gameDurationMs: number; // desempate 1 (asc)
  difficulty: Difficulty; // segmentación del ranking
  endedAt: string; // desempate final (asc)
}

// ============================================================
// Contrato del AI Service (stateless)
// ============================================================

export interface AiMoveRequest {
  board: Board;
  sideToMove: Side;
  difficulty: Difficulty;
  rules: {
    menCaptureBackward: boolean; // MVP: false
    flyingKings: boolean; // MVP: false
    forceMaximumCapture: boolean; // MVP: false
  };
}

export interface AiMoveResponse {
  move: Move;
  evaluation: number; // score heurístico perspectiva sideToMove
  depthSearched: number;
  thinkMs: number;
}

// ============================================================
// Respuestas de API
// ============================================================

export interface ApiError {
  code: string;
  message: string;
}

export interface MoveResponse {
  game: Game;
  lastAiMove?: MoveRecord;
}
