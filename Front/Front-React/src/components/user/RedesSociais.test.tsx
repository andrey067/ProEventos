import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RedesSociais } from "@/components/user/RedesSociais";
import { redeSocialService } from "@/services/redeSocialService";

vi.mock("@/services/redeSocialService", () => ({
  redeSocialService: {
    getMine: vi.fn(),
    saveMine: vi.fn(),
    deleteMine: vi.fn(),
  },
}));

describe("RedesSociais", () => {
  beforeEach(() => {
    vi.mocked(redeSocialService.getMine).mockReset();
    vi.mocked(redeSocialService.saveMine).mockReset();
    vi.mocked(redeSocialService.deleteMine).mockReset();
  });

  it("carrega redes no mount", async () => {
    vi.mocked(redeSocialService.getMine).mockResolvedValue([
      { id: 1, nome: "GitHub", url: "https://github.com/me" },
    ]);

    render(<RedesSociais />);

    await waitFor(() => {
      expect(redeSocialService.getMine).toHaveBeenCalled();
    });
    expect(await screen.findByDisplayValue("GitHub")).toBeTruthy();
  });

  it("carrega e salva redes para Palestrante", async () => {
    vi.mocked(redeSocialService.getMine).mockResolvedValue([
      { id: 1, nome: "GitHub", url: "https://github.com/me" },
    ]);
    vi.mocked(redeSocialService.saveMine).mockResolvedValue([
      { id: 1, nome: "GitHub", url: "https://github.com/updated" },
    ]);

    render(<RedesSociais />);

    await screen.findByText("Redes sociais");
    expect(redeSocialService.getMine).toHaveBeenCalled();

    const urlInput = screen.getByDisplayValue("https://github.com/me");
    fireEvent.change(urlInput, { target: { value: "https://github.com/updated" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar Redes" }));

    await waitFor(() => {
      expect(redeSocialService.saveMine).toHaveBeenCalledWith([
        expect.objectContaining({
          nome: "GitHub",
          url: "https://github.com/updated",
        }),
      ]);
    });
    expect(
      await screen.findByText("Redes sociais salvas com sucesso."),
    ).toBeTruthy();
  });

  it("exclui rede persistida após confirmação", async () => {
    vi.mocked(redeSocialService.getMine).mockResolvedValue([
      { id: 8, nome: "LinkedIn", url: "https://linkedin.com/in/me" },
    ]);
    vi.mocked(redeSocialService.deleteMine).mockResolvedValue({ message: "Removido" });

    render(<RedesSociais />);

    await screen.findByText("Redes sociais");
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const confirmButtons = await screen.findAllByRole("button", { name: "Excluir" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(redeSocialService.deleteMine).toHaveBeenCalledWith(8);
    });
    expect(screen.queryByDisplayValue("https://linkedin.com/in/me")).toBeNull();
  });
});
