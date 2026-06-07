import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/rules/**", "src/stripe/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
      },
    },
    alias: {
      "@damas/shared": new URL("../packages/shared/src/types.ts", import.meta.url).pathname,
    },
  },
});
