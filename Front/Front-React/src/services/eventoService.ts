import type { Evento, PageResult } from "@/models";
import { http, httpPaged } from "./http";

export type EventoListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

function buildQuery(params: EventoListParams): string {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.q?.trim()) q.set("q", params.q.trim());
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const eventoService = {
  getAll(params: EventoListParams = {}): Promise<PageResult<Evento>> {
    return httpPaged<Evento>(`/eventos${buildQuery(params)}`);
  },

  getById(id: number): Promise<Evento> {
    return http<Evento>(`/eventos/${id}`);
  },

  getByTema(
    tema: string,
    params: Omit<EventoListParams, "q"> = {},
  ): Promise<PageResult<Evento>> {
    return httpPaged<Evento>(`/eventos${buildQuery({ ...params, q: tema })}`);
  },

  create(evento: Omit<Evento, "id"> | Evento): Promise<Evento> {
    return http<Evento>("/eventos", {
      method: "POST",
      body: JSON.stringify(evento),
    });
  },

  update(id: number, evento: Evento): Promise<Evento> {
    return http<Evento>(`/eventos/${id}`, {
      method: "PUT",
      body: JSON.stringify(evento),
    });
  },

  delete(id: number): Promise<{ message: string }> {
    return http<{ message: string }>(`/eventos/${id}`, {
      method: "DELETE",
    });
  },
};
