import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearToken, setToken } from "@/services/authToken";
import { Nav } from "@/shared/Nav";

describe("Nav", () => {
  beforeEach(() => {
    clearToken();
  });

  afterEach(() => {
    // Restore default matchMedia without wiping setup's localStorage stub
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      })),
    );
  });

  it("renderiza links principais quando deslogado", () => {
    render(
      <MemoryRouter initialEntries={["/eventos"]}>
        <Nav />
      </MemoryRouter>,
    );

    expect(screen.getByText("ProEventos React")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Eventos" }).getAttribute("href"),
    ).toBe("/eventos");
    expect(
      screen.getByRole("link", { name: "Palestrantes" }).getAttribute("href"),
    ).toBe("/palestrantes");
    expect(
      screen.getByRole("link", { name: "Login" }).getAttribute("href"),
    ).toBe("/login");
    expect(
      screen.getByRole("link", { name: "Cadastro" }).getAttribute("href"),
    ).toBe("/register");
  });

  it("renderiza perfil e sair quando logado", () => {
    setToken("test-token");

    render(
      <MemoryRouter initialEntries={["/eventos"]}>
        <Nav />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "Perfil" }).getAttribute("href"),
    ).toBe("/perfil");
    expect(screen.getByRole("button", { name: "Sair" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();
  });

  it("destaca link ativo conforme rota", () => {
    render(
      <MemoryRouter initialEntries={["/palestrantes"]}>
        <Nav />
      </MemoryRouter>,
    );

    const eventosLink = screen.getByRole("link", { name: "Eventos" });
    const palestrantesLink = screen.getByRole("link", { name: "Palestrantes" });

    expect(eventosLink.className).toContain("text-muted");
    expect(palestrantesLink.className).toContain("bg-accent-soft");
  });

  it("abre e fecha menu mobile", () => {
    render(
      <MemoryRouter initialEntries={["/eventos"]}>
        <Nav />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole("button", { name: "Menu" });
    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("mobile-nav")).toBeNull();

    fireEvent.click(menuButton);
    expect(menuButton.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById("mobile-nav")).toBeTruthy();

    fireEvent.click(menuButton);
    expect(menuButton.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("mobile-nav")).toBeNull();
  });

  it("faz logout e navega para login", () => {
    setToken("test-token");

    render(
      <MemoryRouter initialEntries={["/eventos"]}>
        <Nav />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sair" }));
    expect(screen.queryByRole("link", { name: "Perfil" })).toBeNull();
  });

  it("fecha menu mobile ao navegar e cobre reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        dispatchEvent: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }),
    );

    setToken("test-token");
    render(
      <MemoryRouter initialEntries={["/eventos"]}>
        <Nav />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(document.getElementById("mobile-nav")).toBeTruthy();

    const sairButtons = screen.getAllByRole("button", { name: "Sair" });
    fireEvent.click(sairButtons[sairButtons.length - 1]!);
    expect(document.getElementById("mobile-nav")).toBeNull();
  });
});
