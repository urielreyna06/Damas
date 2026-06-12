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
  // PNG clan skins — tiles/pieces/frame loaded from /skins/{id}/*.png
  templo: {
    id: "templo", dataSkin: "templo", name: "Templo del Tiempo",
    vars: { "--sq-light": "#C4B89A", "--sq-dark": "#2E3D28", "--frame": "#1A150E",
            "--edge": "rgba(193,152,80,0.50)", "--h1": "#C4A24A", "--h2": "#7A6228", "--hk": "#3e2f0e",
            "--a1": "#4A3040", "--a2": "#1E1018", "--ak": "#0e0008" },
  },
  desierto: {
    id: "desierto", dataSkin: "desierto", name: "Clan del Desierto",
    vars: { "--sq-light": "#D4A831", "--sq-dark": "#3A1850", "--frame": "#1E0E02",
            "--edge": "rgba(220,180,60,0.55)", "--h1": "#E8C040", "--h2": "#9A7018", "--hk": "#4a3008",
            "--a1": "#8A1E28", "--a2": "#3A0A10", "--ak": "#1a0408" },
  },
  bosque: {
    id: "bosque", dataSkin: "bosque", name: "Clan del Bosque",
    vars: { "--sq-light": "#A8C470", "--sq-dark": "#1E3A18", "--frame": "#0E1C08",
            "--edge": "rgba(80,180,80,0.50)", "--h1": "#70C050", "--h2": "#2E6018", "--hk": "#0e3008",
            "--a1": "#3A5010", "--a2": "#1A2808", "--ak": "#081404" },
  },
  hada: {
    id: "hada", dataSkin: "hada", name: "Clan de las Hadas",
    vars: { "--sq-light": "#C8B8F0", "--sq-dark": "#1A1458", "--frame": "#0A0828",
            "--edge": "rgba(120,140,255,0.60)", "--h1": "#80A8F8", "--h2": "#3050C0", "--hk": "#102060",
            "--a1": "#D040A8", "--a2": "#601848", "--ak": "#300824" },
  },
  fuego: {
    id: "fuego", dataSkin: "fuego", name: "Clan del Fuego",
    vars: { "--sq-light": "#C07040", "--sq-dark": "#1A0802", "--frame": "#0A0400",
            "--edge": "rgba(255,120,40,0.60)", "--h1": "#E08030", "--h2": "#803010", "--hk": "#401808",
            "--a1": "#D04820", "--a2": "#600C04", "--ak": "#300402" },
  },
  agua: {
    id: "agua", dataSkin: "agua", name: "Clan del Agua",
    vars: { "--sq-light": "#80C8D8", "--sq-dark": "#0A2840", "--frame": "#04121C",
            "--edge": "rgba(40,180,220,0.55)", "--h1": "#40C0D0", "--h2": "#106878", "--hk": "#043040",
            "--a1": "#2040A8", "--a2": "#081848", "--ak": "#040824" },
  },
  sombra: {
    id: "sombra", dataSkin: "sombra", name: "Clan de la Sombra",
    vars: { "--sq-light": "#686868", "--sq-dark": "#0C0C0C", "--frame": "#060406",
            "--edge": "rgba(140,60,200,0.55)", "--h1": "#A8A8C0", "--h2": "#505070", "--hk": "#202030",
            "--a1": "#40A040", "--a2": "#184818", "--ak": "#0a200a" },
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
