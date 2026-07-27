import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventoService } from "./eventoService";

describe("eventoService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("busca todos os eventos", async () => {
    const mockEventos = [{ id: 1, tema: "Workshop Vue" }];
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockEventos,
    } as Response);

    const result = await eventoService.getAll();

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result).toEqual(mockEventos);
  });

  it("busca eventos por tema", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    } as Response);

    await eventoService.getByTema("angular");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos/tema/angular",
      expect.any(Object),
    );
  });

  it("deleta evento por id", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Deletado" }),
    } as Response);

    const result = await eventoService.delete(5);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos/5",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(result.message).toBe("Deletado");
  });

  it("busca evento por id", async () => {
    const mockEvento = { id: 2, tema: "Summit React" };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockEvento,
    } as Response);

    const result = await eventoService.getById(2);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos/2",
      expect.any(Object),
    );
    expect(result).toEqual(mockEvento);
  });

  it("cria evento", async () => {
    const payload = { tema: "Novo", local: "SP", dataEvento: "01-01-2026" };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 10, ...payload }),
    } as Response);

    const result = await eventoService.create(payload);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    expect(result.id).toBe(10);
  });

  it("atualiza evento", async () => {
    const payload = {
      id: 3,
      tema: "Atualizado",
      local: "RJ",
      dataEvento: "02-02-2026",
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => payload,
    } as Response);

    const result = await eventoService.update(3, payload);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos/3",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    );
    expect(result).toEqual(payload);
  });
});
