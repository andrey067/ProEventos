import {
  animate,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { prefersReducedMotion } from './prefers-reduced-motion';

const ms = () => (prefersReducedMotion() ? '0ms' : '320ms cubic-bezier(0.16, 1, 0.3, 1)');

export const routeFadeAnimation = trigger('routeFade', [
  transition('* <=> *', [
    query(
      ':enter',
      [style({ opacity: 0 }), animate(ms(), style({ opacity: 1 }))],
      { optional: true },
    ),
  ]),
]);
