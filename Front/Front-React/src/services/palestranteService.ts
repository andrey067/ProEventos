import type { Palestrante } from "@/models";
import { http } from "./http";

export const palestranteService = {
  getAll(): Promise<Palestrante[]> {
    return http<Palestrante[]>("/palestrantes");
  },

  getById(id: number): Promise<Palestrante> {
    return http<Palestrante>(`/palestrantes/${id}`);
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

  getByNome(nome: string): Promise<Palestrante[]> {
    return http<Palestrante[]>(`/palestrantes/nome/${encodeURIComponent(nome)}`);
  },

  getByTema(tema: string): Promise<Palestrante[]> {
    return http<Palestrante[]>(`/palestrantes/tema/${encodeURIComponent(tema)}`);
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
