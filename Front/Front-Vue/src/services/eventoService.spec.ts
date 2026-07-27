import { describe, it, expect, vi, beforeEach } from "vitest";
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

describe("eventoService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls GET /eventos", async () => {
    (http.get as any).mockResolvedValue({ data: [] });
    await eventoService.list();
    expect(http.get).toHaveBeenCalledWith("/eventos");
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

  it("getByTema calls GET /eventos/tema/:tema", async () => {
    (http.get as any).mockResolvedValue({ data: [] });
    await eventoService.getByTema("Vue");
    expect(http.get).toHaveBeenCalledWith("/eventos/tema/Vue");
  });
});
