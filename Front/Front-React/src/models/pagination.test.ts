import { describe, expect, it } from "vitest";
import { PAGE_SIZES, pageResultFromHeader } from "./pagination";

const header = JSON.stringify({
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 1,
  totalPages: 1,
});

describe("pagination model", () => {
  it("parses pagination header into PageResult", () => {
    expect(pageResultFromHeader([{ id: 1 }], header)).toEqual({
      items: [{ id: 1 }],
      page: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
    });
  });

  it("throws when header is missing", () => {
    expect(() => pageResultFromHeader([], "")).toThrow(
      "Cabeçalho Pagination ausente",
    );
  });

  it("defaults items to empty array when null", () => {
    expect(pageResultFromHeader(null, header).items).toEqual([]);
  });

  it("exports PAGE_SIZES", () => {
    expect(PAGE_SIZES).toEqual([10, 20, 30]);
  });
});
