import { jsxs, jsx } from 'react/jsx-runtime';

const s = { easy: "F\xE1cil", medium: "Medio", hard: "Dif\xEDcil" }, i = { easy: "badge badge-easy", medium: "badge badge-medium", hard: "badge badge-hard" };
function r({ difficulty: a }) {
  return jsxs("span", { className: i[a], children: [jsx("span", { className: "dot" }), s[a]] });
}

export { r };
//# sourceMappingURL=DifficultyBadge-DXL-G_TY.mjs.map
