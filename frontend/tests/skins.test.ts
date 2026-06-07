import { describe, it, expect } from "vitest";
import { resolveSkin, SKINS, skinStyle } from "../src/lib/skins";

describe("resolveSkin", () => {
  it("devuelve el skin emerald por defecto sin themeId", () => {
    expect(resolveSkin(undefined).id).toBe("emerald");
    expect(resolveSkin(null).id).toBe("emerald");
  });

  it("mapea los theme ids del backend a los skins de diseño", () => {
    expect(resolveSkin("classic_wood").id).toBe("wood");
    expect(resolveSkin("neon_glow").id).toBe("neon");
    expect(resolveSkin("marble_board").id).toBe("marble");
    expect(resolveSkin("vector_classic").id).toBe("vector");
    expect(resolveSkin("retro_pixel").id).toBe("pixel");
  });

  it("cae al default emerald ante un theme id desconocido", () => {
    expect(resolveSkin("does_not_exist").id).toBe("emerald");
  });

  it("acepta también un id de skin de diseño directamente", () => {
    expect(resolveSkin("neon").id).toBe("neon");
  });
});

describe("SKINS", () => {
  it("define las 6 skins con todas las CSS vars requeridas", () => {
    const required = ["--sq-light", "--sq-dark", "--frame", "--edge", "--h1", "--h2", "--hk", "--a1", "--a2", "--ak"];
    expect(Object.keys(SKINS)).toHaveLength(6);
    for (const skin of Object.values(SKINS)) {
      for (const key of required) {
        expect(skin.vars).toHaveProperty(key);
      }
    }
  });
});

describe("skinStyle", () => {
  it("expone las vars del skin como propiedades de estilo", () => {
    const style = skinStyle(SKINS.neon!) as Record<string, string>;
    expect(style["--h1"]).toBe("#5FF2FF");
  });
});
