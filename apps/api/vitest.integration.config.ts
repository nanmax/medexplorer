import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    globals: true,
    environment: "node",
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      "@medexplorer/shared": new URL("../../packages/shared/src/index.ts", import.meta.url).pathname,
    },
  },
});
