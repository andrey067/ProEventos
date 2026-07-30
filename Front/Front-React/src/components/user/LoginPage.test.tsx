import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "@/components/user/LoginPage";
import { accountService } from "@/services/accountService";
import { HttpError } from "@/services/http";

vi.mock("@/services/accountService", () => ({
  accountService: {
    login: vi.fn(),
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.mocked(accountService.login).mockReset();
  });

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

  it("autentica e redireciona para rota anterior", async () => {
    vi.mocked(accountService.login).mockResolvedValue({
      token: "jwt",
      userName: "ana",
      email: "ana@test.com",
      nome: "Ana",
      roles: ["User"],
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: { pathname: "/perfil" } } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/perfil" element={<div>Perfil</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Usuário"), {
      target: { value: "ana" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Perfil")).toBeTruthy();
    expect(accountService.login).toHaveBeenCalledWith({
      userName: "ana",
      password: "secret",
    });
  });

  it("exibe erro 401 e erro genérico", async () => {
    vi.mocked(accountService.login).mockRejectedValueOnce(
      new HttpError(401, "Credenciais inválidas"),
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Usuário"), {
      target: { value: "ana" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Credenciais inválidas")).toBeTruthy();

    vi.mocked(accountService.login).mockRejectedValueOnce(new Error("network"));
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(
      await screen.findByText("Não foi possível entrar. Tente novamente."),
    ).toBeTruthy();
  });
});
