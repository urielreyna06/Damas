import { useState, useCallback, useMemo, useEffect } from "react";
import type { Board as BoardType, Move, Square, GameStatus, Side, MoveRecord } from "@damas/shared";
import { Piece } from "./Piece";
import { resolveSkin, skinStyle } from "../lib/skins";

interface ActiveTheme {
  redPieceAsset?: string;
  blackPieceAsset?: string;
}

interface BoardProps {
  board: BoardType;
  humanSide: Side;
  currentTurn: Side;
  gameStatus: GameStatus;
  onMoveSend: (path: Square[]) => Promise<void>;
  legalMoves: Move[];
  isAiThinking: boolean;
  lastAiMove?: MoveRecord;
  illegalMoveError?: string | null;
  /** Retained for API compatibility (asset-based themes). */
  activeTheme?: ActiveTheme;
  /** Backend theme `_id` used to resolve the board skin. */
  themeId?: string | null;
}

export function Board({
  board,
  humanSide,
  currentTurn,
  gameStatus,
  onMoveSend,
  legalMoves,
  isAiThinking,
  lastAiMove,
  illegalMoveError,
  themeId,
}: BoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPath, setPendingPath] = useState<Square[]>([]);

  const skin = useMemo(() => resolveSkin(themeId), [themeId]);

  const [boardShaking, setBoardShaking] = useState(false);
  useEffect(() => {
    if (!illegalMoveError) return;
    setBoardShaking(true);
    const t = setTimeout(() => setBoardShaking(false), 440);
    return () => clearTimeout(t);
  }, [illegalMoveError]);

  // Squares the human can move *from*
  const movableOrigins = useMemo<Set<string>>(() => {
    if (currentTurn !== humanSide || gameStatus !== "in_progress") return new Set();
    const origins = new Set<string>();
    legalMoves.forEach((m) => {
      const from = m.path[0];
      if (from) origins.add(sqKey(from));
    });
    return origins;
  }, [legalMoves, currentTurn, humanSide, gameStatus]);

  // Destination squares for the current selection/path
  const highlightedDestinations = useMemo<Set<string>>(() => {
    if (!selectedSquare) return new Set();
    const current = pendingPath.length > 0 ? pendingPath : [selectedSquare];
    const dests = new Set<string>();
    legalMoves.forEach((m) => {
      if (pathStartsWith(m.path, current) && m.path.length > current.length) {
        const next = m.path[current.length];
        if (next) dests.add(sqKey(next));
      }
    });
    return dests;
  }, [selectedSquare, pendingPath, legalMoves]);

  // Squares that were part of the last AI move
  const lastAiMoveSquares = useMemo<Set<string>>(() => {
    if (!lastAiMove) return new Set();
    return new Set(lastAiMove.move.path.map(sqKey));
  }, [lastAiMove]);

  const handleSquareClick = useCallback(
    async (row: number, col: number) => {
      if (isAiThinking) return;
      if (gameStatus !== "in_progress") return;
      if (currentTurn !== humanSide) return;

      const clicked: Square = { row, col };
      const key = sqKey(clicked);

      // If clicking on a legal origin (own piece with moves) — select it
      if (movableOrigins.has(key) && pendingPath.length === 0) {
        setSelectedSquare(clicked);
        setPendingPath([clicked]);
        return;
      }

      // If a piece is already selected
      if (selectedSquare) {
        const currentPath = pendingPath.length > 0 ? pendingPath : [selectedSquare];

        // Check if clicked is a valid next step
        if (highlightedDestinations.has(key)) {
          const newPath = [...currentPath, clicked];

          // Check if there are further capture steps from here
          const hasFurtherSteps = legalMoves.some(
            (m) => pathStartsWith(m.path, newPath) && m.path.length > newPath.length
          );

          // Check if newPath matches a complete legal move
          const isComplete = legalMoves.some(
            (m) => m.path.length === newPath.length && pathStartsWith(m.path, newPath)
          );

          if (hasFurtherSteps && !isComplete) {
            // Continue building multi-capture path
            setPendingPath(newPath);
          } else if (isComplete) {
            // Submit the move
            setSelectedSquare(null);
            setPendingPath([]);
            await onMoveSend(newPath);
          }
          return;
        }

        // Clicking on another own piece — reselect
        if (movableOrigins.has(key)) {
          setSelectedSquare(clicked);
          setPendingPath([clicked]);
          return;
        }

        // Clicking elsewhere — deselect
        setSelectedSquare(null);
        setPendingPath([]);
      }
    },
    [
      isAiThinking,
      gameStatus,
      currentTurn,
      humanSide,
      selectedSquare,
      pendingPath,
      movableOrigins,
      highlightedDestinations,
      legalMoves,
      onMoveSend,
    ]
  );

  // Rows from white's (red's) perspective: row 7 at bottom for red
  const rows = humanSide === "red" ? [0, 1, 2, 3, 4, 5, 6, 7].reverse() : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div style={{ position: "relative" }}>
      {/* Illegal-move toast */}
      {illegalMoveError && (
        <div
          role="alert"
          style={{
            position: "absolute",
            top: -52,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 30,
          }}
        >
          <span className="badge badge-hard" style={{ padding: "8px 14px", fontSize: 13.5 }}>
            <span className="dot" />
            {illegalMoveError}
          </span>
        </div>
      )}

      <div className={`dboard${boardShaking ? " board-shake" : ""}`} data-skin={skin.dataSkin} style={skinStyle(skin)}>
        {/* AI thinking overlay */}
        {isAiThinking && (
          <div className="board-overlay">
            <span className="thinking-pill">
              <span className="thinking-dot" />
              IA pensando…
            </span>
          </div>
        )}

        <div
          className="dboard-grid"
          data-testid="checkers-board"
        >
          {rows.flatMap((row) =>
            [0, 1, 2, 3, 4, 5, 6, 7].map((col) => {
              const isDark = (row + col) % 2 === 1;
              const piece = board[row]?.[col] ?? null;
              const key = sqKey({ row, col });
              const isSelected =
                selectedSquare !== null &&
                selectedSquare.row === row &&
                selectedSquare.col === col;
              const isHighlighted = highlightedDestinations.has(key);
              const isLastAi = lastAiMoveSquares.has(key);
              const isInPendingPath = pendingPath.some((s) => s.row === row && s.col === col);
              const isClickable = isDark && (movableOrigins.has(key) || isHighlighted);

              const cls = ["sq", isDark ? "dark" : "light"];
              if (isInPendingPath || isSelected) cls.push("selsq");
              if (isLastAi) cls.push("lastto");
              if (isClickable) cls.push("clickable");

              return (
                <div
                  key={`${row}-${col}`}
                  data-testid={`square-${row}-${col}`}
                  className={cls.join(" ")}
                  onClick={() => void handleSquareClick(row, col)}
                >
                  {piece && (
                    <Piece
                      piece={piece}
                      isSelected={isSelected}
                      isLastMoved={isLastAi}
                    />
                  )}
                  {/* Destination hint (child element — RTL tests assert its presence) */}
                  {isHighlighted && !piece && <div className="hint-dot" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Helpers
function sqKey(s: Square): string {
  return `${s.row},${s.col}`;
}

function pathStartsWith(path: Square[], prefix: Square[]): boolean {
  if (path.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (path[i]!.row !== prefix[i]!.row || path[i]!.col !== prefix[i]!.col) return false;
  }
  return true;
}
