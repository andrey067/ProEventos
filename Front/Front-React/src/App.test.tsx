import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";
import { clearToken, setToken } from "@/services/authToken";

function mockFetchJson(data: unknown) {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => data,
  } as Response);
}

describe("App", () => {
  beforeEach(() => {
    clearToken();
    vi.stubGlobal("fetch", vi.fn());
    mockFetchJson([]);
  });

  it("redireciona / para /eventos", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Eventos" })).toBeTruthy();
  });

  it("renderiza página de eventos em /eventos", async () => {
    render(
      <MemoryRouter initialEntries={["/eventos"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Eventos" })).toBeTruthy();
    expect(
      await screen.findByText("Nenhum evento encontrado."),
    ).toBeTruthy();
  });

  it("renderiza página de palestrantes em /palestrantes", async () => {
    render(
      <MemoryRouter initialEntries={["/palestrantes"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Palestrantes" })).toBeTruthy();
    expect(
      await screen.findByText("Nenhum palestrante cadastrado."),
    ).toBeTruthy();
  });

  it("renderiza página de login em /login", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Login" })).toBeTruthy();
  });

  it("redireciona /eventos/new para login sem token", () => {
    render(
      <MemoryRouter initialEntries={["/eventos/new"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Login" })).toBeTruthy();
  });

  it("renderiza formulário de novo evento em /eventos/new com token", async () => {
    setToken("test-token");

    render(
      <MemoryRouter initialEntries={["/eventos/new"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", { name: "Novo evento" }),
    ).toBeTruthy();
  });
});
