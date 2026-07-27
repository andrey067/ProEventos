import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LoginPage } from "@/components/user/LoginPage";

describe("LoginPage", () => {
  it("renderiza formulário de login", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Login" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Cadastre-se" })).toBeTruthy();
  });
});
