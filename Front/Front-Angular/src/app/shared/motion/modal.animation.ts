import { animate, style, transition, trigger } from '@angular/animations';
import { prefersReducedMotion } from './prefers-reduced-motion';

const d = () => (prefersReducedMotion() ? '0ms' : '320ms cubic-bezier(0.16, 1, 0.3, 1)');

export const modalBackdropAnimation = trigger('modalBackdrop', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(d(), style({ opacity: 1 })),
  ]),
  transition(':leave', [animate(d(), style({ opacity: 0 }))]),
]);

export const modalPanelAnimation = trigger('modalPanel', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.98)' }),
    animate(d(), style({ opacity: 1, transform: 'scale(1)' })),
  ]),
  transition(':leave', [
    animate(d(), style({ opacity: 0, transform: 'scale(0.98)' })),
  ]),
]);
