import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordPage } from "@/components/user/ChangePasswordPage";
import { accountService } from "@/services/accountService";

vi.mock("@/services/accountService", () => ({
  accountService: {
    changePassword: vi.fn(),
  },
}));

describe("ChangePasswordPage", () => {
  beforeEach(() => {
    vi.mocked(accountService.changePassword).mockReset();
  });

  it("bloqueia submit quando senhas não coincidem", async () => {
    render(
      <MemoryRouter>
        <ChangePasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Senha atual"), {
      target: { value: "atual" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "nova1" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "nova2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(await screen.findByText("As senhas não coincidem")).toBeTruthy();
    expect(accountService.changePassword).not.toHaveBeenCalled();
  });

  it("submete quando senhas coincidem", async () => {
    vi.mocked(accountService.changePassword).mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <ChangePasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Senha atual"), {
      target: { value: "atual" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "nova1" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "nova1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    await waitFor(() => {
      expect(accountService.changePassword).toHaveBeenCalledWith({
        currentPassword: "atual",
        newPassword: "nova1",
      });
    });
    expect(await screen.findByText("Senha alterada com sucesso.")).toBeTruthy();
  });

  it("exibe erro quando API falha", async () => {
    vi.mocked(accountService.changePassword).mockRejectedValue(new Error("fail"));

    render(
      <MemoryRouter>
        <ChangePasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Senha atual"), {
      target: { value: "atual" },
    });
    fireEvent.change(screen.getByLabelText("Nova senha"), {
      target: { value: "nova1" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar nova senha"), {
      target: { value: "nova1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));

    expect(await screen.findByText(/não foi possível|erro/i)).toBeTruthy();
  });
});
