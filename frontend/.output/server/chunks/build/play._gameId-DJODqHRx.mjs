import { jsx, jsxs } from 'react/jsx-runtime';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@clerk/tanstack-start';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { d, p, $, f, c, m, y } from './api-BJy07AZB.mjs';
import { s, o } from './skins-COKJgQCr.mjs';
import { r } from './DifficultyBadge-DXL-G_TY.mjs';
import { _ as _e } from '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:async_hooks';
import 'vinxi/lib/invariant';
import 'vinxi/lib/path';
import 'node:url';
import 'node:stream';
import 'react-dom/server';
import 'node:stream/web';

function ae({ piece: o, isSelected: t, isLastMoved: a, finish: i = "glossy" }) {
  const u = ["piece", o.side === "red" ? "human" : "ai"];
  return t && u.push("sel"), a && u.push("lastmoved"), jsx("div", { className: u.join(" "), "data-finish": i, "aria-label": `${o.side} ${o.kind}`, children: jsx("span", { className: "disc", children: o.kind === "king" && jsx("span", { className: "crown", "aria-hidden": "true", children: "\u265B" }) }) });
}
function te({ board: o$1, humanSide: t, currentTurn: a, gameStatus: i, onMoveSend: r, legalMoves: u, isAiThinking: A, lastAiMove: b, illegalMoveError: C, themeId: x }) {
  const [f, S] = useState(null), [v, N] = useState([]), E = useMemo(() => s(x), [x]), k = useMemo(() => {
    if (a !== t || i !== "in_progress") return /* @__PURE__ */ new Set();
    const l = /* @__PURE__ */ new Set();
    return u.forEach((m) => {
      const c = m.path[0];
      c && l.add(I(c));
    }), l;
  }, [u, a, t, i]), P = useMemo(() => {
    if (!f) return /* @__PURE__ */ new Set();
    const l = v.length > 0 ? v : [f], m = /* @__PURE__ */ new Set();
    return u.forEach((c) => {
      if (L(c.path, l) && c.path.length > l.length) {
        const g = c.path[l.length];
        g && m.add(I(g));
      }
    }), m;
  }, [f, v, u]), q = useMemo(() => b ? new Set(b.move.path.map(I)) : /* @__PURE__ */ new Set(), [b]), M = useCallback(async (l, m) => {
    if (A || i !== "in_progress" || a !== t) return;
    const c = { row: l, col: m }, g = I(c);
    if (k.has(g) && v.length === 0) {
      S(c), N([c]);
      return;
    }
    if (f) {
      const w = v.length > 0 ? v : [f];
      if (P.has(g)) {
        const p = [...w, c], n = u.some((h) => L(h.path, p) && h.path.length > p.length), s = u.some((h) => h.path.length === p.length && L(h.path, p));
        n && !s ? N(p) : s && (S(null), N([]), await r(p));
        return;
      }
      if (k.has(g)) {
        S(c), N([c]);
        return;
      }
      S(null), N([]);
    }
  }, [A, i, a, t, f, v, k, P, u, r]), R = t === "red" ? [0, 1, 2, 3, 4, 5, 6, 7].reverse() : [0, 1, 2, 3, 4, 5, 6, 7];
  return jsxs("div", { style: { position: "relative" }, children: [C && jsx("div", { role: "alert", style: { position: "absolute", top: -52, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 30 }, children: jsxs("span", { className: "badge badge-hard", style: { padding: "8px 14px", fontSize: 13.5 }, children: [jsx("span", { className: "dot" }), C] }) }), jsxs("div", { className: "dboard", "data-skin": E.dataSkin, style: o(E), children: [A && jsx("div", { className: "board-overlay", children: jsxs("span", { className: "thinking-pill", children: [jsx("span", { className: "thinking-dot" }), "IA pensando\u2026"] }) }), jsx("div", { className: "dboard-grid", "data-testid": "checkers-board", children: R.flatMap((l) => [0, 1, 2, 3, 4, 5, 6, 7].map((m) => {
    var _a, _b;
    const c = (l + m) % 2 === 1, g = (_b = (_a = o$1[l]) == null ? void 0 : _a[m]) != null ? _b : null, w = I({ row: l, col: m }), p = f !== null && f.row === l && f.col === m, n = P.has(w), s = q.has(w), h = v.some((W) => W.row === l && W.col === m), j = c && (k.has(w) || n), $ = ["sq", c ? "dark" : "light"];
    return (h || p) && $.push("selsq"), s && $.push("lastto"), j && $.push("clickable"), jsxs("div", { "data-testid": `square-${l}-${m}`, className: $.join(" "), onClick: () => void M(l, m), children: [g && jsx(ae, { piece: g, isSelected: p, isLastMoved: s }), n && !g && jsx("div", { className: "hint-dot" })] }, `${l}-${m}`);
  })) })] })] });
}
function I(o) {
  return `${o.row},${o.col}`;
}
function L(o, t) {
  if (o.length < t.length) return false;
  for (let a = 0; a < t.length; a++) if (o[a].row !== t[a].row || o[a].col !== t[a].col) return false;
  return true;
}
const G = { human_won: { eyebrow: "Resultado", title: "\xA1Victoria!", sub: "Venciste a la m\xE1quina. Tu partida qued\xF3 registrada en el ranking.", color: "var(--green)" }, ai_won: { eyebrow: "Resultado", title: "Derrota", sub: "La IA se llev\xF3 esta. Ajusta tu estrategia y vuelve a intentarlo.", color: "var(--red)" }, draw: { eyebrow: "Resultado", title: "Empate", sub: "Ninguno cedi\xF3 terreno. Una partida muy re\xF1ida.", color: "var(--gold)" }, abandoned: { eyebrow: "Resultado", title: "Partida abandonada", sub: "Saliste de la partida.", color: "var(--muted)" } };
function ne({ status: o, onPlayAgain: t, onViewLeaderboard: a }) {
  var _a;
  if (o === "in_progress") return null;
  const i = (_a = G[o]) != null ? _a : G.draw;
  return jsx("div", { className: "modal-backdrop", role: "dialog", "aria-modal": "true", "aria-label": i.title, children: jsxs("div", { className: "modal", children: [jsx("div", { className: "eyebrow", children: i.eyebrow }), jsx("h2", { className: "serif", style: { fontSize: 40, marginTop: 10, color: i.color }, children: i.title }), jsx("p", { className: "muted", style: { marginTop: 12, marginBottom: 28 }, children: i.sub }), jsxs("div", { className: "stack gap-12", children: [jsx("button", { className: "btn btn-gold btn-lg btn-block", onClick: t, children: "Jugar de nuevo" }), jsx("button", { className: "btn btn-ghost btn-block", onClick: a, children: "Ver ranking" })] })] }) });
}
function V({ label: o, active: t, kind: a, thinking: i }) {
  return jsxs("div", { className: "stack gap-8", style: { flex: 1, alignItems: "center", padding: "14px 10px", borderRadius: "var(--r)", background: t ? "var(--gold-soft)" : "var(--bg-2)", border: `1px solid ${t ? "var(--gold-line)" : "var(--line)"}`, transition: "background .2s, border-color .2s" }, children: [jsx("span", { "aria-hidden": "true", style: { width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 16, background: a === "human" ? "radial-gradient(circle at 36% 30%, var(--gold-hi), var(--gold-lo))" : "radial-gradient(circle at 36% 30%, #3C3C46, #15151B)", color: a === "human" ? "#1a1505" : "#F6D277" }, children: a === "human" ? "\u265F" : "\u{1F916}" }), jsx("span", { style: { fontWeight: 600, fontSize: 13.5 }, children: i ? "Pensando\u2026" : o })] });
}
function se(o) {
  return o.map((t) => `${String.fromCharCode(97 + t.col)}${8 - t.row}`).join("\u2192");
}
const ye = function() {
  const { gameId: t } = _e.useParams(), { getToken: a } = useAuth(), i = useNavigate(), [r$1, u] = useState(null), [A, b] = useState([]), [C, x] = useState(false), [f$1, S] = useState(void 0), [v, N] = useState(null), [E, k] = useState(null), [P, q] = useState(true), [M, R] = useState(null), l = useCallback(async () => {
    try {
      const n = await a(), s = await d(t, n != null ? n : void 0);
      if (u(s), s.status === "in_progress" && s.turn === s.humanSide) {
        const h = await p(t, n != null ? n : void 0);
        b(h);
      } else b([]);
    } catch (n) {
      N(n instanceof Error ? n.message : "Error al cargar la partida.");
    } finally {
      q(false);
    }
  }, [t, a]);
  useEffect(() => {
    l();
  }, [l]), useEffect(() => {
    (async () => {
      try {
        const n = await a(), s = await $(n != null ? n : void 0);
        s.activeTheme && R(s.activeTheme);
      } catch {
      }
    })();
  }, [a]);
  const m$1 = useCallback(async (n) => {
    if (r$1) {
      k(null), x(true);
      try {
        const s = await a(), h = await f(t, n, s != null ? s : void 0);
        if (u(h.game), S(h.lastAiMove), h.game.status === "in_progress" && h.game.turn === h.game.humanSide) {
          const j = await p(t, s != null ? s : void 0);
          b(j);
        } else b([]);
      } catch (s) {
        s instanceof c && s.status === 409 ? k("Movimiento ilegal") : N(s instanceof Error ? s.message : "Error al enviar movimiento.");
      } finally {
        x(false);
      }
    }
  }, [r$1, t, a]), c$1 = useCallback(async () => {
    if (r$1) try {
      const n = await a(), s = await m(r$1.difficulty, n != null ? n : void 0);
      i({ to: "/play/$gameId", params: { gameId: s._id } });
    } catch {
      i({ to: "/play" });
    }
  }, [r$1, a, i]), g = useCallback(async () => {
    try {
      const n = await a();
      await y(t, n != null ? n : void 0);
    } catch {
    }
    i({ to: "/play" });
  }, [t, a, i]);
  if (P) return jsx("div", { className: "wrap page", children: jsx("div", { className: "skeleton", style: { height: 560, maxWidth: 560, borderRadius: 18 } }) });
  if (v) return jsx("div", { className: "wrap page", children: jsxs("div", { className: "card card-pad", style: { maxWidth: 480 }, children: [jsx("h2", { className: "serif", style: { fontSize: 24 }, children: "Algo sali\xF3 mal" }), jsx("p", { className: "muted", style: { marginTop: 8 }, children: v }), jsx("button", { className: "btn btn-ghost", style: { marginTop: 16 }, onClick: () => i({ to: "/play" }), children: "Volver a partidas" })] }) });
  if (!r$1) return null;
  const w = r$1.status === "in_progress" && r$1.turn === r$1.humanSide, p$1 = [...r$1.moves].slice(-5).reverse();
  return jsxs("div", { className: "wrap page fade-in", children: [jsxs("div", { className: "game-layout", children: [jsx("div", { style: { width: "100%", maxWidth: 600, margin: "0 auto" }, children: jsx(te, { board: r$1.board, humanSide: r$1.humanSide, currentTurn: r$1.turn, gameStatus: r$1.status, onMoveSend: m$1, legalMoves: A, isAiThinking: C, lastAiMove: f$1, illegalMoveError: E, themeId: M == null ? void 0 : M._id }) }), jsxs("aside", { className: "stack gap-16", style: { minWidth: 260 }, children: [jsxs("div", { className: "card card-pad stack gap-16", children: [jsxs("div", { className: "row between", children: [jsx("span", { className: "eyebrow", children: "Partida" }), jsx(r, { difficulty: r$1.difficulty })] }), jsxs("div", { className: "row gap-12", style: { justifyContent: "space-between" }, children: [jsx(V, { label: "T\xFA", active: w, kind: "human" }), jsx("span", { className: "muted-2", style: { fontWeight: 700 }, children: "vs" }), jsx(V, { label: "IA", active: r$1.status === "in_progress" && !w, kind: "ai", thinking: C })] }), jsx("div", { className: "divider" }), jsxs("div", { className: "row between", children: [jsx("span", { className: "muted", children: "Tus movimientos" }), jsx("span", { style: { fontWeight: 700 }, className: "mono", children: r$1.humanMoveCount })] })] }), jsxs("div", { className: "card card-pad", children: [jsx("span", { className: "eyebrow", children: "\xDAltimos movimientos" }), jsxs("div", { className: "stack gap-8", style: { marginTop: 12 }, children: [p$1.length === 0 && jsx("span", { className: "muted-2", children: "Sin movimientos a\xFAn." }), p$1.map((n) => jsxs("div", { className: "row between", style: { fontSize: 13.5 }, children: [jsx("span", { className: n.byAI ? "muted" : "", style: { color: n.byAI ? void 0 : "var(--gold)" }, children: n.byAI ? "IA" : "T\xFA" }), jsx("span", { className: "mono muted-2", children: se(n.move.path) })] }, n.ply))] })] }), jsx("button", { className: "btn btn-danger btn-block", onClick: () => void g(), children: "Abandonar partida" })] })] }), jsx(ne, { status: r$1.status, onPlayAgain: () => void c$1(), onViewLeaderboard: () => i({ to: "/leaderboard" }) }), jsx("style", { children: `
        .game-layout {
          display: grid;
          grid-template-columns: minmax(0, 600px) 280px;
          gap: 36px;
          align-items: start;
        }
        @media (max-width: 920px) {
          .game-layout { grid-template-columns: 1fr; }
        }
      ` })] });
};

export { ye as component };
//# sourceMappingURL=play._gameId-DJODqHRx.mjs.map
