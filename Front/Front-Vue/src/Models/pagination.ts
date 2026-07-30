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

/** Build PageResult from array body + Pagination header JSON. */
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

/** Read Pagination header from axios-like headers (case-insensitive). */
export function readPaginationHeader(
  headers: Record<string, unknown> | { get?(name: string): string | null },
): string | null {
  if (headers && typeof (headers as { get?: unknown }).get === "function") {
    const h = headers as { get(name: string): string | null };
    return h.get(PAGINATION_HEADER) ?? h.get(PAGINATION_HEADER.toLowerCase());
  }
  const record = headers as Record<string, unknown>;
  const value =
    record[PAGINATION_HEADER] ??
    record[PAGINATION_HEADER.toLowerCase()] ??
    record["pagination"];
  if (Array.isArray(value)) return String(value[0] ?? "");
  return value == null ? null : String(value);
}
