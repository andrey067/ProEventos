import { describe, it, expect, vi, beforeEach } from "vitest";
import loteService from "./loteService";
import http from "./HttpClient";

vi.mock("./HttpClient", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("loteService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listByEvento calls GET /lotes/:eventoId", async () => {
    (http.get as any).mockResolvedValue({ data: [] });
    await loteService.listByEvento(5);
    expect(http.get).toHaveBeenCalledWith("/lotes/5");
  });

  it("save calls PUT /lotes/:eventoId", async () => {
    const lotes = [{ nome: "VIP", preco: 100 }];
    (http.put as any).mockResolvedValue({ data: lotes });
    await loteService.save(5, lotes);
    expect(http.put).toHaveBeenCalledWith("/lotes/5", lotes);
  });

  it("remove calls DELETE /lotes/:eventoId/:loteId", async () => {
    (http.delete as any).mockResolvedValue({ status: 200 });
    await loteService.remove(5, 9);
    expect(http.delete).toHaveBeenCalledWith("/lotes/5/9");
  });
});
