import type { Evento } from "@/models";
import { http } from "./http";

export const eventoService = {
  getAll(): Promise<Evento[]> {
    return http<Evento[]>("/eventos");
  },

  getById(id: number): Promise<Evento> {
    return http<Evento>(`/eventos/${id}`);
  },

  getByTema(tema: string): Promise<Evento[]> {
    return http<Evento[]>(`/eventos/tema/${encodeURIComponent(tema)}`);
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
