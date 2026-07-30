import { beforeEach, describe, expect, it, vi } from "vitest";
import eventoService from "./eventoService";
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

describe("eventoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls GET /eventos with query and parses Pagination header", async () => {
    (http.get as any).mockResolvedValue({
      data: [],
      headers: { pagination: paginationHeader },
    });
    const result = await eventoService.list({ page: 1, pageSize: 10 });
    expect(http.get).toHaveBeenCalledWith("/eventos?page=1&pageSize=10");
    expect(result.data).toEqual({
      items: [],
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
    });
  });

  it("create calls POST /eventos", async () => {
    (http.post as any).mockResolvedValue({ data: { id: 1 } });
    await eventoService.create({ tema: "X" } as any);
    expect(http.post).toHaveBeenCalledWith("/eventos", { tema: "X" });
  });

  it("update calls PUT /eventos/:id", async () => {
    (http.put as any).mockResolvedValue({ data: { id: 2 } });
    await eventoService.update(2, { tema: "Y" } as any);
    expect(http.put).toHaveBeenCalledWith("/eventos/2", { tema: "Y" });
  });

  it("remove calls DELETE /eventos/:id", async () => {
    (http.delete as any).mockResolvedValue({ status: 200 });
    await eventoService.remove(3);
    expect(http.delete).toHaveBeenCalledWith("/eventos/3");
  });

  it("getById calls GET /eventos/:id", async () => {
    (http.get as any).mockResolvedValue({ data: { id: 4 } });
    await eventoService.getById(4);
    expect(http.get).toHaveBeenCalledWith("/eventos/4");
  });

  it("getByTema calls GET /eventos with q query", async () => {
    (http.get as any).mockResolvedValue({
      data: [],
      headers: { pagination: paginationHeader },
    });
    await eventoService.getByTema("Vue");
    expect(http.get).toHaveBeenCalledWith("/eventos?q=Vue");
  });

  it("list with q calls GET /eventos with q query", async () => {
    (http.get as any).mockResolvedValue({
      data: [],
      headers: { pagination: paginationHeader },
    });
    await eventoService.list({ page: 1, pageSize: 10, q: "conf" });
    expect(http.get).toHaveBeenCalledWith("/eventos?page=1&pageSize=10&q=conf");
  });
});
