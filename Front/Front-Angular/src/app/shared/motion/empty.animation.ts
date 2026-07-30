import { animate, style, transition, trigger } from '@angular/animations';
import { prefersReducedMotion } from './prefers-reduced-motion';

const d = () =>
  prefersReducedMotion() ? '0ms' : '220ms cubic-bezier(0.16, 1, 0.3, 1)';

export const emptyAnimation = trigger('emptyFade', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(d(), style({ opacity: 1 })),
  ]),
]);
