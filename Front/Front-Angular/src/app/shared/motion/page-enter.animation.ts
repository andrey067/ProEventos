import { animate, style, transition, trigger } from '@angular/animations';
import { prefersReducedMotion } from './prefers-reduced-motion';

export const pageEnterAnimation = trigger('pageEnter', [
  transition(':enter', [
    style({ transform: prefersReducedMotion() ? 'none' : 'translateY(8px)' }),
    animate(
      prefersReducedMotion() ? '0ms' : '220ms cubic-bezier(0.16, 1, 0.3, 1)',
      style({ transform: 'translateY(0)' }),
    ),
  ]),
]);
