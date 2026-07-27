import http from "./HttpClient";
import type { Lote } from "../Models/Lote";

export const loteService = {
  listByEvento: (eventoId: number) => http.get<Lote[]>(`/lotes/${eventoId}`),
  save: (eventoId: number, lotes: Partial<Lote>[]) => http.put<Lote[]>(`/lotes/${eventoId}`, lotes),
  remove: (eventoId: number, loteId: number) => http.delete(`/lotes/${eventoId}/${loteId}`),
};

export default loteService;
