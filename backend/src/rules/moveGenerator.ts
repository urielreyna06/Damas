import type { Board, Side, Square, Move, Piece, PieceKind } from "../../../packages/shared/src/types.ts";

export interface RulesConfig {
  menCaptureBackward: boolean;
  flyingKings: boolean;
  forceMaximumCapture: boolean;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row <= 7 && col >= 0 && col <= 7;
}

function pieceAt(board: Board, sq: Square): Piece | null {
  return board[sq.row]?.[sq.col] ?? null;
}

/** Deep-clone a board (only 8×8 entries needed) */
function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

/** Forward direction (row delta) for a given side */
function forwardDelta(side: Side): number {
  return side === "red" ? -1 : 1;
}

/** Promotion row for a given side */
function promotionRow(side: Side): number {
  return side === "red" ? 0 : 7;
}

// ─── capture chain DFS ───────────────────────────────────────────────────────

interface ChainState {
  board: Board;         // board with already-captured pieces removed
  pos: Square;          // current position of the jumping piece
  captured: Square[];   // squares captured so far (in order)
  path: Square[];       // path traversed so far
  promoted: boolean;    // whether the piece has crowned during this chain
}

function generateCaptureChains(
  board: Board,
  startPos: Square,
  piece: Piece,
  rules: RulesConfig
): Move[] {
  const results: Move[] = [];

  function dfs(state: ChainState): void {
    const { board: b, pos, captured, path, promoted } = state;

    // Determine which directions are allowed for captures
    const diagonals: Array<[number, number]> = [];
    if (piece.kind === "king" || promoted) {
      // Kings can capture in all 4 diagonals
      diagonals.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    } else {
      // Man: forward direction only (unless menCaptureBackward)
      const fwd = forwardDelta(piece.side);
      diagonals.push([fwd, -1], [fwd, 1]);
      if (rules.menCaptureBackward) {
        const bwd = -fwd;
        diagonals.push([bwd, -1], [bwd, 1]);
      }
    }

    let foundCapture = false;

    for (const [dr, dc] of diagonals) {
      const midRow = pos.row + dr;
      const midCol = pos.col + dc;
      const landRow = pos.row + dr * 2;
      const landCol = pos.col + dc * 2;

      if (!inBounds(midRow, midCol) || !inBounds(landRow, landCol)) continue;

      const midPiece = b[midRow]?.[midCol] ?? null;
      const landPiece = b[landRow]?.[landCol] ?? null;

      // Mid must be an enemy piece not already captured in this chain
      if (!midPiece || midPiece.side === piece.side) continue;
      // Landing square must be empty
      if (landPiece !== null) continue;

      foundCapture = true;

      const midSq: Square = { row: midRow, col: midCol };
      const landSq: Square = { row: landRow, col: landCol };

      // Build new board state: move piece, remove captured piece
      const newBoard = cloneBoard(b);
      newBoard[landRow]![landCol] = newBoard[pos.row]![pos.col] ?? null;
      newBoard[pos.row]![pos.col] = null;
      newBoard[midRow]![midCol] = null;

      // Check for promotion
      const promoRow = promotionRow(piece.side);
      const crownsNow = !promoted && piece.kind === "man" && landRow === promoRow;
      if (crownsNow) {
        newBoard[landRow]![landCol] = { side: piece.side, kind: "king" };
      }

      const newPath = [...path, landSq];
      const newCaptured = [...captured, midSq];

      if (crownsNow) {
        // Coronation during chain → stop immediately, record this move
        results.push({
          path: newPath,
          captures: newCaptured,
          promotion: true,
        });
      } else {
        // Continue DFS for multi-jump
        dfs({
          board: newBoard,
          pos: landSq,
          captured: newCaptured,
          path: newPath,
          promoted: promoted,
        });
      }
    }

    // If no further capture found but we have already captured at least one piece → record
    if (!foundCapture && captured.length > 0) {
      // Check for promotion at end of chain (piece landed at promo row without crowning mid-chain)
      const promoRow = promotionRow(piece.side);
      const promotesAtEnd = piece.kind === "man" && !promoted && pos.row === promoRow;
      results.push({
        path,
        captures: captured,
        promotion: promotesAtEnd,
      });
    }
  }

  dfs({
    board,
    pos: startPos,
    captured: [],
    path: [startPos],
    promoted: false,
  });

  return results;
}

// ─── simple (non-capture) moves ──────────────────────────────────────────────

function generateSimpleMoves(board: Board, pos: Square, piece: Piece): Move[] {
  const moves: Move[] = [];
  const dirs: Array<[number, number]> =
    piece.kind === "king"
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : [[forwardDelta(piece.side), -1], [forwardDelta(piece.side), 1]];

  for (const [dr, dc] of dirs) {
    const r = pos.row + dr;
    const c = pos.col + dc;
    if (!inBounds(r, c)) continue;
    if ((board[r]?.[c] ?? null) !== null) continue;

    const to: Square = { row: r, col: c };
    const promoRow = promotionRow(piece.side);
    const promotion = piece.kind === "man" && r === promoRow;
    moves.push({ path: [pos, to], captures: [], promotion });
  }

  return moves;
}

// ─── public API ──────────────────────────────────────────────────────────────

export function generateLegalMoves(board: Board, side: Side, rules: RulesConfig): Move[] {
  const captures: Move[] = [];
  const simples: Move[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row]?.[col] ?? null;
      if (!piece || piece.side !== side) continue;

      const pos: Square = { row, col };
      const caps = generateCaptureChains(board, pos, piece, rules);
      captures.push(...caps);

      if (caps.length === 0) {
        simples.push(...generateSimpleMoves(board, pos, piece));
      }
    }
  }

  // Mandatory capture: if any capture exists, only return captures
  if (captures.length > 0) return captures;
  return simples;
}

export function applyMove(board: Board, move: Move): { newBoard: Board; progress: boolean } {
  const newBoard = cloneBoard(board);
  const from = move.path[0]!;
  const to = move.path[move.path.length - 1]!;
  let piece = newBoard[from.row]![from.col]!;

  // Remove piece from origin
  newBoard[from.row]![from.col] = null;

  // Remove captured pieces
  for (const cap of move.captures) {
    newBoard[cap.row]![cap.col] = null;
  }

  // Handle promotion
  if (move.promotion && piece.kind === "man") {
    piece = { side: piece.side, kind: "king" };
  }

  // Place piece at destination
  newBoard[to.row]![to.col] = piece;

  const progress = move.captures.length > 0 || move.promotion;
  return { newBoard, progress };
}

export function initialBoard(): Board {
  // Create empty 8×8 board
  const board: Board = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null)
  );

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      // Dark squares: (row + col) % 2 === 1
      if ((row + col) % 2 !== 1) continue;

      if (row <= 2) {
        // Rows 0-2: BLACK pieces
        board[row]![col] = { side: "black", kind: "man" };
      } else if (row >= 5) {
        // Rows 5-7: RED pieces
        board[row]![col] = { side: "red", kind: "man" };
      }
    }
  }

  return board;
}
