import http from "./HttpClient";
import type { Evento } from "../Models/Evento";
import type { PageResult } from "../Models/pagination";
import {
  pageResultFromHeader,
  readPaginationHeader,
} from "../Models/pagination";

export type EventoListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

function buildQuery(params: EventoListParams): string {
  const query = new URLSearchParams();
  if (params.page != null) query.set("page", String(params.page));
  if (params.pageSize != null) query.set("pageSize", String(params.pageSize));
  if (params.q?.trim()) query.set("q", params.q.trim());
  const s = query.toString();
  return s ? `?${s}` : "";
}

async function getPaged(url: string): Promise<{ data: PageResult<Evento> }> {
  const response = await http.get<Evento[]>(url);
  const data = pageResultFromHeader(
    response.data,
    readPaginationHeader(response.headers as Record<string, unknown>),
  );
  return { data };
}

export const eventoService = {
  list: (params: EventoListParams = {}) =>
    getPaged(`/eventos${buildQuery(params)}`),
  getById: (id: number) => http.get<Evento>(`/eventos/${id}`),
  /** @deprecated Prefer list({ q }) — kept for form association helpers. */
  getByTema: (tema: string, params: Omit<EventoListParams, "q"> = {}) =>
    getPaged(`/eventos${buildQuery({ ...params, q: tema })}`),
  create: (payload: Partial<Evento>) => http.post<Evento>("/eventos", payload),
  update: (id: number, payload: Partial<Evento>) => http.put<Evento>(`/eventos/${id}`, payload),
  remove: (id: number) => http.delete(`/eventos/${id}`),
};

export default eventoService;
