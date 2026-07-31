import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PerfilDetalhe } from "@/components/user/PerfilDetalhe";
import { accountService } from "@/services/accountService";

vi.mock("@/services/accountService", () => ({
  accountService: {
    updateProfile: vi.fn(),
  },
}));

const baseProfile = {
  nome: "Ana Silva",
  userName: "ana",
  email: "ana@test.com",
  primeiroNome: "Ana",
  ultimoNome: "Silva",
  titulo: "NaoInformado" as const,
  funcao: "Participante" as const,
  telefone: "11988887777",
  descricao: "Bio da Ana",
  imagemURL: null,
  eventosMinistrados: 0,
  eventosParticipados: 0,
};

describe("PerfilDetalhe", () => {
  beforeEach(() => {
    vi.mocked(accountService.updateProfile).mockReset();
  });

  it("calls onPreview on mount with profile values", async () => {
    const onPreview = vi.fn();
    render(
      <PerfilDetalhe
        profile={baseProfile}
        onPreview={onPreview}
        onSaved={vi.fn()}
        onCancelled={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(onPreview).toHaveBeenCalledWith({
        primeiroNome: "Ana",
        ultimoNome: "Silva",
        descricao: "Bio da Ana",
        funcao: "Participante",
      });
    });
  });

  it("calls updateProfile and onSaved on submit", async () => {
    const onSaved = vi.fn();
    vi.mocked(accountService.updateProfile).mockResolvedValue({
      ...baseProfile,
      ultimoNome: "Atualizada",
      nome: "Ana Atualizada",
    });

    render(
      <PerfilDetalhe
        profile={baseProfile}
        onPreview={vi.fn()}
        onSaved={onSaved}
        onCancelled={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/último nome/i), {
      target: { value: "Atualizada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar Alteração" }));

    await waitFor(() => {
      expect(accountService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          primeiroNome: "Ana",
          ultimoNome: "Atualizada",
          userName: "ana",
        }),
      );
    });
    expect(onSaved).toHaveBeenCalled();
    expect(await screen.findByText("Perfil atualizado com sucesso.")).toBeTruthy();
  });

  it("calls onCancelled on cancel", async () => {
    const onCancelled = vi.fn();
    render(
      <PerfilDetalhe
        profile={baseProfile}
        onPreview={vi.fn()}
        onSaved={vi.fn()}
        onCancelled={onCancelled}
      />,
    );

    await screen.findByDisplayValue("Ana");
    fireEvent.change(screen.getByLabelText(/último nome/i), {
      target: { value: "Alterado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar Alteração" }));

    expect(onCancelled).toHaveBeenCalled();
    expect(screen.getByDisplayValue("Silva")).toBeTruthy();
  });
});
