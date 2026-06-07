import type { Piece as PieceType } from "@damas/shared";

interface ActiveTheme {
  redPieceAsset?: string;
  blackPieceAsset?: string;
}

interface PieceProps {
  piece: PieceType;
  isSelected: boolean;
  isLastMoved: boolean;
  /** Retained for API compatibility; skin look is driven by board CSS vars. */
  activeTheme?: ActiveTheme;
  finish?: "glossy" | "matte" | "flat";
}

/**
 * A checker disc. The human side (red) and AI side (black) take their colors
 * from the active skin's CSS custom properties (--h1/--h2/--hk, --a1/--a2/--ak),
 * applied on the board wrapper. See styles/board.css and lib/skins.ts.
 */
export function Piece({ piece, isSelected, isLastMoved, finish = "glossy" }: PieceProps) {
  const side = piece.side === "red" ? "human" : "ai";
  const cls = ["piece", side];
  if (isSelected) cls.push("sel");
  if (isLastMoved) cls.push("lastmoved");

  return (
    <div className={cls.join(" ")} data-finish={finish} aria-label={`${piece.side} ${piece.kind}`}>
      <span className="disc">
        {piece.kind === "king" && (
          <span className="crown" aria-hidden="true">
            ♛
          </span>
        )}
      </span>
    </div>
  );
}
