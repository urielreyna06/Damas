import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-start";
import { useEffect, useState } from "react";
import { getMe, setActiveTheme } from "../lib/api";
import type { MeResponse } from "../lib/api";
import { StaticBoard } from "../components/ui/StaticBoard";
import { resolveSkin } from "../lib/skins";

export const Route = createFileRoute("/me")({
  component: MePage,
});

function MePage() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingTheme, setSettingTheme] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      void navigate({ to: "/" });
      return;
    }
    void loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  async function loadMe() {
    setLoading(true);
    try {
      const token = await getToken();
      const me = await getMe(token ?? undefined);
      setData(me);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar el perfil.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSetTheme(themeId: string) {
    setSettingTheme(themeId);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = await getToken();
      await setActiveTheme(themeId, token ?? undefined);
      await loadMe();
      setSuccessMsg("Skin activa actualizada.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cambiar la skin.");
    } finally {
      setSettingTheme(null);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="wrap page">
        <div className="card card-pad stack gap-16" style={{ maxWidth: 720 }}>
          <div className="skeleton" style={{ height: 80 }} />
          <div className="skeleton" style={{ height: 220 }} />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="wrap page">
        <div className="card card-pad" style={{ maxWidth: 480 }}>
          <p className="muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, skins, activeTheme } = data;
  const initials = user.displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="wrap page fade-in" style={{ maxWidth: 880 }}>
      {/* Profile header */}
      <div className="card card-pad" style={{ marginBottom: 22 }}>
        <div className="row gap-16 wrap-w">
          <div
            aria-hidden="true"
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: 26,
              fontWeight: 700,
              color: "var(--gold)",
              background: "linear-gradient(135deg, #2b2b34, #16161d)",
              border: "1px solid var(--gold-line)",
            }}
          >
            {initials || "?"}
          </div>
          <div className="stack gap-4" style={{ flex: 1 }}>
            <h1 className="serif" style={{ fontSize: 30 }}>{user.displayName}</h1>
            <span className="muted-2" style={{ fontSize: 13.5 }}>
              Miembro desde {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="row gap-12">
            <Stat label="Skins" value={skins.length} />
          </div>
        </div>
      </div>

      {(error || successMsg) && (
        <div
          className={`badge ${successMsg ? "badge-owned" : "badge-hard"}`}
          style={{ marginBottom: 18, padding: "8px 14px" }}
        >
          <span className="dot" />
          {successMsg ?? error}
        </div>
      )}

      <div className="me-grid">
        {/* Active skin preview */}
        <div className="card card-pad stack gap-16">
          <span className="eyebrow">Skin activa</span>
          <StaticBoard themeId={activeTheme?._id ?? null} mini />
          <div>
            <div className="serif" style={{ fontSize: 18 }}>
              {activeTheme ? activeTheme.name : "Emerald Classic"}
            </div>
            <div className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>
              {activeTheme ? activeTheme.description : "Skin por defecto del juego."}
            </div>
          </div>
        </div>

        {/* Owned skins selector */}
        <div className="card card-pad">
          <span className="eyebrow">Mis skins</span>
          {skins.length === 0 ? (
            <div className="stack gap-12" style={{ marginTop: 14 }}>
              <p className="muted">Aún no tienes skins.</p>
              <Link to="/shop" className="btn btn-gold btn-sm" style={{ alignSelf: "flex-start" }}>
                Ir a la tienda
              </Link>
            </div>
          ) : (
            <div className="skin-grid">
              {skins.map((skin) => {
                const isActive = skin.themeId === user.activeThemeId;
                const meta = resolveSkin(skin.themeId);
                const busy = settingTheme === skin.themeId;
                return (
                  <div
                    key={skin._id}
                    className="card"
                    style={{
                      padding: 12,
                      borderColor: isActive ? "var(--gold-line)" : undefined,
                      boxShadow: isActive ? "var(--sh-glow)" : undefined,
                    }}
                  >
                    <StaticBoard skin={meta} mini />
                    <div className="row between" style={{ marginTop: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{meta.name}</span>
                      {isActive ? (
                        <span className="badge badge-owned">
                          <span className="dot" />
                          Activa
                        </span>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => void handleSetTheme(skin.themeId)}
                          disabled={busy}
                        >
                          {busy ? "…" : "Activar"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .me-grid {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 22px;
          align-items: start;
        }
        .skin-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 14px;
          margin-top: 14px;
        }
        @media (max-width: 760px) {
          .me-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stack" style={{ alignItems: "center", minWidth: 64 }}>
      <span className="serif" style={{ fontSize: 26, color: "var(--gold)" }}>{value}</span>
      <span className="muted-2" style={{ fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}
