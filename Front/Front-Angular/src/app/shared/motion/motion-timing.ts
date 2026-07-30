import { prefersReducedMotion } from './prefers-reduced-motion';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/** Duration string for Angular `animate()`; collapses under reduced motion. */
export function motionDuration(ms: number): string {
  return prefersReducedMotion() ? '0ms' : `${ms}ms ${EASE}`;
}

/** Stagger delay in ms; 0 under reduced motion. */
export function motionStagger(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}

/** Initial translateY for enter; `none` under reduced motion. */
export function motionEnterY(px: number): string {
  return prefersReducedMotion() ? 'none' : `translateY(${px}px)`;
}
