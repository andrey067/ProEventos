import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterPage } from "@/components/user/RegisterPage";
import { accountService } from "@/services/accountService";

vi.mock("@/services/accountService", () => ({
  accountService: {
    register: vi.fn(),
    registerPalestrante: vi.fn(),
  },
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.mocked(accountService.register).mockReset();
    vi.mocked(accountService.registerPalestrante).mockReset();
  });

  it("exibe campos de palestrante ao marcar o toggle", async () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    expect(screen.queryByLabelText("Mini currículo")).toBeNull();

    fireEvent.click(screen.getByLabelText("Registrar como palestrante"));

    expect(await screen.findByLabelText("Mini currículo")).toBeTruthy();
    expect(screen.getByLabelText("Telefone")).toBeTruthy();
    expect(screen.getByLabelText("URL da imagem (opcional)")).toBeTruthy();
  });

  it("submete com registerPalestrante quando toggle está ativo", async () => {
    vi.mocked(accountService.registerPalestrante).mockResolvedValue({
      token: "t",
      userName: "ana",
      email: "ana@example.com",
      nome: "Ana",
      roles: ["Palestrante"],
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Silva" },
    });
    fireEvent.change(screen.getByLabelText("Usuário"), {
      target: { value: "ana" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "ana@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "Senha123!" },
    });
    fireEvent.click(screen.getByLabelText("Registrar como palestrante"));
    fireEvent.change(await screen.findByLabelText("Mini currículo"), {
      target: { value: "Especialista React" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "11999999999" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => {
      expect(accountService.registerPalestrante).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: "Ana Silva",
          userName: "ana",
          email: "ana@example.com",
          password: "Senha123!",
          miniCurriculo: "Especialista React",
          telefone: "11999999999",
        }),
      );
    });
    expect(accountService.register).not.toHaveBeenCalled();
  });

  it("submits register for participant by default", async () => {
    vi.mocked(accountService.register).mockResolvedValue({
      token: "t",
      userName: "joao",
      email: "joao@example.com",
      nome: "João",
      roles: ["Participante"],
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "João Silva" },
    });
    fireEvent.change(screen.getByLabelText("Usuário"), {
      target: { value: "joao" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "joao@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "Senha123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => {
      expect(accountService.register).toHaveBeenCalled();
    });
    expect(accountService.registerPalestrante).not.toHaveBeenCalled();
  });
});
