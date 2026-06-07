import type { Difficulty } from "@damas/shared";

const LABELS: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
};

const CLASS: Record<Difficulty, string> = {
  easy: "badge badge-easy",
  medium: "badge badge-medium",
  hard: "badge badge-hard",
};

/** Color-coded difficulty pill (green / amber / red). */
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={CLASS[difficulty]}>
      <span className="dot" />
      {LABELS[difficulty]}
    </span>
  );
}

export const difficultyLabel = (d: Difficulty) => LABELS[d];
