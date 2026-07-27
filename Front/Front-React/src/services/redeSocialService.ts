import type { RedeSocial } from "@/models";
import { http } from "./http";

export const redeSocialService = {
  getByEventoId(eventoId: number): Promise<RedeSocial[]> {
    return http<RedeSocial[]>(`/redes-sociais/evento/${eventoId}`);
  },

  saveByEventoId(eventoId: number, redes: RedeSocial[]): Promise<RedeSocial[]> {
    return http<RedeSocial[]>(`/redes-sociais/evento/${eventoId}`, {
      method: "PUT",
      body: JSON.stringify(redes),
    });
  },

  deleteByEventoId(
    eventoId: number,
    redeSocialId: number,
  ): Promise<{ message: string }> {
    return http<{ message: string }>(
      `/redes-sociais/evento/${eventoId}/${redeSocialId}`,
      { method: "DELETE" },
    );
  },
};
