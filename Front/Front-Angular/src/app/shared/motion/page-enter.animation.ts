import { animate, style, transition, trigger } from '@angular/animations';
import { motionDuration, motionEnterY } from './motion-timing';

export const pageEnterAnimation = trigger('pageEnter', [
  transition(':enter', [
    style({ transform: motionEnterY(8) }),
    animate(motionDuration(220), style({ transform: 'translateY(0)' })),
  ]),
]);
