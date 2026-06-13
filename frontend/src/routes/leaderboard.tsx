import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getLeaderboard } from "../lib/api";
import { Leaderboard } from "../components/Leaderboard";
import type { LeaderboardEntry, Difficulty } from "@damas/shared";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];
const DIFF_LABEL: Record<Difficulty, string> = { easy: "Fácil", medium: "Medio", hard: "Difícil", expert: "Experto" };

function LeaderboardPage() {
  const [tab, setTab] = useState<Difficulty>("easy");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadEntries(tab);
  }, [tab]);

  async function loadEntries(difficulty: Difficulty) {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard(difficulty, 20);
      setEntries(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el ranking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrap page fade-in" style={{ maxWidth: 760 }}>
      <div className="stack gap-8" style={{ marginBottom: 24 }}>
        <span className="eyebrow">Clasificación</span>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 44px)" }}>Ranking global</h1>
        <p className="muted">
          Los mejores tiempos por dificultad. Solo cuentan las victorias contra la IA;
          el desempate es por número de movimientos y luego por tiempo.
        </p>
      </div>

      {/* Difficulty tabs (radiogroup semantics) */}
      <div
        role="radiogroup"
        aria-label="Filtrar ranking por dificultad"
        className="row gap-8"
        style={{ marginBottom: 22 }}
      >
        {DIFFICULTIES.map((d) => {
          const selected = tab === d;
          return (
            <button
              key={d}
              role="radio"
              aria-checked={selected}
              onClick={() => setTab(d)}
              className={`btn btn-sm ${selected ? "btn-gold" : "btn-ghost"}`}
            >
              {DIFF_LABEL[d]}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="badge badge-hard" style={{ marginBottom: 16, padding: "8px 14px" }}>
          <span className="dot" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="card card-pad stack gap-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 28 }} />
          ))}
        </div>
      ) : (
        <Leaderboard entries={entries} difficulty={tab} />
      )}
    </div>
  );
}
