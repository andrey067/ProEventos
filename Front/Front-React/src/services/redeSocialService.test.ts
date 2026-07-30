import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RedeSocial } from "@/models";
import { redeSocialService } from "./redeSocialService";

const mockRedes: RedeSocial[] = [
  { id: 1, nome: "Instagram", url: "https://instagram.com/pro", eventoId: 1 },
];

describe("redeSocialService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("busca redes sociais por eventoId", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockRedes,
    } as Response);

    const result = await redeSocialService.getByEventoId(1);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/redes-sociais/evento/1",
      expect.any(Object),
    );
    expect(result).toEqual(mockRedes);
  });

  it("salva redes sociais de um evento", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockRedes,
    } as Response);

    const result = await redeSocialService.saveByEventoId(1, mockRedes);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/redes-sociais/evento/1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(mockRedes),
      }),
    );
    expect(result).toEqual(mockRedes);
  });

  it("deleta rede social de um evento", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Removido" }),
    } as Response);

    const result = await redeSocialService.deleteByEventoId(1, 2);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/redes-sociais/evento/1/2",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(result.message).toBe("Removido");
  });

  it("busca e deleta redes de um palestrante", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockRedes,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Removido" }),
      } as Response);

    await redeSocialService.getByPalestranteId(3);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/redes-sociais/palestrante/3",
      expect.any(Object),
    );

    const deleted = await redeSocialService.deleteByPalestranteId(3, 1);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/redes-sociais/palestrante/3/1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(deleted.message).toBe("Removido");
  });

  it("salva redes sociais de um palestrante", async () => {
    const redesPalestrante: RedeSocial[] = [
      { id: 1, nome: "LinkedIn", url: "https://linkedin.com/in/ana", palestranteId: 3 },
    ];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => redesPalestrante,
    } as Response);

    const result = await redeSocialService.saveByPalestranteId(3, redesPalestrante);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/redes-sociais/palestrante/3",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(redesPalestrante),
      }),
    );
    expect(result).toEqual(redesPalestrante);
  });

  it("busca, salva e deleta redes do perfil logado", async () => {
    const mine: RedeSocial[] = [
      { id: 2, nome: "GitHub", url: "https://github.com/me" },
    ];
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mine,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mine,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Removido" }),
      } as Response);

    const loaded = await redeSocialService.getMine();
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/redes-sociais/palestrante",
      expect.any(Object),
    );
    expect(loaded).toEqual(mine);

    const saved = await redeSocialService.saveMine(mine);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/redes-sociais/palestrante",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(mine),
      }),
    );
    expect(saved).toEqual(mine);

    const deleted = await redeSocialService.deleteMine(2);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/redes-sociais/palestrante/2",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(deleted.message).toBe("Removido");
  });
});
