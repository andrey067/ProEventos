export const PAGE_SIZES = [10, 20, 30] as const;

export type PageSize = (typeof PAGE_SIZES)[number];

export interface PaginateResult<T> {
  items: T[];
  page: number;
  pageSize: PageSize;
  totalItems: number;
  totalPages: number;
}

export function paginate<T>(items: T[], page: number, pageSize: PageSize): PaginateResult<T> {
  const totalItems = items.length;
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
  };
}
