import { animate, style, transition, trigger } from '@angular/animations';
import { motionDuration } from './motion-timing';

export const panelEnterAnimation = trigger('panelEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px)' }),
    animate(motionDuration(220), style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);
