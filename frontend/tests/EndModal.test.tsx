import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { EndModal } from "../src/components/ui/EndModal";

function props(overrides: Partial<React.ComponentProps<typeof EndModal>> = {}) {
  return {
    status: "human_won" as const,
    onPlayAgain: vi.fn(),
    onViewLeaderboard: vi.fn(),
    ...overrides,
  };
}

describe("EndModal", () => {
  it("no renderiza nada cuando la partida sigue en progreso", () => {
    const { container } = render(<EndModal {...props({ status: "in_progress" })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra '¡Victoria!' cuando el humano gana", () => {
    render(<EndModal {...props({ status: "human_won" })} />);
    expect(screen.getByText("¡Victoria!")).toBeInTheDocument();
  });

  it("muestra 'Derrota' cuando gana la IA", () => {
    render(<EndModal {...props({ status: "ai_won" })} />);
    expect(screen.getByText("Derrota")).toBeInTheDocument();
  });

  it("muestra 'Empate' en tablas", () => {
    render(<EndModal {...props({ status: "draw" })} />);
    expect(screen.getByText("Empate")).toBeInTheDocument();
  });

  it("expone semántica de diálogo modal accesible", () => {
    render(<EndModal {...props({ status: "human_won" })} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("'Jugar de nuevo' invoca onPlayAgain", () => {
    const onPlayAgain = vi.fn();
    render(<EndModal {...props({ status: "ai_won", onPlayAgain })} />);
    fireEvent.click(screen.getByText("Jugar de nuevo"));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it("'Ver ranking' invoca onViewLeaderboard", () => {
    const onViewLeaderboard = vi.fn();
    render(<EndModal {...props({ status: "draw", onViewLeaderboard })} />);
    fireEvent.click(screen.getByText("Ver ranking"));
    expect(onViewLeaderboard).toHaveBeenCalledTimes(1);
  });
});
