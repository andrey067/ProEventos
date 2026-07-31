import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PalestranteDetalhe } from "@/components/user/PalestranteDetalhe";
import { HttpError } from "@/services/http";
import { palestranteService } from "@/services/palestranteService";

vi.mock("@/services/palestranteService", () => ({
  palestranteService: {
    getMe: vi.fn(),
    update: vi.fn(),
  },
}));

describe("PalestranteDetalhe", () => {
  beforeEach(() => {
    vi.mocked(palestranteService.getMe).mockReset();
    vi.mocked(palestranteService.update).mockReset();
  });

  it("chama getMe e preenche o formulário", async () => {
    vi.mocked(palestranteService.getMe).mockResolvedValue({
      id: 7,
      nome: "Speaker",
      email: "s@x.com",
      telefone: "11",
      imagemURL: "",
      miniCurriculo: "Mini",
    });
    render(<PalestranteDetalhe />);
    expect(await screen.findByDisplayValue("Speaker")).toBeInTheDocument();
    expect(palestranteService.getMe).toHaveBeenCalled();
  });

  it("exibe aviso em 404", async () => {
    vi.mocked(palestranteService.getMe).mockRejectedValue(new HttpError(404, "missing"));
    render(<PalestranteDetalhe />);
    expect(
      await screen.findByText("Salve o perfil com função Palestrante primeiro"),
    ).toBeInTheDocument();
  });

  it("salva via update com id do getMe", async () => {
    vi.mocked(palestranteService.getMe).mockResolvedValue({
      id: 7,
      nome: "Speaker",
      email: "",
      telefone: "",
      imagemURL: "",
      miniCurriculo: "",
    });
    vi.mocked(palestranteService.update).mockResolvedValue({
      id: 7,
      nome: "Novo",
      email: "",
      telefone: "",
      imagemURL: "",
      miniCurriculo: "",
    });
    render(<PalestranteDetalhe />);
    await screen.findByDisplayValue("Speaker");
    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: "Novo" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));
    await waitFor(() =>
      expect(palestranteService.update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ id: 7, nome: "Novo" }),
      ),
    );
  });
});
