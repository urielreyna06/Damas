import { jsxs, jsx } from 'react/jsx-runtime';
import { useNavigate, Link } from '@tanstack/react-router';
import { useAuth, SignInButton } from '@clerk/tanstack-start';
import { useState, useEffect } from 'react';
import { h, m, y } from './api-BJy07AZB.mjs';
import { r } from './DifficultyBadge-DXL-G_TY.mjs';

const G = [{ id: "easy", name: "F\xE1cil", desc: "IA casual, perfecta para aprender." }, { id: "medium", name: "Medio", desc: "IA t\xE1ctica, te pondr\xE1 a prueba." }, { id: "hard", name: "Dif\xEDcil", desc: "B\xFAsqueda profunda, casi imbatible." }], $ = function() {
  const { isSignedIn: d, getToken: l } = useAuth(), y$1 = useNavigate(), [c, o] = useState([]), [N, m$1] = useState(true), [p, u] = useState(null), [g, f] = useState(null), [h$1, r$1] = useState(null);
  useEffect(() => {
    d && v();
  }, [d]);
  async function v() {
    m$1(true);
    try {
      const a = await l(), i = await h(a != null ? a : void 0);
      o(i.filter((s) => s.status === "in_progress"));
    } catch (a) {
      r$1(a instanceof Error ? a.message : "Error al cargar las partidas.");
    } finally {
      m$1(false);
    }
  }
  async function b(a) {
    u(a), r$1(null);
    try {
      const i = await l(), s = await m(a, i != null ? i : void 0);
      await y$1({ to: "/play/$gameId", params: { gameId: s._id } });
    } catch (i) {
      r$1(i instanceof Error ? i.message : "Error al crear la partida."), u(null);
    }
  }
  async function x(a) {
    f(a), r$1(null);
    try {
      const i = await l();
      await y(a, i != null ? i : void 0), o((s) => s.filter((w) => w._id !== a));
    } catch (i) {
      r$1(i instanceof Error ? i.message : "Error al borrar la partida.");
    } finally {
      f(null);
    }
  }
  return d ? jsxs("div", { className: "wrap page fade-in", style: { maxWidth: 880 }, children: [jsxs("div", { className: "stack gap-8", style: { marginBottom: 24 }, children: [jsx("span", { className: "eyebrow", children: "Tablero de mando" }), jsx("h1", { style: { fontSize: "clamp(32px, 4vw, 44px)" }, children: "Jugar" })] }), h$1 && jsxs("div", { className: "badge badge-hard", style: { marginBottom: 18, padding: "8px 14px" }, children: [jsx("span", { className: "dot" }), h$1] }), jsxs("section", { style: { marginBottom: 40 }, children: [jsx("h2", { className: "serif", style: { fontSize: 22, marginBottom: 16 }, children: "Nueva partida" }), jsx("div", { className: "play-diff-grid", children: G.map((a) => jsxs("button", { className: "diff-card", "data-diff": a.id, onClick: () => void b(a.id), disabled: p !== null, children: [jsxs("span", { className: `badge badge-${a.id}`, children: [jsx("span", { className: "dot" }), a.name] }), jsx("div", { className: "diff-name", children: a.name }), jsx("div", { className: "diff-desc", children: a.desc }), jsx("div", { className: "muted-2", style: { marginTop: 14, fontSize: 13.5, fontWeight: 600 }, children: p === a.id ? "Creando\u2026" : "Empezar \u2192" })] }, a.id)) })] }), jsxs("section", { children: [jsx("h2", { className: "serif", style: { fontSize: 22, marginBottom: 16 }, children: "Partidas en progreso" }), N ? jsx("div", { className: "stack gap-12", children: Array.from({ length: 2 }).map((a, i) => jsx("div", { className: "skeleton", style: { height: 72, borderRadius: 14 } }, i)) }) : c.length === 0 ? jsxs("div", { className: "card card-pad", style: { textAlign: "center", padding: 48 }, children: [jsx("p", { className: "muted", children: "No tienes partidas activas." }), jsx("p", { className: "muted-2", style: { fontSize: 13.5, marginTop: 6 }, children: "Crea una nueva arriba para empezar a jugar." })] }) : jsx("div", { className: "stack gap-12", children: c.map((a) => jsx("div", { className: "card card-hover", style: { padding: "16px 20px" }, children: jsxs("div", { className: "row between wrap-w gap-16", children: [jsxs("div", { className: "row gap-16", children: [jsx(r, { difficulty: a.difficulty }), jsxs("span", { className: "muted", style: { fontSize: 14 }, children: [a.turn === a.humanSide ? "Tu turno" : "Turno de la IA", " \xB7 ", a.humanMoveCount, " mov."] })] }), jsxs("div", { className: "row gap-8", children: [jsx(Link, { to: "/play/$gameId", params: { gameId: a._id }, className: "btn btn-gold btn-sm", children: "Continuar" }), jsx("button", { className: "btn btn-quiet btn-sm", onClick: () => void x(a._id), disabled: g === a._id, children: g === a._id ? "\u2026" : "Borrar" })] })] }) }, a._id)) })] }), jsx("style", { children: `
        .play-diff-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 760px) {
          .play-diff-grid { grid-template-columns: 1fr; }
        }
      ` })] }) : jsx("div", { className: "wrap page", children: jsxs("div", { className: "card card-pad", style: { maxWidth: 460, margin: "40px auto", textAlign: "center" }, children: [jsx("h2", { className: "serif", style: { fontSize: 24 }, children: "Inicia sesi\xF3n para jugar" }), jsx("p", { className: "muted", style: { margin: "12px 0 22px" }, children: "Necesitas una cuenta para crear partidas y guardar tu progreso." }), jsx(SignInButton, { mode: "modal", children: jsx("button", { className: "btn btn-gold btn-block", children: "Iniciar sesi\xF3n" }) })] }) });
};

export { $ as component };
//# sourceMappingURL=play-CETrWHo0.mjs.map
