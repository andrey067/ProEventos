import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SkeletonShimmerComponent } from './skeleton-shimmer.component';

afterEach(() => vi.unstubAllGlobals());

describe('SkeletonShimmerComponent', () => {
  it('renders N placeholder rows', async () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    await TestBed.configureTestingModule({
      imports: [SkeletonShimmerComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SkeletonShimmerComponent);
    fixture.componentInstance.rows = 3;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.motion-skeleton').length,
    ).toBe(3);
  });
});
