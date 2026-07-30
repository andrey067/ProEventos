import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventoService } from "./eventoService";

const paginationHeader = JSON.stringify({
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 1,
  totalPages: 1,
});

const pageResult = {
  items: [{ id: 1, tema: "Workshop Vue" }],
  page: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
};

function mockPagedResponse(body: unknown, header = paginationHeader) {
  return {
    ok: true,
    status: 200,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "pagination" ? header : null,
    },
    json: async () => body,
  } as unknown as Response;
}

describe("eventoService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("busca eventos paginados via header Pagination", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockPagedResponse(pageResult.items),
    );

    const result = await eventoService.getAll({ page: 1, pageSize: 10 });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos?page=1&pageSize=10",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result).toEqual(pageResult);
  });

  it("busca eventos por q via query", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockPagedResponse([], JSON.stringify({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0,
      })),
    );

    await eventoService.getByTema("angular", { page: 1, pageSize: 10 });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos?page=1&pageSize=10&q=angular",
      expect.any(Object),
    );
  });

  it("envia q no getAll", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockPagedResponse(pageResult.items));

    await eventoService.getAll({ page: 1, pageSize: 10, q: "summit" });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos?page=1&pageSize=10&q=summit",
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
