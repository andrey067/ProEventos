import { Component, Input } from '@angular/core';
import { prefersReducedMotion } from './prefers-reduced-motion';

@Component({
  selector: 'app-skeleton-shimmer',
  standalone: true,
  template: `
    <div class="flex flex-col gap-3" aria-hidden="true">
      @for (r of rowList; track r) {
        <div
          class="h-10 rounded-[length:var(--radius-control)]"
          [class.motion-skeleton]="!reduced"
          [class.bg-line]="reduced"
        ></div>
      }
    </div>
  `,
})
export class SkeletonShimmerComponent {
  @Input() rows = 4;
  reduced = prefersReducedMotion();
  get rowList(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
}
