import { animate, style, transition, trigger } from '@angular/animations';
import { motionDuration } from './motion-timing';

export const emptyAnimation = trigger('emptyFade', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate(motionDuration(220), style({ opacity: 1 })),
  ]),
]);
