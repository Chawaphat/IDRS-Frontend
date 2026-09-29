import { defineConfig, devices } from '@playwright/test';

/**
 * E2E configuration for the IDRS frontend.
 *
 * These specs drive the real Vite dev build in a real browser, but every
 * network dependency (the IDRS API, Supabase Auth, Supabase Storage) is stubbed
 * at the network layer by `e2e/support/mockBackend.ts`. No running backend and
 * no Supabase project are required — `npm run test:e2e` is fully self-contained.
 *
 * Covers System Test Cases STC-22 – STC-28 (Feature 4: Image Management, Feature 5: AI Detection).
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // A single shared `vite dev` instance (webServer below) backs every worker's
  // browser context. Playwright's default worker count (CPU cores, often 8+)
  // overwhelms that one dev server under concurrent load and produces flaky
  // timeouts that don't reproduce with fewer workers — capped at 2 locally.
  workers: process.env.CI ? 1 : 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 7_000 },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // The app reads Supabase config from .env at build time; the mock layer
    // intercepts every call made with it, so real values are never contacted.
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
