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

describe("palestranteService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list calls GET /palestrantes", async () => {
    (http.get as any).mockResolvedValue({ data: [] });
    await palestranteService.list();
    expect(http.get).toHaveBeenCalledWith("/palestrantes");
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
});
