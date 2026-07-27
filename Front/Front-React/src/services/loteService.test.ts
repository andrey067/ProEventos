import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Lote } from "@/models";
import { loteService } from "./loteService";

const mockLotes: Lote[] = [
  {
    id: 1,
    nome: "VIP",
    preco: 100,
    dataIncio: "01-01-2026",
    dataFim: "31-01-2026",
    quantidade: 50,
    eventoId: 1,
  },
];

describe("loteService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("busca lotes por eventoId", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockLotes,
    } as Response);

    const result = await loteService.getByEventoId(1);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/lotes/1",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result).toEqual(mockLotes);
  });

  it("salva lotes de um evento", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockLotes,
    } as Response);

    const result = await loteService.save(1, mockLotes);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/lotes/1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(mockLotes),
      }),
    );
    expect(result).toEqual(mockLotes);
  });

  it("deleta lote por eventoId e loteId", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Removido" }),
    } as Response);

    const result = await loteService.delete(1, 2);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/lotes/1/2",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(result.message).toBe("Removido");
  });
});
