import { describe, it, expect, vi, beforeEach } from "vitest";
import redeSocialService from "./redeSocialService";
import http from "./HttpClient";

vi.mock("./HttpClient", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("redeSocialService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listByEvento calls GET /redes-sociais/evento/:id", async () => {
    (http.get as any).mockResolvedValue({ data: [] });
    await redeSocialService.listByEvento(1);
    expect(http.get).toHaveBeenCalledWith("/redes-sociais/evento/1");
  });

  it("saveByEvento calls PUT /redes-sociais/evento/:id", async () => {
    const items = [{ nome: "Twitter", url: "https://x.com" }];
    (http.put as any).mockResolvedValue({ status: 200 });
    await redeSocialService.saveByEvento(1, items);
    expect(http.put).toHaveBeenCalledWith("/redes-sociais/evento/1", items);
  });

  it("removeByEvento calls DELETE /redes-sociais/evento/:eventoId/:id", async () => {
    (http.delete as any).mockResolvedValue({ status: 200 });
    await redeSocialService.removeByEvento(1, 2);
    expect(http.delete).toHaveBeenCalledWith("/redes-sociais/evento/1/2");
  });

  it("listByPalestrante calls GET /redes-sociais/palestrante/:id", async () => {
    (http.get as any).mockResolvedValue({ data: [] });
    await redeSocialService.listByPalestrante(3);
    expect(http.get).toHaveBeenCalledWith("/redes-sociais/palestrante/3");
  });

  it("saveByPalestrante calls PUT /redes-sociais/palestrante/:id", async () => {
    const items = [{ nome: "LinkedIn", url: "https://linkedin.com" }];
    (http.put as any).mockResolvedValue({ status: 200 });
    await redeSocialService.saveByPalestrante(3, items);
    expect(http.put).toHaveBeenCalledWith("/redes-sociais/palestrante/3", items);
  });
});
