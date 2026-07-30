import { animate, style, transition, trigger } from '@angular/animations';
import { motionDuration } from './motion-timing';

export const modalBackdropAnimation = trigger('modalBackdrop', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(motionDuration(320), style({ opacity: 1 })),
  ]),
  transition(':leave', [animate(motionDuration(320), style({ opacity: 0 }))]),
]);

export const modalPanelAnimation = trigger('modalPanel', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.98)' }),
    animate(motionDuration(320), style({ opacity: 1, transform: 'scale(1)' })),
  ]),
  transition(':leave', [
    animate(motionDuration(320), style({ opacity: 0, transform: 'scale(0.98)' })),
  ]),
]);
