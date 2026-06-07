import { jsx, jsxs } from 'react/jsx-runtime';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuth } from '@clerk/tanstack-start';
import { useState, useEffect } from 'react';
import { $, N } from './api-BJy07AZB.mjs';
import { y } from './StaticBoard-BcFT7AYp.mjs';
import { s } from './skins-COKJgQCr.mjs';

function D({ label: h, value: r }) {
  return jsxs("div", { className: "stack", style: { alignItems: "center", minWidth: 64 }, children: [jsx("span", { className: "serif", style: { fontSize: 26, color: "var(--gold)" }, children: r }), jsx("span", { className: "muted-2", style: { fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase" }, children: h })] });
}
const G = function() {
  var _a;
  const { isSignedIn: r, isLoaded: c, getToken: u } = useAuth(), k = useNavigate(), [o, x] = useState(null), [T, v] = useState(true), [z, f] = useState(null), [l, m] = useState(null), [p, N$1] = useState(null);
  useEffect(() => {
    if (c) {
      if (!r) {
        k({ to: "/" });
        return;
      }
      y$1();
    }
  }, [c, r]);
  async function y$1() {
    v(true);
    try {
      const a = await u(), s = await $(a != null ? a : void 0);
      x(s);
    } catch (a) {
      m(a instanceof Error ? a.message : "Error al cargar el perfil.");
    } finally {
      v(false);
    }
  }
  async function I(a) {
    f(a), m(null), N$1(null);
    try {
      const s = await u();
      await N(a, s != null ? s : void 0), await y$1(), N$1("Skin activa actualizada.");
    } catch (s) {
      m(s instanceof Error ? s.message : "Error al cambiar la skin.");
    } finally {
      f(null);
    }
  }
  if (!c || T) return jsx("div", { className: "wrap page", children: jsxs("div", { className: "card card-pad stack gap-16", style: { maxWidth: 720 }, children: [jsx("div", { className: "skeleton", style: { height: 80 } }), jsx("div", { className: "skeleton", style: { height: 220 } })] }) });
  if (l && !o) return jsx("div", { className: "wrap page", children: jsx("div", { className: "card card-pad", style: { maxWidth: 480 }, children: jsx("p", { className: "muted", children: l }) }) });
  if (!o) return null;
  const { user: d, skins: g, activeTheme: t } = o, A = d.displayName.split(" ").map((a) => a[0]).slice(0, 2).join("").toUpperCase();
  return jsxs("div", { className: "wrap page fade-in", style: { maxWidth: 880 }, children: [jsx("div", { className: "card card-pad", style: { marginBottom: 22 }, children: jsxs("div", { className: "row gap-16 wrap-w", children: [jsx("div", { "aria-hidden": "true", style: { width: 72, height: 72, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 26, fontWeight: 700, color: "var(--gold)", background: "linear-gradient(135deg, #2b2b34, #16161d)", border: "1px solid var(--gold-line)" }, children: A || "?" }), jsxs("div", { className: "stack gap-4", style: { flex: 1 }, children: [jsx("h1", { className: "serif", style: { fontSize: 30 }, children: d.displayName }), jsxs("span", { className: "muted-2", style: { fontSize: 13.5 }, children: ["Miembro desde ", new Date(d.createdAt).toLocaleDateString()] })] }), jsx("div", { className: "row gap-12", children: jsx(D, { label: "Skins", value: g.length }) })] }) }), (l || p) && jsxs("div", { className: `badge ${p ? "badge-owned" : "badge-hard"}`, style: { marginBottom: 18, padding: "8px 14px" }, children: [jsx("span", { className: "dot" }), p != null ? p : l] }), jsxs("div", { className: "me-grid", children: [jsxs("div", { className: "card card-pad stack gap-16", children: [jsx("span", { className: "eyebrow", children: "Skin activa" }), jsx(y, { themeId: (_a = t == null ? void 0 : t._id) != null ? _a : null, mini: true }), jsxs("div", { children: [jsx("div", { className: "serif", style: { fontSize: 18 }, children: t ? t.name : "Emerald Classic" }), jsx("div", { className: "muted", style: { fontSize: 13.5, marginTop: 4 }, children: t ? t.description : "Skin por defecto del juego." })] })] }), jsxs("div", { className: "card card-pad", children: [jsx("span", { className: "eyebrow", children: "Mis skins" }), g.length === 0 ? jsxs("div", { className: "stack gap-12", style: { marginTop: 14 }, children: [jsx("p", { className: "muted", children: "A\xFAn no tienes skins." }), jsx(Link, { to: "/shop", className: "btn btn-gold btn-sm", style: { alignSelf: "flex-start" }, children: "Ir a la tienda" })] }) : jsx("div", { className: "skin-grid", children: g.map((a) => {
    const s$1 = a.themeId === d.activeThemeId, b = s(a.themeId), S = z === a.themeId;
    return jsxs("div", { className: "card", style: { padding: 12, borderColor: s$1 ? "var(--gold-line)" : void 0, boxShadow: s$1 ? "var(--sh-glow)" : void 0 }, children: [jsx(y, { skin: b, mini: true }), jsxs("div", { className: "row between", style: { marginTop: 10 }, children: [jsx("span", { style: { fontWeight: 600, fontSize: 13.5 }, children: b.name }), s$1 ? jsxs("span", { className: "badge badge-owned", children: [jsx("span", { className: "dot" }), "Activa"] }) : jsx("button", { className: "btn btn-ghost btn-sm", onClick: () => void I(a.themeId), disabled: S, children: S ? "\u2026" : "Activar" })] })] }, a._id);
  }) })] })] }), jsx("style", { children: `
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
      ` })] });
};

export { G as component };
//# sourceMappingURL=me-DarHVxYY.mjs.map
