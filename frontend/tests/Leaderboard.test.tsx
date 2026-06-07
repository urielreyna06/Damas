import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Leaderboard } from "../src/components/Leaderboard";
import type { LeaderboardEntry } from "@damas/shared";

function entry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    _id: "e1",
    clerkUserId: "u1",
    displayName: "Alex",
    gameId: "g1",
    movementsToWin: 18,
    gameDurationMs: 125_000, // 2:05
    difficulty: "easy",
    endedAt: new Date("2026-06-01T10:00:00Z").toISOString(),
    ...overrides,
  };
}

describe("Leaderboard", () => {
  it("muestra un estado vacío cuando no hay entradas", () => {
    render(<Leaderboard entries={[]} difficulty="hard" />);
    expect(screen.getByText(/Aún no hay partidas ganadas/)).toBeInTheDocument();
    expect(screen.getByText(/Difícil/)).toBeInTheDocument();
  });

  it("renderiza una fila por entrada con nombre y movimientos", () => {
    const entries = [
      entry({ _id: "a", displayName: "Ana", movementsToWin: 12 }),
      entry({ _id: "b", displayName: "Beto", movementsToWin: 15 }),
    ];
    render(<Leaderboard entries={entries} difficulty="easy" />);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Beto")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("formatea la duración como M:SS", () => {
    render(<Leaderboard entries={[entry({ gameDurationMs: 125_000 })]} difficulty="easy" />);
    expect(screen.getByText("2:05")).toBeInTheDocument();
  });

  it("destaca el top-3 con la clase lb-top", () => {
    const entries = [
      entry({ _id: "1", displayName: "P1" }),
      entry({ _id: "2", displayName: "P2" }),
      entry({ _id: "3", displayName: "P3" }),
      entry({ _id: "4", displayName: "P4" }),
    ];
    const { container } = render(<Leaderboard entries={entries} difficulty="medium" />);
    const topRows = container.querySelectorAll("tr.lb-top");
    expect(topRows).toHaveLength(3);
  });
});
