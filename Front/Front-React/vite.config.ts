import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/test-setup.ts",
        "src/**/test/setup.ts",
        "src/**/*.css",
        // Heavy auth/profile shells; covered by unit specs + e2e journeys.
        "src/components/user/RegisterPage.tsx",
        "src/components/user/ProfilePage.tsx",
        "src/components/user/PerfilDetalhe.tsx",
        "src/components/user/PalestranteDetalhe.tsx",
        "src/components/user/RedesSociais.tsx",
        "src/components/user/ChangePasswordPage.tsx",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
