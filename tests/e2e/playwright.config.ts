import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Spin up the dev stack if not already running:
  webServer: process.env.SKIP_WEB_SERVER
    ? undefined
    : [
        {
          command: "bun run --filter @medexplorer/api dev",
          port: 3000,
          cwd: "../..",
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
        {
          command: "bun run --filter @medexplorer/web dev",
          port: 5173,
          cwd: "../..",
          reuseExistingServer: !process.env.CI,
          timeout: 60_000,
        },
      ],
});
