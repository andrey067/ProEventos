import type { Lote } from "@/models";
import { http } from "./http";

export const loteService = {
  getByEventoId(eventoId: number): Promise<Lote[]> {
    return http<Lote[]>(`/lotes/${eventoId}`);
  },

  save(eventoId: number, lotes: Lote[]): Promise<Lote[]> {
    return http<Lote[]>(`/lotes/${eventoId}`, {
      method: "PUT",
      body: JSON.stringify(lotes),
    });
  },

  delete(eventoId: number, loteId: number): Promise<{ message: string }> {
    return http<{ message: string }>(`/lotes/${eventoId}/${loteId}`, {
      method: "DELETE",
    });
  },
};
