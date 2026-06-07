import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';
import { g } from './api-BJy07AZB.mjs';

const f = { easy: "F\xE1cil", medium: "Medio", hard: "Dif\xEDcil" }, y = { 1: { color: "#F4CB5E", ring: "rgba(227,178,60,.45)" }, 2: { color: "#C8CDD6", ring: "rgba(200,205,214,.4)" }, 3: { color: "#D7975B", ring: "rgba(215,151,91,.4)" } };
function x({ entries: i, difficulty: t }) {
  return i.length === 0 ? jsxs("div", { className: "card card-pad", style: { textAlign: "center", padding: 56 }, children: [jsxs("p", { className: "muted", children: ["A\xFAn no hay partidas ganadas en dificultad ", f[t], "."] }), jsx("p", { className: "muted-2", style: { fontSize: 13.5, marginTop: 6 }, children: "Gana una partida para aparecer aqu\xED." })] }) : jsxs("div", { className: "card", style: { overflow: "hidden" }, children: [jsxs("table", { className: "lb-table", children: [jsx("thead", { children: jsxs("tr", { children: [jsx("th", { style: { width: 64 }, children: "#" }), jsx("th", { children: "Jugador" }), jsx("th", { style: { textAlign: "center" }, children: "Mov." }), jsx("th", { style: { textAlign: "center" }, children: "Tiempo" }), jsx("th", { style: { textAlign: "center" }, children: "Fecha" })] }) }), jsx("tbody", { children: i.map((a, d) => {
    const s = d + 1, n = y[s];
    return jsxs("tr", { className: n ? "lb-top" : "", children: [jsx("td", { children: jsx("span", { className: "lb-rank", style: n ? { color: n.color, boxShadow: `inset 0 0 0 1px ${n.ring}` } : void 0, children: s }) }), jsx("td", { style: { fontWeight: n ? 600 : 400 }, children: a.displayName }), jsx("td", { style: { textAlign: "center" }, className: "mono", children: a.movementsToWin }), jsx("td", { style: { textAlign: "center" }, className: "mono", children: v(a.gameDurationMs) }), jsx("td", { style: { textAlign: "center" }, className: "muted-2", children: new Date(a.endedAt).toLocaleDateString() })] }, a._id);
  }) })] }), jsx("style", { children: `
        .lb-table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
        .lb-table thead th {
          text-align: left; padding: 14px 18px; font-size: 12px; font-weight: 600;
          letter-spacing: .08em; text-transform: uppercase; color: var(--muted-2);
          border-bottom: 1px solid var(--line);
        }
        .lb-table tbody td { padding: 13px 18px; border-bottom: 1px solid var(--line); }
        .lb-table tbody tr:last-child td { border-bottom: none; }
        .lb-table tbody tr { transition: background .15s; }
        .lb-table tbody tr:hover { background: var(--bg-2); }
        .lb-table tbody tr.lb-top { background: var(--gold-soft); }
        .lb-table tbody tr.lb-top:hover { background: rgba(227,178,60,.2); }
        .lb-rank {
          display: inline-grid; place-items: center; width: 30px; height: 30px;
          border-radius: 50%; background: var(--bg-2); font-weight: 700; font-size: 13.5px;
        }
      ` })] });
}
function v(i) {
  const t = Math.floor(i / 1e3), a = Math.floor(t / 60), d = t % 60;
  return `${a}:${String(d).padStart(2, "0")}`;
}
const N = ["easy", "medium", "hard"], k = { easy: "F\xE1cil", medium: "Medio", hard: "Dif\xEDcil" }, L = function() {
  const [t, a] = useState("easy"), [d, s] = useState([]), [n, m] = useState(false), [p, h] = useState(null);
  useEffect(() => {
    b(t);
  }, [t]);
  async function b(o) {
    m(true), h(null);
    try {
      const r = await g(o, 20);
      s(r);
    } catch (r) {
      h(r instanceof Error ? r.message : "Error al cargar el ranking.");
    } finally {
      m(false);
    }
  }
  return jsxs("div", { className: "wrap page fade-in", style: { maxWidth: 760 }, children: [jsxs("div", { className: "stack gap-8", style: { marginBottom: 24 }, children: [jsx("span", { className: "eyebrow", children: "Clasificaci\xF3n" }), jsx("h1", { style: { fontSize: "clamp(32px, 4vw, 44px)" }, children: "Ranking global" }), jsx("p", { className: "muted", children: "Los mejores tiempos por dificultad. Solo cuentan las victorias contra la IA; el desempate es por n\xFAmero de movimientos y luego por tiempo." })] }), jsx("div", { role: "radiogroup", "aria-label": "Filtrar ranking por dificultad", className: "row gap-8", style: { marginBottom: 22 }, children: N.map((o) => {
    const r = t === o;
    return jsx("button", { role: "radio", "aria-checked": r, onClick: () => a(o), className: `btn btn-sm ${r ? "btn-gold" : "btn-ghost"}`, children: k[o] }, o);
  }) }), p && jsxs("div", { className: "badge badge-hard", style: { marginBottom: 16, padding: "8px 14px" }, children: [jsx("span", { className: "dot" }), p] }), n ? jsx("div", { className: "card card-pad stack gap-12", children: Array.from({ length: 6 }).map((o, r) => jsx("div", { className: "skeleton", style: { height: 28 } }, r)) }) : jsx(x, { entries: d, difficulty: t })] });
};

export { L as component };
//# sourceMappingURL=leaderboard-DONQJIj-.mjs.map
