import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePage } from "@/components/user/ProfilePage";
import { accountService } from "@/services/accountService";
import { palestranteService } from "@/services/palestranteService";
import { redeSocialService } from "@/services/redeSocialService";

vi.mock("@/services/accountService", () => ({
  accountService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock("@/services/redeSocialService", () => ({
  redeSocialService: {
    getMine: vi.fn(),
    saveMine: vi.fn(),
    deleteMine: vi.fn(),
  },
}));

vi.mock("@/services/palestranteService", () => ({
  palestranteService: {
    getMe: vi.fn(),
    update: vi.fn(),
  },
}));

const baseProfile = {
  nome: "Ana Silva",
  userName: "ana",
  email: "ana@example.com",
  primeiroNome: "Ana",
  ultimoNome: "Silva",
  titulo: "NaoInformado" as const,
  funcao: "Participante" as const,
  telefone: "11988887777",
  descricao: "Organizer",
  imagemURL: "https://images.unsplash.com/photo-1?w=200",
  eventosMinistrados: 2,
  eventosParticipados: 0,
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.mocked(accountService.getProfile).mockReset();
    vi.mocked(accountService.updateProfile).mockReset();
    vi.mocked(redeSocialService.getMine).mockReset();
    vi.mocked(redeSocialService.saveMine).mockReset();
    vi.mocked(redeSocialService.deleteMine).mockReset();
    vi.mocked(palestranteService.getMe).mockReset();
    vi.mocked(palestranteService.update).mockReset();
    vi.mocked(palestranteService.getMe).mockResolvedValue({
      id: 1,
      nome: "",
      email: "",
      telefone: "",
      imagemURL: "",
      miniCurriculo: "",
    });
    vi.mocked(redeSocialService.getMine).mockResolvedValue([]);
  });

  it("carrega telefone e descricao no formulário", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(await screen.findByDisplayValue("11988887777")).toBeTruthy();
    expect(screen.getByDisplayValue("Organizer")).toBeTruthy();
    expect(screen.getByText("@ana")).toBeTruthy();
    expect(screen.getByText("Eventos Ministrados")).toBeTruthy();
    expect(accountService.getProfile).toHaveBeenCalled();
  });

  it("salva telefone e descricao via updateProfile", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);
    vi.mocked(accountService.updateProfile).mockResolvedValue({
      ...baseProfile,
      telefone: "11977776666",
      descricao: "Atualizado",
    });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await screen.findByDisplayValue("11988887777");

    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "11977776666" },
    });
    fireEvent.change(screen.getByLabelText("Descrição"), {
      target: { value: "Atualizado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar Alteração" }));

    await waitFor(() => {
      expect(accountService.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          primeiroNome: "Ana",
          ultimoNome: "Silva",
          userName: "ana",
          email: "ana@example.com",
          telefone: "11977776666",
          descricao: "Atualizado",
        }),
      );
    });
    expect(await screen.findByText("Perfil atualizado com sucesso.")).toBeTruthy();
  });

  it("exibe erro ao falhar carregamento", async () => {
    vi.mocked(accountService.getProfile).mockRejectedValue(new Error("fail"));

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Não foi possível carregar o perfil."),
    ).toBeTruthy();
  });

  it("exibe erro ao falhar salvamento", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);
    vi.mocked(accountService.updateProfile).mockRejectedValue(new Error("fail"));

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await screen.findByDisplayValue("11988887777");
    fireEvent.click(screen.getByRole("button", { name: "Salvar Alteração" }));

    expect(
      await screen.findByText("Erro ao salvar perfil."),
    ).toBeTruthy();
  });

  it("cancelEdit restores form values", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    const telefone = await screen.findByLabelText("Telefone");
    fireEvent.change(telefone, { target: { value: "11900001111" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar Alteração" }));

    expect(screen.getByDisplayValue("11988887777")).toBeTruthy();
  });

  it("uses placeholder when profile image fails", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    const img = await screen.findByAltText("Foto de perfil");
    fireEvent.error(img);
    expect(img.getAttribute("src")).toContain("data:image/svg+xml");
  });

  it("oculta redes para Participante", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await screen.findByDisplayValue("11988887777");
    expect(screen.queryByRole("button", { name: "Salvar Redes" })).toBeNull();
    expect(redeSocialService.getMine).not.toHaveBeenCalled();
  });

  it("atualiza card nome/descricao ao vivo", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    await screen.findByDisplayValue(baseProfile.primeiroNome);
    const primeiro = screen.getByLabelText(/primeiro nome/i);
    fireEvent.change(primeiro, { target: { value: "Live" } });
    expect(await screen.findByText(/Live/)).toBeTruthy();
  });

  it("oculta tabs Palestrante e Rede Social para Participante", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    await screen.findByRole("tablist");
    expect(screen.queryByRole("tab", { name: "Palestrante" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Rede Social" })).not.toBeInTheDocument();
  });

  it("mostra tabs extras ao selecionar função Palestrante", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    await screen.findByLabelText(/função/i);
    fireEvent.change(screen.getByLabelText(/função/i), {
      target: { value: "Palestrante" },
    });
    expect(await screen.findByRole("tab", { name: "Palestrante" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Rede Social" })).toBeTruthy();
  });

  it("chama getMe ao tornar-se Palestrante", async () => {
    vi.mocked(accountService.getProfile).mockResolvedValue(baseProfile);
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );
    await screen.findByLabelText(/função/i);
    fireEvent.change(screen.getByLabelText(/função/i), {
      target: { value: "Palestrante" },
    });
    await waitFor(() => {
      expect(palestranteService.getMe).toHaveBeenCalled();
    });
  });

});
