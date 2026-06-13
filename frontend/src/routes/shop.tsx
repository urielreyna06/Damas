import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-start";
import { useEffect, useState } from "react";
import { getThemes, getMe, purchaseTheme, verifyPayment } from "../lib/api";
import { StaticBoard } from "../components/ui/StaticBoard";
import type { Theme } from "@damas/shared";

export const Route = createFileRoute("/shop")({
  component: ShopPage,
});

const KIND_LABEL: Record<string, string> = {
  pieces: "Fichas",
  board: "Tablero",
  bundle: "Pack completo",
};

function ShopPage() {
  const { getToken, isSignedIn } = useAuth();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getThemes();
        setThemes(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar la tienda.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load owned skins once signed in; verify Stripe payment if returning from checkout
  useEffect(() => {
    if (!isSignedIn) return;

    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get("success") === "1";
    const sessionId = params.get("session_id");
    const themeId = params.get("theme");

    void (async () => {
      try {
        const token = await getToken();

        if (isSuccess && sessionId && themeId) {
          try {
            await verifyPayment(themeId, sessionId, token ?? undefined);
            setSuccessMsg("¡Pago confirmado! Activa tu nueva skin en tu perfil.");
            window.history.replaceState({}, "", "/shop");
          } catch {
            // Already owned or non-fatal — still refresh owned list below
          }
        }

        const me = await getMe(token ?? undefined);
        setOwned(new Set(me.skins.map((s) => s.themeId)));
      } catch {
        // not signed in or fetch failed — no owned badges
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  async function handlePurchase(themeId: string) {
    setPurchasing(themeId);
    setError(null);
    try {
      const token = await getToken();
      const { checkoutUrl } = await purchaseTheme(themeId, token ?? undefined);
      window.location.href = checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al iniciar la compra.");
      setPurchasing(null);
    }
  }

  return (
    <div className="wrap page fade-in">
      <div className="stack gap-8" style={{ marginBottom: 28 }}>
        <span className="eyebrow">Marketplace</span>
        <h1 style={{ fontSize: "clamp(32px, 4vw, 44px)" }}>Tienda de skins</h1>
        <p className="muted" style={{ maxWidth: 520 }}>
          Personaliza tu tablero y tus fichas. Las skins son cosméticas — no
          afectan la mecánica del juego.
        </p>
      </div>

      {successMsg && (
        <div className="badge badge-easy" style={{ marginBottom: 18, padding: "8px 14px" }}>
          <span className="dot" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="badge badge-hard" style={{ marginBottom: 18, padding: "8px 14px" }}>
          <span className="dot" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="shop-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card" style={{ overflow: "hidden" }}>
              <div className="skeleton" style={{ height: 200, borderRadius: 0 }} />
              <div className="card-pad stack gap-12">
                <div className="skeleton" style={{ height: 18, width: "60%" }} />
                <div className="skeleton" style={{ height: 14, width: "90%" }} />
                <div className="skeleton" style={{ height: 40, width: "100%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : themes.length === 0 ? (
        <div className="card card-pad" style={{ textAlign: "center", padding: 56 }}>
          <p className="muted">No hay skins disponibles por ahora.</p>
        </div>
      ) : (
        <div className="shop-grid">
          {themes.map((theme) => {
            const isOwned = owned.has(theme._id);
            const isPurchasing = purchasing === theme._id;
            const price = (theme.priceUsdCents / 100).toFixed(2);
            return (
              <div key={theme._id} className="card card-hover" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: 18, background: "var(--bg-2)" }}>
                  <StaticBoard themeId={theme._id} mini />
                </div>
                <div className="card-pad stack gap-12" style={{ flex: 1 }}>
                  <div className="row between">
                    <h3 className="serif" style={{ fontSize: 19 }}>{theme.name}</h3>
                    {isOwned && (
                      <span className="badge badge-owned">
                        <span className="dot" />
                        Comprado
                      </span>
                    )}
                  </div>
                  <span className="pill" style={{ alignSelf: "flex-start" }}>
                    {theme.tag ?? KIND_LABEL[theme.kind] ?? "Skin"}
                  </span>
                  <p className="muted" style={{ fontSize: 14, flex: 1 }}>{theme.description}</p>
                  <div className="row between" style={{ marginTop: 4 }}>
                    <span className="serif" style={{ fontSize: 22, color: "var(--gold)" }}>
                      ${price}
                    </span>
                    {isOwned ? (
                      <button className="btn btn-ghost btn-sm" disabled>
                        En tu colección
                      </button>
                    ) : (
                      <button
                        className="btn btn-gold btn-sm"
                        onClick={() => void handlePurchase(theme._id)}
                        disabled={isPurchasing || !isSignedIn}
                        title={!isSignedIn ? "Inicia sesión para comprar" : undefined}
                      >
                        {isPurchasing ? "Procesando…" : "Comprar"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 22px;
        }
      `}</style>
    </div>
  );
}
