import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-start";
import { useEffect, useState, useCallback } from "react";
import { getGame, getLegalMoves, sendMove, getMe, createGame, deleteGame, ApiError } from "../lib/api";
import { Board } from "../components/Board";
import { DifficultyBadge } from "../components/ui/DifficultyBadge";
import { EndModal } from "../components/ui/EndModal";
import type { Game, Move, MoveRecord, Square, Theme } from "@damas/shared";

export const Route = createFileRoute("/play/$gameId")({
  component: GamePage,
});

function GamePage() {
  const { gameId } = Route.useParams();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  const [game, setGame] = useState<Game | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [lastAiMove, setLastAiMove] = useState<MoveRecord | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [illegalMoveError, setIllegalMoveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);

  const fetchGame = useCallback(async () => {
    try {
      const token = await getToken();
      const g = await getGame(gameId, token ?? undefined);
      setGame(g);
      if (g.status === "in_progress" && g.turn === g.humanSide) {
        const moves = await getLegalMoves(gameId, token ?? undefined);
        setLegalMoves(moves);
      } else {
        setLegalMoves([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la partida.");
    } finally {
      setLoading(false);
    }
  }, [gameId, getToken]);

  // Wait for Clerk before fetching — avoids 401 when getToken() returns null on first render
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { void navigate({ to: "/play" }); return; }
    void fetchGame();
  }, [fetchGame, isLoaded, isSignedIn, navigate]);

  // Fetch active theme once Clerk is ready
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void (async () => {
      try {
        const token = await getToken();
        const me = await getMe(token ?? undefined);
        if (me.activeTheme) setActiveTheme(me.activeTheme);
      } catch {
        // non-fatal — default skin renders correctly
      }
    })();
  }, [getToken, isLoaded, isSignedIn]);

  const handleMoveSend = useCallback(
    async (path: Square[]) => {
      if (!game) return;
      setIllegalMoveError(null);
      setIsAiThinking(true);
      try {
        const token = await getToken();
        const result = await sendMove(gameId, path, token ?? undefined);
        setGame(result.game);
        setLastAiMove(result.lastAiMove);
        if (result.game.status === "in_progress" && result.game.turn === result.game.humanSide) {
          const moves = await getLegalMoves(gameId, token ?? undefined);
          setLegalMoves(moves);
        } else {
          setLegalMoves([]);
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          setIllegalMoveError("Movimiento ilegal");
        } else {
          setError(e instanceof Error ? e.message : "Error al enviar movimiento.");
        }
      } finally {
        setIsAiThinking(false);
      }
    },
    [game, gameId, getToken]
  );

  const handlePlayAgain = useCallback(async () => {
    if (!game) return;
    try {
      const token = await getToken();
      const fresh = await createGame(game.difficulty, token ?? undefined);
      navigate({ to: "/play/$gameId", params: { gameId: fresh._id } });
    } catch {
      navigate({ to: "/play" });
    }
  }, [game, getToken, navigate]);

  const handleAbandon = useCallback(async () => {
    try {
      const token = await getToken();
      await deleteGame(gameId, token ?? undefined);
    } catch {
      // best-effort; navigate away regardless
    }
    navigate({ to: "/play" });
  }, [gameId, getToken, navigate]);

  if (loading) {
    return (
      <div className="wrap page">
        <div className="skeleton" style={{ height: 560, maxWidth: 560, borderRadius: 18 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="wrap page">
        <div className="card card-pad" style={{ maxWidth: 480 }}>
          <h2 className="serif" style={{ fontSize: 24 }}>Algo salió mal</h2>
          <p className="muted" style={{ marginTop: 8 }}>{error}</p>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => navigate({ to: "/play" })}>
            Volver a partidas
          </button>
        </div>
      </div>
    );
  }

  if (!game) return null;

  const isHumanTurn = game.status === "in_progress" && game.turn === game.humanSide;
  const recentMoves = [...game.moves].slice(-5).reverse();

  return (
    <div className="wrap page fade-in">
      <div className="game-layout">
        {/* Board */}
        <div style={{ width: "100%", maxWidth: 600, margin: "0 auto" }}>
          <Board
            board={game.board}
            humanSide={game.humanSide}
            currentTurn={game.turn}
            gameStatus={game.status}
            onMoveSend={handleMoveSend}
            legalMoves={legalMoves}
            isAiThinking={isAiThinking}
            lastAiMove={lastAiMove}
            illegalMoveError={illegalMoveError}
            themeId={activeTheme?._id}
          />
        </div>

        {/* Sidebar */}
        <aside className="stack gap-16" style={{ minWidth: 260 }}>
          <div className="card card-pad stack gap-16">
            <div className="row between">
              <span className="eyebrow">Partida</span>
              <DifficultyBadge difficulty={game.difficulty} />
            </div>

            {/* Turn indicator: human vs AI */}
            <div className="row gap-12" style={{ justifyContent: "space-between" }}>
              <TurnChip label="Tú" active={isHumanTurn} kind="human" />
              <span className="muted-2" style={{ fontWeight: 700 }}>vs</span>
              <TurnChip
                label="IA"
                active={game.status === "in_progress" && !isHumanTurn}
                kind="ai"
                thinking={isAiThinking}
              />
            </div>

            <div className="divider" />

            <div className="row between">
              <span className="muted">Tus movimientos</span>
              <span style={{ fontWeight: 700 }} className="mono">{game.humanMoveCount}</span>
            </div>
          </div>

          {/* Move history */}
          <div className="card card-pad">
            <span className="eyebrow">Últimos movimientos</span>
            <div className="stack gap-8" style={{ marginTop: 12 }}>
              {recentMoves.length === 0 && <span className="muted-2">Sin movimientos aún.</span>}
              {recentMoves.map((mr) => (
                <div key={mr.ply} className="row between" style={{ fontSize: 13.5 }}>
                  <span className={mr.byAI ? "muted" : ""} style={{ color: mr.byAI ? undefined : "var(--gold)" }}>
                    {mr.byAI ? "IA" : "Tú"}
                  </span>
                  <span className="mono muted-2">{formatPath(mr.move.path)}</span>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-danger btn-block" onClick={() => void handleAbandon()}>
            Abandonar partida
          </button>
        </aside>
      </div>

      <EndModal
        status={game.status}
        onPlayAgain={() => void handlePlayAgain()}
        onViewLeaderboard={() => navigate({ to: "/leaderboard" })}
      />

      <style>{`
        .game-layout {
          display: grid;
          grid-template-columns: minmax(0, 600px) 280px;
          gap: 36px;
          align-items: start;
        }
        @media (max-width: 920px) {
          .game-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function TurnChip({
  label,
  active,
  kind,
  thinking,
}: {
  label: string;
  active: boolean;
  kind: "human" | "ai";
  thinking?: boolean;
}) {
  return (
    <div
      className="stack gap-8"
      style={{
        flex: 1,
        alignItems: "center",
        padding: "14px 10px",
        borderRadius: "var(--r)",
        background: active ? "var(--gold-soft)" : "var(--bg-2)",
        border: `1px solid ${active ? "var(--gold-line)" : "var(--line)"}`,
        transition: "background .2s, border-color .2s",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          background:
            kind === "human"
              ? "radial-gradient(circle at 36% 30%, var(--gold-hi), var(--gold-lo))"
              : "radial-gradient(circle at 36% 30%, #3C3C46, #15151B)",
          color: kind === "human" ? "#1a1505" : "#F6D277",
        }}
      >
        {kind === "human" ? "♟" : "🤖"}
      </span>
      <span style={{ fontWeight: 600, fontSize: 13.5 }}>
        {thinking ? "Pensando…" : label}
      </span>
    </div>
  );
}

function formatPath(path: { row: number; col: number }[]): string {
  return path.map((s) => `${String.fromCharCode(97 + s.col)}${8 - s.row}`).join("→");
}
