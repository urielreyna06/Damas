import { jsxs, jsx } from 'react/jsx-runtime';
import { useAuth } from '@clerk/tanstack-start';
import { useState, useEffect } from 'react';
import { l, $, T } from './api-BJy07AZB.mjs';
import { y } from './StaticBoard-BcFT7AYp.mjs';
import './skins-COKJgQCr.mjs';

const P = { pieces: "Fichas", board: "Tablero", bundle: "Pack completo" }, L = function() {
  const { getToken: l$1, isSignedIn: r } = useAuth(), [d, h] = useState([]), [g, u] = useState(/* @__PURE__ */ new Set()), [f, y$1] = useState(true), [N, o] = useState(null), [m, c] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const e = await l();
        h(e);
      } catch (e) {
        c(e instanceof Error ? e.message : "Error al cargar la tienda.");
      } finally {
        y$1(false);
      }
    })();
  }, []), useEffect(() => {
    (async () => {
      try {
        const e = await l$1(), s = await $(e != null ? e : void 0);
        u(new Set(s.skins.map((n) => n.themeId)));
      } catch {
      }
    })();
  }, [l$1]);
  async function v(e) {
    o(e), c(null);
    try {
      const s = await l$1(), { checkoutUrl: n } = await T(e, s != null ? s : void 0);
      window.location.href = n;
    } catch (s) {
      c(s instanceof Error ? s.message : "Error al iniciar la compra."), o(null);
    }
  }
  return jsxs("div", { className: "wrap page fade-in", children: [jsxs("div", { className: "stack gap-8", style: { marginBottom: 28 }, children: [jsx("span", { className: "eyebrow", children: "Marketplace" }), jsx("h1", { style: { fontSize: "clamp(32px, 4vw, 44px)" }, children: "Tienda de skins" }), jsx("p", { className: "muted", style: { maxWidth: 520 }, children: "Personaliza tu tablero y tus fichas. Las skins son cosm\xE9ticas \u2014 no afectan la mec\xE1nica del juego." })] }), m && jsxs("div", { className: "badge badge-hard", style: { marginBottom: 18, padding: "8px 14px" }, children: [jsx("span", { className: "dot" }), m] }), f ? jsx("div", { className: "shop-grid", children: Array.from({ length: 5 }).map((e, s) => jsxs("div", { className: "card", style: { overflow: "hidden" }, children: [jsx("div", { className: "skeleton", style: { height: 200, borderRadius: 0 } }), jsxs("div", { className: "card-pad stack gap-12", children: [jsx("div", { className: "skeleton", style: { height: 18, width: "60%" } }), jsx("div", { className: "skeleton", style: { height: 14, width: "90%" } }), jsx("div", { className: "skeleton", style: { height: 40, width: "100%" } })] })] }, s)) }) : d.length === 0 ? jsx("div", { className: "card card-pad", style: { textAlign: "center", padding: 56 }, children: jsx("p", { className: "muted", children: "No hay skins disponibles por ahora." }) }) : jsx("div", { className: "shop-grid", children: d.map((e) => {
    var _a;
    const s = g.has(e._id), n = N === e._id, b = (e.priceUsdCents / 100).toFixed(2);
    return jsxs("div", { className: "card card-hover", style: { overflow: "hidden", display: "flex", flexDirection: "column" }, children: [jsx("div", { style: { padding: 18, background: "var(--bg-2)" }, children: jsx(y, { themeId: e._id, mini: true }) }), jsxs("div", { className: "card-pad stack gap-12", style: { flex: 1 }, children: [jsxs("div", { className: "row between", children: [jsx("h3", { className: "serif", style: { fontSize: 19 }, children: e.name }), s && jsxs("span", { className: "badge badge-owned", children: [jsx("span", { className: "dot" }), "Comprado"] })] }), jsx("span", { className: "pill", style: { alignSelf: "flex-start" }, children: (_a = P[e.kind]) != null ? _a : e.kind }), jsx("p", { className: "muted", style: { fontSize: 14, flex: 1 }, children: e.description }), jsxs("div", { className: "row between", style: { marginTop: 4 }, children: [jsxs("span", { className: "serif", style: { fontSize: 22, color: "var(--gold)" }, children: ["$", b] }), s ? jsx("button", { className: "btn btn-ghost btn-sm", disabled: true, children: "En tu colecci\xF3n" }) : jsx("button", { className: "btn btn-gold btn-sm", onClick: () => void v(e._id), disabled: n || !r, title: r ? void 0 : "Inicia sesi\xF3n para comprar", children: n ? "Procesando\u2026" : "Comprar" })] })] })] }, e._id);
  }) }), jsx("style", { children: `
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 22px;
        }
      ` })] });
};

export { L as component };
//# sourceMappingURL=shop-DgqixlF7.mjs.map
