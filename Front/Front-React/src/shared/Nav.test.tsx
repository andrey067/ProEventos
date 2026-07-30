import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { clearToken, setToken } from "@/services/authToken";
import { Nav } from "@/shared/Nav";

describe("Nav", () => {
  beforeEach(() => {
    clearToken();
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
});
