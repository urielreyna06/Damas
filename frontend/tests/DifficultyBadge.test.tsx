import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DifficultyBadge, difficultyLabel } from "../src/components/ui/DifficultyBadge";

describe("DifficultyBadge", () => {
  it("renderiza 'Fácil' con la clase badge-easy", () => {
    const { container } = render(<DifficultyBadge difficulty="easy" />);
    expect(screen.getByText("Fácil")).toBeInTheDocument();
    expect(container.querySelector(".badge-easy")).toBeTruthy();
  });

  it("renderiza 'Medio' con la clase badge-medium", () => {
    const { container } = render(<DifficultyBadge difficulty="medium" />);
    expect(screen.getByText("Medio")).toBeInTheDocument();
    expect(container.querySelector(".badge-medium")).toBeTruthy();
  });

  it("renderiza 'Difícil' con la clase badge-hard", () => {
    const { container } = render(<DifficultyBadge difficulty="hard" />);
    expect(screen.getByText("Difícil")).toBeInTheDocument();
    expect(container.querySelector(".badge-hard")).toBeTruthy();
  });

  it("difficultyLabel mapea cada dificultad a su etiqueta en español", () => {
    expect(difficultyLabel("easy")).toBe("Fácil");
    expect(difficultyLabel("medium")).toBe("Medio");
    expect(difficultyLabel("hard")).toBe("Difícil");
  });
});
