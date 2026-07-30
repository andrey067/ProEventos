import { describe, expect, it } from "vitest";
import { PAGE_SIZES, paginate } from "./pagination";

describe("paginate", () => {
  it("returns empty page when no items", () => {
    expect(paginate([], 1, 10)).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
    });
  });

  it("slices items for requested page", () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1);
    const page2 = paginate(items, 2, 10);
    expect(page2.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(page2.page).toBe(2);
    expect(page2.totalPages).toBe(3);
  });

  it("clamps page below 1 and above totalPages", () => {
    const items = [1, 2, 3];
    expect(paginate(items, 0, 10).page).toBe(1);
    expect(paginate(items, 99, 10).page).toBe(1);
  });

  it("exposes PAGE_SIZES constant", () => {
    expect(PAGE_SIZES).toEqual([10, 20, 30]);
  });
});
