import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearToken, setToken } from "./authToken";
import { HttpError, http } from "./http";

describe("http", () => {
  beforeEach(() => {
    clearToken();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("retorna JSON quando a resposta é ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 1 }),
    } as Response);

    const result = await http<{ id: number }>("/eventos");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result).toEqual({ id: 1 });
  });

  it("anexa Bearer automaticamente quando há token", async () => {
    setToken("stored-token");

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await http("/eventos");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer stored-token",
        },
      }),
    );
  });

  it("mescla headers customizados", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    await http("/eventos", {
      headers: { Authorization: "Bearer token" },
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
      }),
    );
  });

  it("retorna undefined para status 204", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    const result = await http<void>("/eventos/1");

    expect(result).toBeUndefined();
  });

  it("lança HttpError com description do body", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 409,
      statusText: "Conflict",
      json: async () => ({
        code: "Account.Register.EmailInUse",
        description: "Email já está em uso.",
        layer: "Service",
      }),
    } as Response);

    await expect(http("/account/register")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof HttpError &&
        error.status === 409 &&
        error.message === "Email já está em uso.",
    );
  });

  it("lança HttpError com detail de ProblemDetails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ title: "Error", detail: "falha interna" }),
    } as Response);

    await expect(http("/eventos")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof HttpError &&
        error.status === 500 &&
        error.message === "falha interna",
    );
  });

  it("lança HttpError com statusText quando body não tem mensagem", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => {
        throw new Error("no body");
      },
    } as Response);

    await expect(http("/eventos/99")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof HttpError &&
        error.status === 404 &&
        error.message === "Not Found",
    );
  });
});
