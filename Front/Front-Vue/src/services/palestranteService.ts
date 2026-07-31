import http from "./HttpClient";
import type { Palestrante } from "../Models/Palestrante";
import type { PageResult } from "../Models/pagination";
import {
  pageResultFromHeader,
  readPaginationHeader,
} from "../Models/pagination";

export type PalestranteListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

function buildQuery(params: PalestranteListParams): string {
  const query = new URLSearchParams();
  if (params.page != null) query.set("page", String(params.page));
  if (params.pageSize != null) query.set("pageSize", String(params.pageSize));
  if (params.q?.trim()) query.set("q", params.q.trim());
  const s = query.toString();
  return s ? `?${s}` : "";
}

async function getPaged(
  url: string,
): Promise<{ data: PageResult<Palestrante> }> {
  const response = await http.get<Palestrante[]>(url);
  const data = pageResultFromHeader(
    response.data,
    readPaginationHeader(response.headers as Record<string, unknown>),
  );
  return { data };
}

async function listAllPages(): Promise<Palestrante[]> {
  const first = await getPaged(
    `/palestrantes${buildQuery({ page: 1, pageSize: 30 })}`,
  );
  const page = first.data;
  if (page.totalPages <= 1) return page.items;
  const rest = await Promise.all(
    Array.from({ length: page.totalPages - 1 }, (_, i) =>
      getPaged(`/palestrantes${buildQuery({ page: i + 2, pageSize: 30 })}`),
    ),
  );
  return [...page.items, ...rest.flatMap((r) => r.data.items)];
}

export const palestranteService = {
  list: (params: PalestranteListParams = {}) =>
    getPaged(`/palestrantes${buildQuery(params)}`),
  /** Aggregates all pages (for association UIs). */
  listAll: () => listAllPages(),
  getById: (id: number) => http.get<Palestrante>(`/palestrantes/${id}`),
  getMe: () => http.get<Palestrante>("/palestrantes/me"),
  /** @deprecated Prefer list({ q }) — kept for form association helpers. */
  getByNome: (nome: string, params: Omit<PalestranteListParams, "q"> = {}) =>
    getPaged(`/palestrantes${buildQuery({ ...params, q: nome })}`),
  /** @deprecated Prefer list({ q }). */
  getByTema: (tema: string, params: Omit<PalestranteListParams, "q"> = {}) =>
    getPaged(`/palestrantes${buildQuery({ ...params, q: tema })}`),
  create: (payload: Partial<Palestrante>) => http.post<Palestrante>("/palestrantes", payload),
  update: (id: number, payload: Partial<Palestrante>) =>
    http.put<Palestrante>(`/palestrantes/${id}`, payload),
  remove: (id: number) => http.delete(`/palestrantes/${id}`),
  associate: (eventoId: number, palestranteId: number) =>
    http.put(`/eventos/${eventoId}/palestrantes/${palestranteId}`),
  disassociate: (eventoId: number, palestranteId: number) =>
    http.delete(`/eventos/${eventoId}/palestrantes/${palestranteId}`),
};

export default palestranteService;
