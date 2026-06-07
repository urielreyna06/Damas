import { jsx } from 'react/jsx-runtime';
import { useMemo } from 'react';
import { o, s } from './skins-COKJgQCr.mjs';

function h() {
  const a = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let i = 0; i < 8; i++) for (let s = 0; s < 8; s++) (i + s) % 2 === 1 && (i <= 2 ? a[i][s] = { side: "ai" } : i >= 5 && (a[i][s] = { side: "human" }));
  return a;
}
function y({ themeId: a, skin: i, mini: s$1 = false }) {
  const e = i != null ? i : s(a), o$1 = useMemo(h, []);
  return jsx("div", { className: `dboard${s$1 ? " mini" : ""}`, "data-skin": e.dataSkin, style: o(e), "aria-hidden": "true", children: jsx("div", { className: "dboard-grid", children: o$1.flatMap((l, n) => l.map((t, d) => {
    const c = (n + d) % 2 === 1;
    return jsx("div", { className: `sq ${c ? "dark" : "light"}`, children: t && jsx("div", { className: `piece ${t.side}`, "data-finish": "glossy", children: jsx("span", { className: "disc" }) }) }, `${n}-${d}`);
  })) }) });
}

export { y };
//# sourceMappingURL=StaticBoard-BcFT7AYp.mjs.map
