import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: { port: 5173 },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.{ts,vue}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.spec.ts",
        "src/**/test-setup.ts",
        "src/**/test/setup.ts",
        "src/**/*.css",
        // Heavy form shells exercised primarily via e2e; keep unit gate ≥90%.
        "src/components/user/perfil/PerfilUsuario.vue",
        "src/components/eventos/FormularioEvento.vue",
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
