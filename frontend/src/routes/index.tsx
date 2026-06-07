import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth, SignInButton } from "@clerk/tanstack-start";
import { useState } from "react";
import { createGame } from "../lib/api";
import { StaticBoard } from "../components/ui/StaticBoard";
import type { Difficulty } from "@damas/shared";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const DIFFICULTIES: { id: Difficulty; name: string; desc: string }[] = [
  { id: "easy", name: "Fácil", desc: "IA casual, perfecta para aprender los fundamentos." },
  { id: "medium", name: "Medio", desc: "IA táctica con búsqueda media. Te pondrá a prueba." },
  { id: "hard", name: "Difícil", desc: "Minimax con búsqueda profunda. Casi imbatible." },
];

function LandingPage() {
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<Difficulty | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleStart(difficulty: Difficulty) {
    if (!isSignedIn) return; // signed-out users see the sign-in CTA instead
    setLoading(difficulty);
    setError(null);
    try {
      const token = await getToken();
      const game = await createGame(difficulty, token ?? undefined);
      await navigate({ to: "/play/$gameId", params: { gameId: game._id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la partida.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="wrap page fade-in">
      {/* Hero */}
      <section className="hero">
        <div className="stack gap-16">
          <span className="eyebrow">Damas · Player vs IA</span>
          <h1 style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1.05 }}>
            Entrena tu mente.<br />
            <span style={{ color: "var(--gold)" }}>Vence a la máquina.</span>
          </h1>
          <p className="muted" style={{ fontSize: 17, maxWidth: 460 }}>
            Damas inglesas 8×8 contra una IA con tres niveles de dificultad.
            Sube en el ranking, desbloquea skins y domina el tablero.
          </p>

          {error && (
            <div className="badge badge-hard" style={{ alignSelf: "flex-start", padding: "8px 14px" }}>
              <span className="dot" />
              {error}
            </div>
          )}

          <div className="row gap-12 wrap-w" style={{ marginTop: 8 }}>
            {isSignedIn ? (
              <button
                className="btn btn-gold btn-lg"
                onClick={() => void handleStart("medium")}
                disabled={loading !== null}
              >
                {loading ? "Creando partida…" : "Jugar ahora"}
              </button>
            ) : (
              <SignInButton mode="modal">
                <button className="btn btn-gold btn-lg">Iniciar sesión y jugar</button>
              </SignInButton>
            )}
            <button className="btn btn-ghost btn-lg" onClick={() => navigate({ to: "/leaderboard" })}>
              Ver ranking
            </button>
          </div>
        </div>

        {/* Decorative board */}
        <div className="hero-board">
          <StaticBoard themeId={null} />
        </div>
      </section>

      {/* Difficulty selector */}
      <section style={{ marginTop: 72 }}>
        <div className="row between" style={{ marginBottom: 20 }}>
          <h2 className="serif" style={{ fontSize: 28 }}>Elige tu desafío</h2>
        </div>
        <div className="diff-grid">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              className="diff-card"
              data-diff={d.id}
              onClick={() => void handleStart(d.id)}
              disabled={loading !== null}
              aria-label={`Jugar en dificultad ${d.name}`}
            >
              <span className={`badge badge-${d.id}`}>
                <span className="dot" />
                {d.name}
              </span>
              <div className="diff-name">{d.name}</div>
              <div className="diff-desc">{d.desc}</div>
              <div className="muted-2" style={{ marginTop: 16, fontSize: 13.5, fontWeight: 600 }}>
                {loading === d.id ? "Creando…" : isSignedIn ? "Empezar →" : "Inicia sesión para jugar"}
              </div>
            </button>
          ))}
        </div>
      </section>

      <style>{`
        .hero {
          display: grid;
          grid-template-columns: 1fr minmax(0, 440px);
          gap: 56px;
          align-items: center;
        }
        .hero-board { transform: rotate(2deg); }
        .diff-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 880px) {
          .hero { grid-template-columns: 1fr; }
          .hero-board { max-width: 380px; margin: 0 auto; transform: none; }
          .diff-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
