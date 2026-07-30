import { describe, it, expect, vi, beforeEach } from "vitest";
import palestranteService from "./palestranteService";
import http from "./HttpClient";

vi.mock("./HttpClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const paginationHeader = JSON.stringify({
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0,
});

describe("palestranteService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls GET /palestrantes and parses Pagination header", async () => {
    (http.get as any).mockResolvedValue({
      data: [],
      headers: { pagination: paginationHeader },
    });
    const result = await palestranteService.list();
    expect(http.get).toHaveBeenCalledWith("/palestrantes");
    expect(result.data.items).toEqual([]);
    expect(result.data.page).toBe(1);
  });

  it("list with pagination calls GET with query params", async () => {
    (http.get as any).mockResolvedValue({
      data: [],
      headers: { pagination: paginationHeader },
    });
    await palestranteService.list({ page: 2, pageSize: 10 });
    expect(http.get).toHaveBeenCalledWith("/palestrantes?page=2&pageSize=10");
  });

  it("getByNome calls GET with q query", async () => {
    (http.get as any).mockResolvedValue({
      data: [{ id: 1, nome: "Ana" }],
      headers: {
        pagination: JSON.stringify({
          currentPage: 1,
          itemsPerPage: 10,
          totalItems: 1,
          totalPages: 1,
        }),
      },
    });
    await palestranteService.getByNome("Ana");
    expect(http.get).toHaveBeenCalledWith("/palestrantes?q=Ana");
  });

  it("list with q calls GET with q query", async () => {
    (http.get as any).mockResolvedValue({
      data: [],
      headers: { pagination: paginationHeader },
    });
    await palestranteService.list({ page: 1, pageSize: 10, q: "Maria" });
    expect(http.get).toHaveBeenCalledWith(
      "/palestrantes?page=1&pageSize=10&q=Maria",
    );
  });

  it("getById calls GET /palestrantes/:id", async () => {
    (http.get as any).mockResolvedValue({ data: { id: 1 } });
    await palestranteService.getById(1);
    expect(http.get).toHaveBeenCalledWith("/palestrantes/1");
  });

  it("create calls POST /palestrantes", async () => {
    const payload = { nome: "Ana" };
    (http.post as any).mockResolvedValue({ data: { id: 2, ...payload } });
    await palestranteService.create(payload);
    expect(http.post).toHaveBeenCalledWith("/palestrantes", payload);
  });

  it("update calls PUT /palestrantes/:id", async () => {
    const payload = { nome: "Ana Silva" };
    (http.put as any).mockResolvedValue({ data: { id: 3, ...payload } });
    await palestranteService.update(3, payload);
    expect(http.put).toHaveBeenCalledWith("/palestrantes/3", payload);
  });

  it("remove calls DELETE /palestrantes/:id", async () => {
    (http.delete as any).mockResolvedValue({ status: 200 });
    await palestranteService.remove(4);
    expect(http.delete).toHaveBeenCalledWith("/palestrantes/4");
  });

  it("associate calls PUT /eventos/:eventoId/palestrantes/:palestranteId", async () => {
    (http.put as any).mockResolvedValue({ data: { message: "Associado" } });
    await palestranteService.associate(10, 3);
    expect(http.put).toHaveBeenCalledWith("/eventos/10/palestrantes/3");
  });

  it("disassociate calls DELETE /eventos/:eventoId/palestrantes/:palestranteId", async () => {
    (http.delete as any).mockResolvedValue({ data: { message: "Desassociado" } });
    await palestranteService.disassociate(10, 3);
    expect(http.delete).toHaveBeenCalledWith("/eventos/10/palestrantes/3");
  });

  it("getByTema calls GET with q query", async () => {
    (http.get as any).mockResolvedValue({
      data: [],
      headers: { pagination: paginationHeader },
    });
    await palestranteService.getByTema("React");
    expect(http.get).toHaveBeenCalledWith("/palestrantes?q=React");
  });

  it("listAll aggregates multiple pages", async () => {
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
    (http.get as any)
      .mockResolvedValueOnce({
        data: [{ id: 1, nome: "A" }],
        headers: { pagination: page1Header },
      })
      .mockResolvedValueOnce({
        data: [{ id: 2, nome: "B" }],
        headers: { pagination: page2Header },
      });

    const all = await palestranteService.listAll();
    expect(all).toHaveLength(2);
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it("listAll returns first page when only one page exists", async () => {
    (http.get as any).mockResolvedValue({
      data: [{ id: 1 }],
      headers: {
        pagination: JSON.stringify({
          currentPage: 1,
          itemsPerPage: 30,
          totalItems: 1,
          totalPages: 1,
        }),
      },
    });
    const all = await palestranteService.listAll();
    expect(all).toEqual([{ id: 1 }]);
    expect(http.get).toHaveBeenCalledTimes(1);
  });
});
