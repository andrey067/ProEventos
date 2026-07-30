import { describe, expect, it } from "vitest";
import { PAGE_SIZES, paginate } from "./pagination";

describe("paginate", () => {
  it("returns empty result for no items", () => {
    expect(paginate([], 1, 10)).toEqual({
      items: [],
      page: 1,
      totalPages: 0,
      totalCount: 0,
    });
  });

  it("paginates and clamps page", () => {
    const items = Array.from({ length: 15 }, (_, i) => `item-${i + 1}`);
    const second = paginate(items, 2, 10);
    expect(second.items).toHaveLength(5);
    expect(second.page).toBe(2);
    expect(second.totalPages).toBe(2);
    expect(paginate(items, 99, 10).page).toBe(2);
  });

  it("exports PAGE_SIZES", () => {
    expect(PAGE_SIZES).toEqual([10, 20, 30]);
  });
});
