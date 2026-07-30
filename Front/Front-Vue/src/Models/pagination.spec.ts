import { describe, expect, it } from "vitest";
import {
  pageResultFromHeader,
  PAGINATION_HEADER,
  readPaginationHeader,
} from "./pagination";

const header = JSON.stringify({
  currentPage: 2,
  itemsPerPage: 20,
  totalItems: 45,
  totalPages: 3,
});

describe("pagination model helpers", () => {
  it("builds PageResult from header JSON", () => {
    const result = pageResultFromHeader([{ id: 1 }], header);
    expect(result).toEqual({
      items: [{ id: 1 }],
      page: 2,
      pageSize: 20,
      totalCount: 45,
      totalPages: 3,
    });
  });

  it("throws when header is missing", () => {
    expect(() => pageResultFromHeader([], null)).toThrow(
      "Cabeçalho Pagination ausente",
    );
  });

  it("defaults items to empty array when null", () => {
    expect(pageResultFromHeader(null, header).items).toEqual([]);
  });

  it("reads header from object or Headers-like API", () => {
    expect(readPaginationHeader({ [PAGINATION_HEADER]: header })).toBe(header);
    expect(readPaginationHeader({ pagination: header })).toBe(header);
    expect(
      readPaginationHeader({
        get: (name: string) => (name === PAGINATION_HEADER ? header : null),
      }),
    ).toBe(header);
    expect(readPaginationHeader({ [PAGINATION_HEADER]: [header] })).toBe(header);
    expect(readPaginationHeader({ [PAGINATION_HEADER]: [] })).toBe("");
    expect(readPaginationHeader({})).toBeNull();
    expect(
      readPaginationHeader({
        get: (name: string) => (name === "pagination" ? header : null),
      }),
    ).toBe(header);
  });
});
