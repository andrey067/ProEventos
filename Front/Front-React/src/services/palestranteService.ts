import type { PageResult, Palestrante } from "@/models";
import { http, httpPaged } from "./http";

export type PalestranteListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
};

function buildQuery(params: PalestranteListParams): string {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.q?.trim()) q.set("q", params.q.trim());
  const s = q.toString();
  return s ? `?${s}` : "";
}

async function listAllPages(): Promise<Palestrante[]> {
  const first = await httpPaged<Palestrante>(
    `/palestrantes${buildQuery({ page: 1, pageSize: 30 })}`,
  );
  if (first.totalPages <= 1) return first.items;
  const rest = await Promise.all(
    Array.from({ length: first.totalPages - 1 }, (_, i) =>
      httpPaged<Palestrante>(
        `/palestrantes${buildQuery({ page: i + 2, pageSize: 30 })}`,
      ),
    ),
  );
  return [...first.items, ...rest.flatMap((r) => r.items)];
}

export const palestranteService = {
  getAll(params: PalestranteListParams = {}): Promise<PageResult<Palestrante>> {
    return httpPaged<Palestrante>(`/palestrantes${buildQuery(params)}`);
  },

  /** Aggregates all pages (for association UIs). */
  listAll(): Promise<Palestrante[]> {
    return listAllPages();
  },

  getById(id: number): Promise<Palestrante> {
    return http<Palestrante>(`/palestrantes/${id}`);
  },

  getMe(): Promise<Palestrante> {
    return http<Palestrante>("/palestrantes/me");
  },

  create(palestrante: Omit<Palestrante, "id">): Promise<Palestrante> {
    return http<Palestrante>("/palestrantes", {
      method: "POST",
      body: JSON.stringify(palestrante),
    });
  },

  update(id: number, palestrante: Palestrante): Promise<Palestrante> {
    return http<Palestrante>(`/palestrantes/${id}`, {
      method: "PUT",
      body: JSON.stringify(palestrante),
    });
  },

  delete(id: number): Promise<{ message: string }> {
    return http<{ message: string }>(`/palestrantes/${id}`, {
      method: "DELETE",
    });
  },

  getByNome(
    nome: string,
    params: Omit<PalestranteListParams, "q"> = {},
  ): Promise<PageResult<Palestrante>> {
    return httpPaged<Palestrante>(
      `/palestrantes${buildQuery({ ...params, q: nome })}`,
    );
  },

  getByTema(
    tema: string,
    params: Omit<PalestranteListParams, "q"> = {},
  ): Promise<PageResult<Palestrante>> {
    return httpPaged<Palestrante>(
      `/palestrantes${buildQuery({ ...params, q: tema })}`,
    );
  },

  associate(eventoId: number, palestranteId: number): Promise<{ message: string }> {
    return http<{ message: string }>(`/eventos/${eventoId}/palestrantes/${palestranteId}`, {
      method: "PUT",
    });
  },

  disassociate(eventoId: number, palestranteId: number): Promise<{ message: string }> {
    return http<{ message: string }>(`/eventos/${eventoId}/palestrantes/${palestranteId}`, {
      method: "DELETE",
    });
  },
};
