import { useMemo } from "react";
import { resolveSkin, skinStyle, type Skin } from "../../lib/skins";

interface StaticBoardProps {
  /** Backend theme id, or a design skin id directly. */
  themeId?: string | null;
  /** Or pass a resolved skin directly (skips resolution). */
  skin?: Skin;
  mini?: boolean;
}

type Cell = { side: "human" | "ai"; king?: boolean } | null;

function initialPosition(): Cell[][] {
  const b: Cell[][] = Array.from({ length: 8 }, () => Array<Cell>(8).fill(null));
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 !== 1) continue;
      if (r <= 2) b[r]![c] = { side: "ai" };
      else if (r >= 5) b[r]![c] = { side: "human" };
    }
  }
  return b;
}

/**
 * Non-interactive board preview used in the landing hero, shop cards, and
 * profile. Renders the initial position with the given skin's disc colors.
 */
export function StaticBoard({ themeId, skin: skinProp, mini = false }: StaticBoardProps) {
  const skin = skinProp ?? resolveSkin(themeId);
  const board = useMemo(initialPosition, []);

  return (
    <div
      className={`dboard${mini ? " mini" : ""}`}
      data-skin={skin.dataSkin}
      style={skinStyle(skin)}
      aria-hidden="true"
    >
      <div className="dboard-grid">
        {board.flatMap((rowArr, row) =>
          rowArr.map((cell, col) => {
            const isDark = (row + col) % 2 === 1;
            return (
              <div key={`${row}-${col}`} className={`sq ${isDark ? "dark" : "light"}`}>
                {cell && (
                  <div className={`piece ${cell.side}`} data-finish="glossy">
                    <span className="disc" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
