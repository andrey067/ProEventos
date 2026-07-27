import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Palestrante } from "@/models";
import { palestranteService } from "./palestranteService";

const mockPalestrante: Palestrante = {
  id: 1,
  nome: "Ana Silva",
  miniCurriculo: "Especialista em React",
  imagemURL: "https://example.com/ana.jpg",
  telefone: "11999999999",
  email: "ana@example.com",
};

describe("palestranteService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("busca todos os palestrantes", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [mockPalestrante],
    } as Response);

    const result = await palestranteService.getAll();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/palestrantes",
      expect.any(Object),
    );
    expect(result).toEqual([mockPalestrante]);
  });

  it("busca palestrante por id", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPalestrante,
    } as Response);

    const result = await palestranteService.getById(1);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/palestrantes/1",
      expect.any(Object),
    );
    expect(result).toEqual(mockPalestrante);
  });

  it("cria palestrante", async () => {
    const { id: _id, ...payload } = mockPalestrante;
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPalestrante,
    } as Response);

    const result = await palestranteService.create(payload);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/palestrantes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    expect(result).toEqual(mockPalestrante);
  });

  it("atualiza palestrante", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockPalestrante,
    } as Response);

    const result = await palestranteService.update(1, mockPalestrante);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/palestrantes/1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(mockPalestrante),
      }),
    );
    expect(result).toEqual(mockPalestrante);
  });

  it("deleta palestrante", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Deletado" }),
    } as Response);

    const result = await palestranteService.delete(1);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/palestrantes/1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(result.message).toBe("Deletado");
  });
});
