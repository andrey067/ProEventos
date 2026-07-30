import { defineConfig, devices } from "@playwright/test";

const apiUrl = process.env.API_URL ?? "http://localhost:5050";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    trace: "on-first-retry",
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
  },
  projects: [
    {
      name: "vue",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5173" },
    },
    {
      name: "react",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3000" },
    },
    {
      name: "angular",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:4200" },
    },
  ],
  metadata: { apiUrl },
});
