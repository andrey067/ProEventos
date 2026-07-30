import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion } from './prefers-reduced-motion';

afterEach(() => vi.unstubAllGlobals());

it('returns true when media matches', () => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
  expect(prefersReducedMotion()).toBe(true);
});
