import type { LeaderboardEntry, Difficulty } from "@damas/shared";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  difficulty: Difficulty;
}

const DIFF_LABEL: Record<Difficulty, string> = { easy: "Fácil", medium: "Medio", hard: "Difícil" };

const MEDAL: Record<number, { color: string; ring: string }> = {
  1: { color: "#F4CB5E", ring: "rgba(227,178,60,.45)" }, // gold
  2: { color: "#C8CDD6", ring: "rgba(200,205,214,.4)" }, // silver
  3: { color: "#D7975B", ring: "rgba(215,151,91,.4)" },  // bronze
};

export function Leaderboard({ entries, difficulty }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="card card-pad" style={{ textAlign: "center", padding: 56 }}>
        <p className="muted">
          Aún no hay partidas ganadas en dificultad {DIFF_LABEL[difficulty]}.
        </p>
        <p className="muted-2" style={{ fontSize: 13.5, marginTop: 6 }}>
          Gana una partida para aparecer aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <table className="lb-table">
        <thead>
          <tr>
            <th style={{ width: 64 }}>#</th>
            <th>Jugador</th>
            <th style={{ textAlign: "center" }}>Mov.</th>
            <th style={{ textAlign: "center" }}>Tiempo</th>
            <th style={{ textAlign: "center" }}>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, idx) => {
            const rank = idx + 1;
            const medal = MEDAL[rank];
            return (
              <tr key={entry._id} className={medal ? "lb-top" : ""}>
                <td>
                  <span
                    className="lb-rank"
                    style={
                      medal
                        ? { color: medal.color, boxShadow: `inset 0 0 0 1px ${medal.ring}` }
                        : undefined
                    }
                  >
                    {rank}
                  </span>
                </td>
                <td style={{ fontWeight: medal ? 600 : 400 }}>{entry.displayName}</td>
                <td style={{ textAlign: "center" }} className="mono">{entry.movementsToWin}</td>
                <td style={{ textAlign: "center" }} className="mono">{formatDuration(entry.gameDurationMs)}</td>
                <td style={{ textAlign: "center" }} className="muted-2">
                  {new Date(entry.endedAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style>{`
        .lb-table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
        .lb-table thead th {
          text-align: left; padding: 14px 18px; font-size: 12px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase; color: var(--muted-2);
          border-bottom: 1px solid var(--line);
        }
        .lb-table tbody td { padding: 13px 18px; border-bottom: 1px solid var(--line); }
        .lb-table tbody tr:last-child td { border-bottom: none; }
        .lb-table tbody tr { transition: background .15s; }
        .lb-table tbody tr:hover { background: var(--bg-2); }
        .lb-table tbody tr.lb-top { background: var(--gold-soft); }
        .lb-table tbody tr.lb-top:hover { background: rgba(227,178,60,.2); }
        .lb-rank {
          display: inline-grid; place-items: center; width: 30px; height: 30px;
          border-radius: 50%; background: var(--bg-2); font-weight: 700; font-size: 13.5px;
        }
      `}</style>
    </div>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
