import { animate, style, transition, trigger } from '@angular/animations';
import { prefersReducedMotion } from './prefers-reduced-motion';

const d = () =>
  prefersReducedMotion() ? '0ms' : '220ms cubic-bezier(0.16, 1, 0.3, 1)';

export const panelEnterAnimation = trigger('panelEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate(d(), style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);
