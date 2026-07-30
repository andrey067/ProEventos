import {
  animate,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { motionDuration } from './motion-timing';

export const routeFadeAnimation = trigger('routeFade', [
  transition('* <=> *', [
    query(
      ':enter',
      [style({ opacity: 0 }), animate(motionDuration(320), style({ opacity: 1 }))],
      { optional: true },
    ),
  ]),
]);
