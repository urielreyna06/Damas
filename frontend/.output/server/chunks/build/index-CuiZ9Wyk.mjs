import { jsxs, jsx } from 'react/jsx-runtime';
import { useNavigate } from '@tanstack/react-router';
import { useAuth, SignInButton } from '@clerk/tanstack-start';
import { useState } from 'react';
import { m } from './api-BJy07AZB.mjs';
import { y as y$1 } from './StaticBoard-BcFT7AYp.mjs';
import './skins-COKJgQCr.mjs';

const y = [{ id: "easy", name: "F\xE1cil", desc: "IA casual, perfecta para aprender los fundamentos." }, { id: "medium", name: "Medio", desc: "IA t\xE1ctica con b\xFAsqueda media. Te pondr\xE1 a prueba." }, { id: "hard", name: "Dif\xEDcil", desc: "Minimax con b\xFAsqueda profunda. Casi imbatible." }], T = function() {
  const { isSignedIn: t, getToken: p } = useAuth(), s = useNavigate(), [i, d] = useState(null), [l, o] = useState(null);
  async function c(e) {
    if (t) {
      d(e), o(null);
      try {
        const r = await p(), g = await m(e, r != null ? r : void 0);
        await s({ to: "/play/$gameId", params: { gameId: g._id } });
      } catch (r) {
        o(r instanceof Error ? r.message : "Error al crear la partida.");
      } finally {
        d(null);
      }
    }
  }
  return jsxs("div", { className: "wrap page fade-in", children: [jsxs("section", { className: "hero", children: [jsxs("div", { className: "stack gap-16", children: [jsx("span", { className: "eyebrow", children: "Damas \xB7 Player vs IA" }), jsxs("h1", { style: { fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1.05 }, children: ["Entrena tu mente.", jsx("br", {}), jsx("span", { style: { color: "var(--gold)" }, children: "Vence a la m\xE1quina." })] }), jsx("p", { className: "muted", style: { fontSize: 17, maxWidth: 460 }, children: "Damas inglesas 8\xD78 contra una IA con tres niveles de dificultad. Sube en el ranking, desbloquea skins y domina el tablero." }), l && jsxs("div", { className: "badge badge-hard", style: { alignSelf: "flex-start", padding: "8px 14px" }, children: [jsx("span", { className: "dot" }), l] }), jsxs("div", { className: "row gap-12 wrap-w", style: { marginTop: 8 }, children: [t ? jsx("button", { className: "btn btn-gold btn-lg", onClick: () => void c("medium"), disabled: i !== null, children: i ? "Creando partida\u2026" : "Jugar ahora" }) : jsx(SignInButton, { mode: "modal", children: jsx("button", { className: "btn btn-gold btn-lg", children: "Iniciar sesi\xF3n y jugar" }) }), jsx("button", { className: "btn btn-ghost btn-lg", onClick: () => s({ to: "/leaderboard" }), children: "Ver ranking" })] })] }), jsx("div", { className: "hero-board", children: jsx(y$1, { themeId: null }) })] }), jsxs("section", { style: { marginTop: 72 }, children: [jsx("div", { className: "row between", style: { marginBottom: 20 }, children: jsx("h2", { className: "serif", style: { fontSize: 28 }, children: "Elige tu desaf\xEDo" }) }), jsx("div", { className: "diff-grid", children: y.map((e) => jsxs("button", { className: "diff-card", "data-diff": e.id, onClick: () => void c(e.id), disabled: i !== null, "aria-label": `Jugar en dificultad ${e.name}`, children: [jsxs("span", { className: `badge badge-${e.id}`, children: [jsx("span", { className: "dot" }), e.name] }), jsx("div", { className: "diff-name", children: e.name }), jsx("div", { className: "diff-desc", children: e.desc }), jsx("div", { className: "muted-2", style: { marginTop: 16, fontSize: 13.5, fontWeight: 600 }, children: i === e.id ? "Creando\u2026" : t ? "Empezar \u2192" : "Inicia sesi\xF3n para jugar" })] }, e.id)) })] }), jsx("style", { children: `
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
      ` })] });
};

export { T as component };
//# sourceMappingURL=index-CuiZ9Wyk.mjs.map
