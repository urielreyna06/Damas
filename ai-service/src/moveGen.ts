import type { Board, Side, Piece, Square, Move } from "../../packages/shared/src/types.ts";
import type { AiMoveRequest } from "../../packages/shared/src/types.ts";

// ─── Board helpers ────────────────────────────────────────────────────────────

export function initialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null) as (Piece | null)[]);
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) {
        if (row <= 2) {
          board[row]![col] = { side: "black", kind: "man" };
        } else if (row >= 5) {
          board[row]![col] = { side: "red", kind: "man" };
        }
      }
    }
  }
  return board;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row <= 7 && col >= 0 && col <= 7;
}

function opponent(side: Side): Side {
  return side === "red" ? "black" : "red";
}

// ─── Capture chain (recursive) ───────────────────────────────────────────────

interface CaptureState {
  board: Board;
  pos: Square;
  path: Square[];
  captures: Square[];
}

function captureDirections(piece: Piece, rules: AiMoveRequest["rules"]): [number, number][] {
  const dirs: [number, number][] = [];
  if (piece.kind === "king" || piece.side === "red") {
    dirs.push([-1, -1], [-1, 1]); // forward for red (decreasing row)
  }
  if (piece.kind === "king" || piece.side === "black") {
    dirs.push([1, -1], [1, 1]); // forward for black (increasing row)
  }
  if (rules.menCaptureBackward && piece.kind === "man") {
    // backward directions already covered if king; add explicit backward for men
    if (piece.side === "red") dirs.push([1, -1], [1, 1]);
    if (piece.side === "black") dirs.push([-1, -1], [-1, 1]);
  }
  // Deduplicate
  const seen = new Set<string>();
  return dirs.filter(([dr, dc]) => {
    const key = `${dr},${dc}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildCaptures(
  state: CaptureState,
  piece: Piece,
  rules: AiMoveRequest["rules"],
  results: Move[]
): void {
  const { board, pos, path, captures } = state;
  const dirs = captureDirections(piece, rules);
  let foundAny = false;

  for (const [dr, dc] of dirs) {
    const midRow = pos.row + dr;
    const midCol = pos.col + dc;
    const landRow = pos.row + dr * 2;
    const landCol = pos.col + dc * 2;

    if (!inBounds(midRow, midCol) || !inBounds(landRow, landCol)) continue;

    const mid = board[midRow]![midCol];
    const land = board[landRow]![landCol];

    if (!mid || mid.side !== opponent(piece.side)) continue;
    if (land !== null) continue;

    // Avoid recapturing the same square in this chain
    if (captures.some((c) => c.row === midRow && c.col === midCol)) continue;

    foundAny = true;

    // Apply capture on a temporary board
    const nextBoard = cloneBoard(board);
    nextBoard[midRow]![midCol] = null;
    nextBoard[pos.row]![pos.col] = null;
    nextBoard[landRow]![landCol] = piece;

    const landSquare: Square = { row: landRow, col: landCol };
    const newPath = [...path, landSquare];
    const newCaptures = [...captures, { row: midRow, col: midCol }];

    // Check for promotion (a man reaching its back row crowns and ENDS the
    // chain — CA-04). Kings never re-promote and keep capturing, matching the
    // backend arbiter (moveGenerator.ts) so the two engines agree.
    const promoted =
      piece.kind === "man" &&
      ((piece.side === "red" && landRow === 0) ||
        (piece.side === "black" && landRow === 7));

    if (promoted) {
      results.push({ path: newPath, captures: newCaptures, promotion: true });
    } else {
      // Try to continue the chain
      const nextState: CaptureState = { board: nextBoard, pos: landSquare, path: newPath, captures: newCaptures };
      const before = results.length;
      buildCaptures(nextState, piece, rules, results);
      if (results.length === before) {
        // No further captures — this is a terminal node
        results.push({ path: newPath, captures: newCaptures, promotion: false });
      }
    }
  }

  // If foundAny is false and captures > 0, the caller detects no new results were added.
  void foundAny;
}

// ─── Simple moves (no captures) ──────────────────────────────────────────────

function moveDirections(piece: Piece): [number, number][] {
  if (piece.kind === "king") return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  if (piece.side === "red") return [[-1, -1], [-1, 1]];
  return [[1, -1], [1, 1]];
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function generateLegalMoves(
  board: Board,
  side: Side,
  rules: AiMoveRequest["rules"]
): Move[] {
  const captures: Move[] = [];
  const quietMoves: Move[] = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row]![col];
      if (!piece || piece.side !== side) continue;

      const from: Square = { row, col };

      // Collect captures
      const pieceCaps: Move[] = [];
      buildCaptures({ board, pos: from, path: [from], captures: [] }, piece, rules, pieceCaps);
      captures.push(...pieceCaps);

      // Collect quiet moves (only if no captures — we'll filter later)
      for (const [dr, dc] of moveDirections(piece)) {
        const toRow = row + dr;
        const toCol = col + dc;
        if (!inBounds(toRow, toCol)) continue;
        if (board[toRow]![toCol] !== null) continue;

        const to: Square = { row: toRow, col: toCol };
        // Only men promote; a king on its back row is not re-crowned (matches
        // the backend arbiter so move metadata stays in lockstep).
        const promoted =
          piece.kind === "man" &&
          ((piece.side === "red" && toRow === 0) ||
            (piece.side === "black" && toRow === 7));
        quietMoves.push({ path: [from, to], captures: [], promotion: promoted });
      }
    }
  }

  // Capture is mandatory
  if (captures.length > 0) return captures;
  return quietMoves;
}

export function applyMove(board: Board, move: Move): Board {
  const next = cloneBoard(board);
  const from = move.path[0]!;
  const to = move.path[move.path.length - 1]!;
  const piece = next[from.row]![from.col]!;

  // Remove captures
  for (const cap of move.captures) {
    next[cap.row]![cap.col] = null;
  }

  // Move piece
  next[from.row]![from.col] = null;

  if (move.promotion) {
    next[to.row]![to.col] = { side: piece.side, kind: "king" };
  } else {
    next[to.row]![to.col] = piece;
  }

  return next;
}
