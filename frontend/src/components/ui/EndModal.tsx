import { useState } from "react";
import type { GameStatus } from "@damas/shared";

interface EndModalProps {
  status: GameStatus;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
}

const COPY: Record<string, { eyebrow: string; title: string; sub: string; color: string }> = {
  human_won: {
    eyebrow: "Resultado",
    title: "¡Victoria!",
    sub: "Venciste a la máquina. Tu partida quedó registrada en el ranking.",
    color: "var(--green)",
  },
  ai_won: {
    eyebrow: "Resultado",
    title: "Derrota",
    sub: "La IA se llevó esta. Ajusta tu estrategia y vuelve a intentarlo.",
    color: "var(--red)",
  },
  draw: {
    eyebrow: "Resultado",
    title: "Empate",
    sub: "Ninguno cedió terreno. Una partida muy reñida.",
    color: "var(--gold)",
  },
  abandoned: {
    eyebrow: "Resultado",
    title: "Partida abandonada",
    sub: "Saliste de la partida.",
    color: "var(--muted)",
  },
};

/** End-of-game modal: Victory / Defeat / Draw with CTAs. */
export function EndModal({ status, onPlayAgain, onViewLeaderboard }: EndModalProps) {
  const [dismissed, setDismissed] = useState(false);
  if (status === "in_progress" || dismissed) return null;
  const copy = COPY[status] ?? COPY.draw!;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      onClick={(e) => { if (e.target === e.currentTarget) setDismissed(true); }}
    >
      <div className="modal">
        <button
          aria-label="Cerrar"
          onClick={() => setDismissed(true)}
          style={{
            position: "absolute", top: 14, right: 16,
            background: "none", border: "none", cursor: "pointer",
            color: "var(--muted)", fontSize: 22, lineHeight: 1, padding: 4,
          }}
        >
          ×
        </button>
        <div className="eyebrow">{copy.eyebrow}</div>
        <h2 className="serif" style={{ fontSize: 40, marginTop: 10, color: copy.color }}>
          {copy.title}
        </h2>
        <p className="muted" style={{ marginTop: 12, marginBottom: 28 }}>
          {copy.sub}
        </p>
        <div className="stack gap-12">
          <button className="btn btn-gold btn-lg btn-block" onClick={onPlayAgain}>
            Jugar de nuevo
          </button>
          <button className="btn btn-ghost btn-block" onClick={onViewLeaderboard}>
            Ver ranking
          </button>
        </div>
      </div>
    </div>
  );
}
