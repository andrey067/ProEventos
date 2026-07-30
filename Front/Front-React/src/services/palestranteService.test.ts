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

const pageResult = {
  items: [mockPalestrante],
  page: 1,
  pageSize: 10,
  totalCount: 1,
  totalPages: 1,
};

const paginationHeader = JSON.stringify({
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 1,
  totalPages: 1,
});

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

describe("palestranteService", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("busca palestrantes paginados via header", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockPagedResponse(pageResult.items));

    const result = await palestranteService.getAll({ page: 1, pageSize: 10 });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/palestrantes?page=1&pageSize=10",
      expect.any(Object),
    );
    expect(result).toEqual(pageResult);
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
      expect.objectContaining({ method: "PUT" }),
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

    expect(result.message).toBe("Deletado");
  });

  it("busca por q via getByNome", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockPagedResponse(pageResult.items));
    await palestranteService.getByNome("Ana");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/palestrantes?q=Ana",
      expect.any(Object),
    );
  });

  it("envia q no getAll", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockPagedResponse(pageResult.items));
    await palestranteService.getAll({ page: 1, pageSize: 10, q: "React" });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/palestrantes?page=1&pageSize=10&q=React",
      expect.any(Object),
    );
  });

  it("associa palestrante", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Associado" }),
    } as Response);
    await palestranteService.associate(10, 3);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos/10/palestrantes/3",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("desassocia palestrante", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: "Desassociado" }),
    } as Response);
    await palestranteService.disassociate(10, 3);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos/10/palestrantes/3",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("busca por q via getByTema", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockPagedResponse(pageResult.items));
    await palestranteService.getByTema("Vue");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/palestrantes?q=Vue",
      expect.any(Object),
    );
  });

  it("listAll agrega páginas adicionais", async () => {
    const page1Header = JSON.stringify({
      currentPage: 1,
      itemsPerPage: 30,
      totalItems: 2,
      totalPages: 2,
    });
    const page2Header = JSON.stringify({
      currentPage: 2,
      itemsPerPage: 30,
      totalItems: 2,
      totalPages: 2,
    });
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ...mockPagedResponse([mockPalestrante], page1Header),
      } as Response)
      .mockResolvedValueOnce({
        ...mockPagedResponse(
          [{ ...mockPalestrante, id: 2, nome: "Bruno" }],
          page2Header,
        ),
      } as Response);

    const all = await palestranteService.listAll();
    expect(all).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
