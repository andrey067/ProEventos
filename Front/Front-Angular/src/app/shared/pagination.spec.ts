import { describe, expect, it } from 'vitest';
import { PAGE_SIZES, paginate } from './pagination';

describe('paginate', () => {
  it('returns empty slice when list is empty', () => {
    expect(paginate([], 1, 10)).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
    });
  });

  it('returns page slice and clamps page number', () => {
    const items = Array.from({ length: 12 }, (_, i) => i + 1);
    expect(paginate(items, 2, 10)).toMatchObject({
      items: [11, 12],
      page: 2,
      pageSize: 10,
      totalItems: 12,
      totalPages: 2,
    });
    expect(paginate(items, 0, 10).page).toBe(1);
    expect(paginate(items, 9, 10).page).toBe(2);
  });

  it('exposes PAGE_SIZES', () => {
    expect(PAGE_SIZES).toEqual([10, 20, 30]);
  });
});
