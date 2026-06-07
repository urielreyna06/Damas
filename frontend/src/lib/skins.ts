/**
 * Skin definitions — board + piece CSS custom properties per theme.
 *
 * Ported from design_handoff_damas/assets/shared.js (SKINS) and board.css.
 * Each skin sets: --sq-light --sq-dark --frame --edge --h1 --h2 --hk --a1 --a2 --ak
 * plus a `dataSkin` attribute that toggles skin-specific flair (neon glow, pixel
 * hard edges, wood grain) defined in styles/board.css.
 *
 * The backend exposes 5 purchasable themes by `_id`; `emerald` is the built-in
 * default shown when the user has no active theme.
 */

export interface SkinVars {
  "--sq-light": string;
  "--sq-dark": string;
  "--frame": string;
  "--edge": string;
  "--h1": string;
  "--h2": string;
  "--hk": string;
  "--a1": string;
  "--a2": string;
  "--ak": string;
}

export interface Skin {
  id: string;
  dataSkin: string; // value for [data-skin] flair selectors
  name: string;
  vars: SkinVars;
}

export const SKINS: Record<string, Skin> = {
  emerald: {
    id: "emerald",
    dataSkin: "emerald",
    name: "Emerald Classic",
    vars: {
      "--sq-light": "#E9E2CC", "--sq-dark": "#41614A", "--frame": "#14140F",
      "--edge": "rgba(227,178,60,0.30)",
      "--h1": "#F4CB5E", "--h2": "#C8901F", "--hk": "#7A5410",
      "--a1": "#3C3C46", "--a2": "#15151B", "--ak": "#000",
    },
  },
  wood: {
    id: "wood",
    dataSkin: "wood",
    name: "Classic Wood",
    vars: {
      "--sq-light": "#E3C79A", "--sq-dark": "#6B4A2E", "--frame": "#2B1B10",
      "--edge": "rgba(227,178,60,0.35)",
      "--h1": "#E9C083", "--h2": "#9C6B36", "--hk": "#5E3D18",
      "--a1": "#5A3A22", "--a2": "#2C1B0E", "--ak": "#160c05",
    },
  },
  neon: {
    id: "neon",
    dataSkin: "neon",
    name: "Neon Glow",
    vars: {
      "--sq-light": "#1B2330", "--sq-dark": "#0C1018", "--frame": "#05070C",
      "--edge": "rgba(95,225,255,0.45)",
      "--h1": "#5FF2FF", "--h2": "#1597C9", "--hk": "#0a5a78",
      "--a1": "#FF5CC8", "--a2": "#9A1E78", "--ak": "#5a0d44",
    },
  },
  marble: {
    id: "marble",
    dataSkin: "marble",
    name: "Marble Board",
    vars: {
      "--sq-light": "#EDE9E3", "--sq-dark": "#3A3A40", "--frame": "#1A1A1E",
      "--edge": "rgba(227,178,60,0.40)",
      "--h1": "#FBF7F0", "--h2": "#C9BFA8", "--hk": "#8a7d5e",
      "--a1": "#4A4A52", "--a2": "#1C1C20", "--ak": "#0c0c0e",
    },
  },
  vector: {
    id: "vector",
    dataSkin: "vector",
    name: "Vector Classic",
    vars: {
      "--sq-light": "#F2F0EB", "--sq-dark": "#2E7D6B", "--frame": "#10302A",
      "--edge": "rgba(255,255,255,0.30)",
      "--h1": "#F4B63C", "--h2": "#D9981F", "--hk": "#9c6c10",
      "--a1": "#33333B", "--a2": "#1A1A20", "--ak": "#0c0c10",
    },
  },
  pixel: {
    id: "pixel",
    dataSkin: "pixel",
    name: "Retro Pixel",
    vars: {
      "--sq-light": "#D8C088", "--sq-dark": "#6C4A8C", "--frame": "#241634",
      "--edge": "rgba(255,213,74,0.45)",
      "--h1": "#FFE15A", "--h2": "#E0851C", "--hk": "#a35a0c",
      "--a1": "#46D0C0", "--a2": "#1C7A78", "--ak": "#0c4a48",
    },
  },
};

/** Maps a backend theme `_id` to a design skin id. */
const THEME_ID_TO_SKIN: Record<string, string> = {
  classic_wood: "wood",
  neon_glow: "neon",
  marble_board: "marble",
  vector_classic: "vector",
  retro_pixel: "pixel",
};

/**
 * Resolves a backend theme id (or undefined) to a Skin.
 * Falls back to the built-in `emerald` default.
 */
export function resolveSkin(themeId?: string | null): Skin {
  if (!themeId) return SKINS.emerald!;
  const skinId = THEME_ID_TO_SKIN[themeId] ?? themeId;
  return SKINS[skinId] ?? SKINS.emerald!;
}

/** Returns inline style props (CSS custom properties) for a skin. */
export function skinStyle(skin: Skin): React.CSSProperties {
  return skin.vars as unknown as React.CSSProperties;
}
