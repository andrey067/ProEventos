import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { defineConfig } from 'vitest/config';

/** Inlines Angular templateUrl/styleUrl so Vitest JIT can compile components. */
function angularComponentResources() {
  return {
    name: 'angular-component-resources',
    enforce: 'pre' as const,
    transform(code: string, id: string) {
      if (!id.endsWith('.ts') || id.includes('.spec.') || (!code.includes('templateUrl') && !code.includes('styleUrl'))) {
        return null;
      }

      const dir = dirname(id.split('?')[0]);
      let next = code;

      next = next.replace(/templateUrl:\s*['"]([^'"]+)['"]/g, (_match, relPath: string) => {
        const content = readFileSync(join(dir, relPath), 'utf-8');
        return `template: ${JSON.stringify(content)}`;
      });

      next = next.replace(/styleUrl:\s*['"]([^'"]+)['"]/g, (_match, relPath: string) => {
        const content = readFileSync(join(dir, relPath), 'utf-8');
        return `styles: [${JSON.stringify(content)}]`;
      });

      return next === code ? null : { code: next, map: null };
    },
  };
}

export default defineConfig({
  envPrefix: ['NG_APP_', 'VITE_'],
  plugins: [angularComponentResources()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.spec.ts',
        'src/**/test-setup.ts',
        'src/**/test/setup.ts',
        'src/**/*.css',
        'src/**/*.scss',
        'src/**/*.html',
        // Deep form shells covered by e2e + existing specs.
        'src/app/components/user/profile/profile.component.ts',
        'src/app/components/user/profile/perfil-detalhe/perfil-detalhe.component.ts',
        'src/app/components/user/profile/palestrante-detalhe/palestrante-detalhe.component.ts',
        'src/app/components/user/profile/redes-sociais/redes-sociais.component.ts',
        'src/app/components/eventos/evento-form/evento-form.component.ts',
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
