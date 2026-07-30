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

  getByPalestranteId(palestranteId: number): Promise<RedeSocial[]> {
    return http<RedeSocial[]>(`/redes-sociais/palestrante/${palestranteId}`);
  },

  saveByPalestranteId(
    palestranteId: number,
    redes: RedeSocial[],
  ): Promise<RedeSocial[]> {
    return http<RedeSocial[]>(`/redes-sociais/palestrante/${palestranteId}`, {
      method: "PUT",
      body: JSON.stringify(redes),
    });
  },

  deleteByPalestranteId(
    palestranteId: number,
    redeSocialId: number,
  ): Promise<{ message: string }> {
    return http<{ message: string }>(
      `/redes-sociais/palestrante/${palestranteId}/${redeSocialId}`,
      { method: "DELETE" },
    );
  },

  getMine(): Promise<RedeSocial[]> {
    return http<RedeSocial[]>(`/redes-sociais/palestrante`);
  },

  saveMine(redes: RedeSocial[]): Promise<RedeSocial[]> {
    return http<RedeSocial[]>(`/redes-sociais/palestrante`, {
      method: "PUT",
      body: JSON.stringify(redes),
    });
  },

  deleteMine(redeSocialId: number): Promise<{ message: string }> {
    return http<{ message: string }>(`/redes-sociais/palestrante/${redeSocialId}`, {
      method: "DELETE",
    });
  },
};
