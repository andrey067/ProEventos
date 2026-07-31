import { animate, style, transition, trigger } from '@angular/animations';
import { motionDuration } from './motion-timing';

export const alertAnimation = trigger('alertMotion', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-4px)' }),
    animate(motionDuration(220), style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
  transition(':leave', [animate(motionDuration(220), style({ opacity: 0 }))]),
]);
