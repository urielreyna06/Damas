import { defineConfig } from "@tanstack/start/config";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // Project keeps routes/entries under src/ instead of the default app/
  tsr: {
    appDirectory: "src",
  },
  vite: {
    plugins: [viteTsConfigPaths()],
    // @ts-expect-error server HMR config not in StartUserViteConfig types but works at runtime
    server: {
      hmr: {
        port: 24678,
        clientPort: 24678,
      },
    },
  },
});
