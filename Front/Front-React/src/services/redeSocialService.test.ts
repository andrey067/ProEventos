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
});
