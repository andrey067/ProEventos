import http from "./HttpClient";
import type { Palestrante } from "../Models/Palestrante";

export const palestranteService = {
  list: () => http.get<Palestrante[]>("/palestrantes"),
  getById: (id: number) => http.get<Palestrante>(`/palestrantes/${id}`),
  getByNome: (nome: string) => http.get<Palestrante[]>(`/palestrantes/nome/${encodeURIComponent(nome)}`),
  getByTema: (tema: string) => http.get<Palestrante[]>(`/palestrantes/tema/${encodeURIComponent(tema)}`),
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
