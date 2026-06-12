import { defineConfig } from "@tanstack/start/config";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // Project keeps routes/entries under src/ instead of the default app/
  tsr: {
    appDirectory: "src",
  },
  vite: {
    plugins: [viteTsConfigPaths()],
    // Pre-bundle critical deps so Vite doesn't trigger "optimized dependencies changed. reloading"
    // on first browser visit. Without this, Vite discovers them lazily, forces a reload, and
    // regenerates its security token — causing the HMR WebSocket to reconnect with a stale token
    // and receive a 400, which fills the console with noise and breaks hot reload.
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "@tanstack/react-router",
        "@tanstack/start",
        "@clerk/tanstack-start",
      ],
    },
    // @ts-expect-error server HMR config not in StartUserViteConfig types but works at runtime
    server: {
      hmr: {
        port: 24678,
        clientPort: 24678,
      },
    },
  },
});
