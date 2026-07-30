import { describe, it, expect, vi, beforeEach } from "vitest";
import accountService from "./accountService";
import http from "./HttpClient";
import { setSession, clearToken } from "./authToken";

vi.mock("./HttpClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("./authToken", () => ({
  setSession: vi.fn(),
  clearToken: vi.fn(),
}));

describe("accountService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("login persists roles via setSession", async () => {
    const auth = {
      token: "t1",
      roles: ["User"],
      nome: "Ana",
      userName: "ana",
      email: "ana@test.com",
    };
    (http.post as any).mockResolvedValue({ data: auth });

    const result = await accountService.login({ userName: "ana", password: "x" });

    expect(http.post).toHaveBeenCalledWith("/account/login", {
      userName: "ana",
      password: "x",
    });
    expect(setSession).toHaveBeenCalledWith("t1", ["User"]);
    expect(result).toEqual(auth);
  });

  it("register persists roles via setSession", async () => {
    const auth = {
      token: "t2",
      roles: ["User"],
      nome: "Bob",
      userName: "bob",
      email: "bob@test.com",
    };
    const payload = {
      nome: "Bob",
      userName: "bob",
      email: "bob@test.com",
      password: "secret",
    };
    (http.post as any).mockResolvedValue({ data: auth });

    await accountService.register(payload);

    expect(http.post).toHaveBeenCalledWith("/account/register", payload);
    expect(setSession).toHaveBeenCalledWith("t2", ["User"]);
  });

  it("registerPalestrante posts to register-palestrante and persists roles", async () => {
    const auth = {
      token: "t3",
      roles: ["Palestrante"],
      nome: "Carla",
      userName: "carla",
      email: "carla@test.com",
    };
    const payload = {
      nome: "Carla",
      userName: "carla",
      email: "carla@test.com",
      password: "secret",
      miniCurriculo: "Bio",
      telefone: "11999999999",
      imagemURL: "https://example.com/c.jpg",
    };
    (http.post as any).mockResolvedValue({ data: auth });

    await accountService.registerPalestrante(payload);

    expect(http.post).toHaveBeenCalledWith("/account/register-palestrante", payload);
    expect(setSession).toHaveBeenCalledWith("t3", ["Palestrante"]);
  });

  it("getProfile returns telefone and descricao", async () => {
    const profile = {
      nome: "Ana Silva",
      userName: "ana",
      email: "ana@test.com",
      primeiroNome: "Ana",
      ultimoNome: "Silva",
      titulo: "NaoInformado" as const,
      funcao: "Participante" as const,
      telefone: "11988887777",
      descricao: "Organizer",
      imagemURL: "https://images.unsplash.com/x",
      eventosMinistrados: 0,
      eventosParticipados: 0,
    };
    (http.get as any).mockResolvedValue({ data: profile });

    const result = await accountService.getProfile();

    expect(http.get).toHaveBeenCalledWith("/account/profile");
    expect(result).toEqual(profile);
  });

  it("updateProfile sends telefone and descricao", async () => {
    const payload = {
      primeiroNome: "Ana",
      ultimoNome: "Silva",
      userName: "ana",
      email: "ana@test.com",
      titulo: "NaoInformado" as const,
      funcao: "Participante" as const,
      telefone: "11988887777",
      descricao: "Updated bio",
    };
    (http.put as any).mockResolvedValue({ data: { ...payload, nome: "Ana Silva", eventosMinistrados: 0, eventosParticipados: 0 } });

    const result = await accountService.updateProfile(payload);

    expect(http.put).toHaveBeenCalledWith("/account/profile", payload);
    expect(result.descricao).toBe("Updated bio");
  });

  it("changePassword calls PUT /account/change-password", async () => {
    (http.put as any).mockResolvedValue({ data: undefined });

    await accountService.changePassword({
      currentPassword: "old",
      newPassword: "new",
    });

    expect(http.put).toHaveBeenCalledWith("/account/change-password", {
      currentPassword: "old",
      newPassword: "new",
    });
  });

  it("logout clears token", () => {
    accountService.logout();
    expect(clearToken).toHaveBeenCalled();
  });
});
