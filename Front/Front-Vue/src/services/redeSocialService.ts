import http from "./HttpClient";

export interface RedeSocialPayload {
  id?: number;
  nome: string;
  url: string;
}

export const redeSocialService = {
  listByEvento: (eventoId: number) =>
    http.get<RedeSocialPayload[]>(`/redes-sociais/evento/${eventoId}`),
  saveByEvento: (eventoId: number, items: RedeSocialPayload[]) =>
    http.put(`/redes-sociais/evento/${eventoId}`, items),
  removeByEvento: (eventoId: number, id: number) =>
    http.delete(`/redes-sociais/evento/${eventoId}/${id}`),
  listByPalestrante: (palestranteId: number) =>
    http.get<RedeSocialPayload[]>(`/redes-sociais/palestrante/${palestranteId}`),
  saveByPalestrante: (palestranteId: number, items: RedeSocialPayload[]) =>
    http.put(`/redes-sociais/palestrante/${palestranteId}`, items),
  removeByPalestrante: (palestranteId: number, id: number) =>
    http.delete(`/redes-sociais/palestrante/${palestranteId}/${id}`),
  listMine: () => http.get<RedeSocialPayload[]>(`/redes-sociais/palestrante`),
  saveMine: (items: RedeSocialPayload[]) =>
    http.put(`/redes-sociais/palestrante`, items),
  removeMine: (id: number) => http.delete(`/redes-sociais/palestrante/${id}`),
};

export default redeSocialService;
