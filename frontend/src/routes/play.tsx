import { createFileRoute, useNavigate, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useAuth, SignInButton } from "@clerk/tanstack-start";
import { useEffect, useState } from "react";
import { listGames, createGame, deleteGame } from "../lib/api";
import { DifficultyBadge } from "../components/ui/DifficultyBadge";
import type { Game, Difficulty } from "@damas/shared";

export const Route = createFileRoute("/play")({
  component: PlayPage,
});

const DIFFICULTIES: { id: Difficulty; name: string; desc: string }[] = [
  { id: "easy", name: "Fácil", desc: "IA casual, perfecta para aprender." },
  { id: "medium", name: "Medio", desc: "IA táctica, te pondrá a prueba." },
  { id: "hard", name: "Difícil", desc: "Búsqueda profunda, casi imbatible." },
];

function PlayPage() {
  const { isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();
  // `/play/$gameId` is a child route of `/play`. Without rendering <Outlet/> the child
  // (the game board) never mounts — the lobby just stays on screen. Yield to the child
  // when one is active so the board renders; show the lobby only at exactly /play.
  const childMatches = useChildMatches();
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [creating, setCreating] = useState<Difficulty | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    void loadGames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  // A child route (e.g. /play/$gameId) is active → render it instead of the lobby.
  if (childMatches.length > 0) return <Outlet />;

  async function loadGames() {
    setLoadingGames(true);
    try {
      const token = await getToken();
      const all = await listGames(token ?? undefined);
      setGames(all.filter((g) => g.status === "in_progress"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar las partidas.");
    } finally {
      setLoadingGames(false);
    }
  }

  async function handleCreate(difficulty: Difficulty) {
    setCreating(difficulty);
    setError(null);
    try {
      const token = await getToken();
      const game = await createGame(difficulty, token ?? undefined);
      await navigate({ to: "/play/$gameId", params: { gameId: game._id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la partida.");
      setCreating(null);
    }
  }

  async function handleDelete(gameId: string) {
    setDeletingId(gameId);
    setError(null);
    try {
      const token = await getToken();
      await deleteGame(gameId, token ?? undefined);
      setGames((prev) => prev.filter((g) => g._id !== gameId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al borrar la partida.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!isSignedIn) {
    return (
      <div className="wrap page">
        <div className="card card-pad" style={{ maxWidth: 460, margin: "40px auto", textAlign: "center" }}>
          <h2 className="serif" style={{ fontSize: 24 }}>Inicia sesión para jugar</h2>
          <p className="muted" style={{ margin: "12px 0 22px" }}>
            Necesitas una cuenta para crear partidas y guardar tu progreso.
          </p>
          <SignInButton mode="modal">
            <button className="btn btn-gold btn-block">Iniciar sesión</button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap page fade-in" style={{ maxWidth: 880 }}>
      <div className="stack gap-8" style={{ marginBottom: 24 }}>
        <span className="eyebrow">Tablero de mando</span>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 44px)" }}>Jugar</h1>
      </div>

      {error && (
        <div className="badge badge-hard" style={{ marginBottom: 18, padding: "8px 14px" }}>
          <span className="dot" />
          {error}
        </div>
      )}

      {/* New game */}
      <section style={{ marginBottom: 40 }}>
        <h2 className="serif" style={{ fontSize: 22, marginBottom: 16 }}>Nueva partida</h2>
        <div className="play-diff-grid">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.id}
              className="diff-card"
              data-diff={d.id}
              onClick={() => void handleCreate(d.id)}
              disabled={creating === d.id}
            >
              <span className={`badge badge-${d.id}`}>
                <span className="dot" />
                {d.name}
              </span>
              <div className="diff-name">{d.name}</div>
              <div className="diff-desc">{d.desc}</div>
              <div className="muted-2" style={{ marginTop: 14, fontSize: 13.5, fontWeight: 600 }}>
                {creating === d.id ? "Creando…" : "Empezar →"}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Active games */}
      <section>
        <h2 className="serif" style={{ fontSize: 22, marginBottom: 16 }}>Partidas en progreso</h2>
        {loadingGames ? (
          <div className="stack gap-12">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 14 }} />
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: 48 }}>
            <p className="muted">No tienes partidas activas.</p>
            <p className="muted-2" style={{ fontSize: 13.5, marginTop: 6 }}>
              Crea una nueva arriba para empezar a jugar.
            </p>
          </div>
        ) : (
          <div className="stack gap-12">
            {games.map((game) => (
              <div key={game._id} className="card card-hover" style={{ padding: "16px 20px" }}>
                <div className="row between wrap-w gap-16">
                  <div className="row gap-16">
                    <DifficultyBadge difficulty={game.difficulty} />
                    <span className="muted" style={{ fontSize: 14 }}>
                      {game.turn === game.humanSide ? "Tu turno" : "Turno de la IA"}
                      {" · "}
                      {game.humanMoveCount} mov.
                    </span>
                  </div>
                  <div className="row gap-8">
                    <Link
                      to="/play/$gameId"
                      params={{ gameId: game._id }}
                      className="btn btn-gold btn-sm"
                    >
                      Continuar
                    </Link>
                    <button
                      className="btn btn-quiet btn-sm"
                      onClick={() => void handleDelete(game._id)}
                      disabled={deletingId === game._id}
                    >
                      {deletingId === game._id ? "…" : "Borrar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        .play-diff-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 760px) {
          .play-diff-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
