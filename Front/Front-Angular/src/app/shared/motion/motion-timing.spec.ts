import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  motionDuration,
  motionEnterY,
  motionStagger,
} from './motion-timing';

function mockMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('motion-timing', () => {
  it('uses full duration, stagger and enterY when motion is allowed', () => {
    mockMatchMedia(false);
    expect(motionDuration(220)).toBe('220ms cubic-bezier(0.16, 1, 0.3, 1)');
    expect(motionDuration(320)).toBe('320ms cubic-bezier(0.16, 1, 0.3, 1)');
    expect(motionStagger(40)).toBe(40);
    expect(motionEnterY(8)).toBe('translateY(8px)');
  });

  it('collapses duration, stagger and enterY under reduced motion', () => {
    mockMatchMedia(true);
    expect(motionDuration(220)).toBe('0ms');
    expect(motionDuration(320)).toBe('0ms');
    expect(motionStagger(40)).toBe(0);
    expect(motionEnterY(8)).toBe('none');
  });
});
