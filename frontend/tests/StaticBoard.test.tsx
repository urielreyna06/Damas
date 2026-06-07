import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StaticBoard } from "../src/components/ui/StaticBoard";

describe("StaticBoard", () => {
  it("renderiza 64 casillas", () => {
    const { container } = render(<StaticBoard themeId={null} />);
    expect(container.querySelectorAll(".sq")).toHaveLength(64);
  });

  it("renderiza 24 fichas en la posición inicial (12 por bando)", () => {
    const { container } = render(<StaticBoard themeId={null} />);
    expect(container.querySelectorAll(".piece")).toHaveLength(24);
    expect(container.querySelectorAll(".piece.human")).toHaveLength(12);
    expect(container.querySelectorAll(".piece.ai")).toHaveLength(12);
  });

  it("aplica el data-skin correcto según el theme id del backend", () => {
    const { container } = render(<StaticBoard themeId="neon_glow" />);
    expect(container.querySelector('[data-skin="neon"]')).toBeTruthy();
  });

  it("es decorativo (aria-hidden)", () => {
    const { container } = render(<StaticBoard themeId={null} />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
});
