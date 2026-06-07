import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Board } from "../src/components/Board";
import type { Board as BoardType, Move, Square } from "@damas/shared";

// ---------------------------------------------------------------------------
// Helpers to build board fixtures
// ---------------------------------------------------------------------------

function emptyBoard(): BoardType {
  return Array.from({ length: 8 }, () => Array(8).fill(null) as (null)[]);
}

/**
 * Returns a minimal board with:
 *  - A red man at (5,2)  ← human piece (bottom-left area)
 *  - A black man at (0,0) ← AI piece (irrelevant for most tests)
 */
function basicBoard(): BoardType {
  const b = emptyBoard();
  b[5]![2] = { side: "red", kind: "man" };
  b[0]![0] = { side: "black", kind: "man" };
  return b;
}

/**
 * A legal move for the red piece at (5,2) → (4,3).
 */
function simpleLegalMoves(): Move[] {
  return [
    {
      path: [
        { row: 5, col: 2 },
        { row: 4, col: 3 },
      ],
      captures: [],
      promotion: false,
    },
    {
      path: [
        { row: 5, col: 2 },
        { row: 4, col: 1 },
      ],
      captures: [],
      promotion: false,
    },
  ];
}

// ---------------------------------------------------------------------------
// Default props factory
// ---------------------------------------------------------------------------

function defaultProps(
  overrides: Partial<React.ComponentProps<typeof Board>> = {}
): React.ComponentProps<typeof Board> {
  return {
    board: basicBoard(),
    humanSide: "red",
    currentTurn: "red",
    gameStatus: "in_progress",
    onMoveSend: vi.fn().mockResolvedValue(undefined),
    legalMoves: simpleLegalMoves(),
    isAiThinking: false,
    lastAiMove: undefined,
    illegalMoveError: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Board", () => {
  it("renderiza 64 casillas", () => {
    render(<Board {...defaultProps()} />);
    const squares = screen.getAllByTestId(/^square-/);
    expect(squares).toHaveLength(64);
  });

  it("al hacer click en una pieza propia con movimientos legales se resaltan casillas destino", async () => {
    render(<Board {...defaultProps()} />);

    // Click on the red piece at (5,2). Board renders rows reversed for red side,
    // but the data-testid still uses actual row/col.
    const pieceSquare = screen.getByTestId("square-5-2");
    fireEvent.click(pieceSquare);

    // After selecting the piece, destination squares (4,3) and (4,1) should
    // have a highlight dot rendered inside them. We verify by checking the
    // destination squares exist and their background style changed via
    // the highlight dot child element.
    await waitFor(() => {
      const dest1 = screen.getByTestId("square-4-3");
      const dest2 = screen.getByTestId("square-4-1");
      // Destination dot is rendered as a child div when highlighted and empty
      expect(dest1.children.length).toBeGreaterThan(0);
      expect(dest2.children.length).toBeGreaterThan(0);
    });
  });

  it("envío de movimiento con respuesta 200: onMoveSend se llama con el path correcto", async () => {
    const onMoveSend = vi.fn().mockResolvedValue(undefined);
    render(<Board {...defaultProps({ onMoveSend })} />);

    // Select piece at (5,2)
    fireEvent.click(screen.getByTestId("square-5-2"));

    // Click destination (4,3)
    await waitFor(() => {
      expect(screen.getByTestId("square-4-3")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("square-4-3"));

    await waitFor(() => {
      expect(onMoveSend).toHaveBeenCalledTimes(1);
      expect(onMoveSend).toHaveBeenCalledWith([
        { row: 5, col: 2 },
        { row: 4, col: 3 },
      ] satisfies Square[]);
    });
  });

  it("cuando hay un illegalMoveError muestra 'Movimiento ilegal'", () => {
    render(<Board {...defaultProps({ illegalMoveError: "Movimiento ilegal" })} />);
    expect(screen.getByText("Movimiento ilegal")).toBeInTheDocument();
  });

  it("cuando isAiThinking=true muestra 'IA pensando'", () => {
    render(<Board {...defaultProps({ isAiThinking: true, currentTurn: "black" })} />);
    expect(screen.getByText(/IA pensando/)).toBeInTheDocument();
  });
});
