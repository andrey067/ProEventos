import http from "./HttpClient";
import type { Evento } from "../Models/Evento";

export const eventoService = {
  list: () => http.get<Evento[]>("/eventos"),
  getById: (id: number) => http.get<Evento>(`/eventos/${id}`),
  getByTema: (tema: string) => http.get<Evento[]>(`/eventos/tema/${tema}`),
  create: (payload: Partial<Evento>) => http.post<Evento>("/eventos", payload),
  update: (id: number, payload: Partial<Evento>) => http.put<Evento>(`/eventos/${id}`, payload),
  remove: (id: number) => http.delete(`/eventos/${id}`),
};

export default eventoService;
