import { beforeEach, describe, expect, it, vi } from "vitest";
import { getRoles, getToken, setToken } from "./authToken";
import { accountService } from "./accountService";

describe("accountService", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("registerPalestrante persiste sessão", async () => {
    const auth = {
      token: "speaker-tok",
      userName: "ana",
      email: "ana@example.com",
      nome: "Ana",
      roles: ["Palestrante"],
      palestranteId: 7,
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => auth,
    } as Response);

    const payload = {
      nome: "Ana",
      userName: "ana",
      email: "ana@example.com",
      password: "Senha123!",
      miniCurriculo: "Dev",
      telefone: "11999999999",
    };

    const result = await accountService.registerPalestrante(payload);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/account/register-palestrante",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    expect(result).toEqual(auth);
    expect(getToken()).toBe("speaker-tok");
    expect(getRoles()).toEqual(["Palestrante"]);
  });

  it("getProfile e updateProfile enviam telefone e descricao", async () => {
    const profile = {
      nome: "Ana Silva",
      userName: "ana",
      email: "ana@example.com",
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
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => profile,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ...profile, descricao: "Atualizado" }),
      } as Response);

    const loaded = await accountService.getProfile();
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/account/profile",
      expect.any(Object),
    );
    expect(loaded.telefone).toBe("11988887777");
    expect(loaded.descricao).toBe("Organizer");

    const updatePayload = {
      primeiroNome: "Ana",
      ultimoNome: "Silva",
      userName: "ana",
      email: "ana@example.com",
      titulo: "NaoInformado" as const,
      funcao: "Participante" as const,
      telefone: "11988887777",
      descricao: "Atualizado",
    };
    const updated = await accountService.updateProfile(updatePayload);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/account/profile",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(updatePayload),
      }),
    );
    expect(updated.descricao).toBe("Atualizado");
  });

  it("changePassword chama PUT /account/change-password", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    await accountService.changePassword({
      currentPassword: "old",
      newPassword: "new",
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/account/change-password",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          currentPassword: "old",
          newPassword: "new",
        }),
      }),
    );
  });

  it("login persiste sessão", async () => {
    const auth = {
      token: "jwt",
      userName: "ana",
      email: "ana@example.com",
      nome: "Ana",
      roles: ["User"],
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => auth,
    } as Response);

    const result = await accountService.login({
      userName: "ana",
      password: "secret",
    });

    expect(result.token).toBe("jwt");
    expect(getToken()).toBe("jwt");
  });

  it("register persiste sessão", async () => {
    const auth = {
      token: "reg-jwt",
      userName: "bob",
      email: "bob@example.com",
      nome: "Bob",
      roles: ["User"],
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => auth,
    } as Response);

    await accountService.register({
      nome: "Bob",
      userName: "bob",
      email: "bob@example.com",
      password: "Senha123!",
    });

    expect(getToken()).toBe("reg-jwt");
  });

  it("logout limpa token", () => {
    setToken("x");
    accountService.logout();
    expect(getToken()).toBeNull();
  });
});
