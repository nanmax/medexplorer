import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    globals: true,
    environment: "node",
    coverage: {
      reporter: ["text", "lcov"],
      include: ["src/application/**", "src/domain/**"],
      thresholds: { lines: 80, statements: 80, functions: 80, branches: 70 },
    },
  },
  resolve: {
    alias: {
      "@medexplorer/shared": new URL("../../packages/shared/src/index.ts", import.meta.url).pathname,
    },
  },
});
