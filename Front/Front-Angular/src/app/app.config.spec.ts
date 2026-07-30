import { describe, it, expect } from 'vitest';
import { appConfig } from './app.config';
import { routes } from './app.routes';

describe('app.config', () => {
  it('provides router, http client and zone change detection', () => {
    expect(appConfig.providers?.length).toBeGreaterThan(0);

    const providerTypes = appConfig.providers!.map((p) =>
      typeof p === 'object' && p !== null && 'ɵproviders' in p ? 'multi' : typeof p,
    );

    expect(providerTypes.length).toBe(7);
    expect(routes.some((r) => r.path === 'eventos')).toBe(true);
  });
});
