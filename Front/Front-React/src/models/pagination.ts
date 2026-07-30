export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export const PAGE_SIZES = [10, 20, 30] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export const PAGINATION_HEADER = "Pagination";

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export function pageResultFromHeader<T>(
  items: T[] | null | undefined,
  headerRaw: string | null | undefined,
): PageResult<T> {
  const list = items ?? [];
  if (!headerRaw?.trim()) {
    throw new Error("Cabeçalho Pagination ausente na resposta");
  }
  const meta = JSON.parse(headerRaw) as PaginationMeta;
  return {
    items: list,
    page: meta.currentPage,
    pageSize: meta.itemsPerPage,
    totalCount: meta.totalItems,
    totalPages: meta.totalPages,
  };
}
