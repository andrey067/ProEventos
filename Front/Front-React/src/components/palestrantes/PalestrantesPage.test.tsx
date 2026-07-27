import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Palestrante } from "@/models";
import { PalestrantesPage } from "@/components/palestrantes/PalestrantesPage";
import { setToken } from "@/services/authToken";

const mockPalestrantes: Palestrante[] = [
  {
    id: 1,
    nome: "Ana Silva",
    miniCurriculo: "Especialista em React",
    imagemURL: "",
    telefone: "11999999999",
    email: "ana@example.com",
  },
];

function mockFetchJson(data: unknown, ok = true, status = 200) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => data,
  } as Response);
}

describe("PalestrantesPage", () => {
  beforeEach(() => {
    setToken("test-token");
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("alert", vi.fn());
  });

  it("carrega e exibe palestrantes", async () => {
    mockFetchJson(mockPalestrantes);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ana Silva")).toBeTruthy();
    expect(screen.getByText("ana@example.com")).toBeTruthy();
  });

  it("exibe mensagem quando lista está vazia", async () => {
    mockFetchJson([]);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Nenhum palestrante cadastrado."),
    ).toBeTruthy();
  });

  it("cadastra novo palestrante", async () => {
    mockFetchJson([]);
    mockFetchJson({ ...mockPalestrantes[0], id: 2, nome: "Carlos" });
    mockFetchJson([{ ...mockPalestrantes[0], id: 2, nome: "Carlos" }]);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Nenhum palestrante cadastrado.");

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Carlos" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/palestrantes",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(await screen.findByText("Carlos")).toBeTruthy();
  });

  it("entra em modo edição e atualiza palestrante", async () => {
    mockFetchJson(mockPalestrantes);
    mockFetchJson({ ...mockPalestrantes[0], nome: "Ana Atualizada" });
    mockFetchJson([{ ...mockPalestrantes[0], nome: "Ana Atualizada" }]);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByRole("heading", { name: "Editar palestrante" })).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Atualizada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Atualizar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/palestrantes/1",
        expect.objectContaining({ method: "PUT" }),
      );
    });

    expect(await screen.findByText("Ana Atualizada")).toBeTruthy();
  });

  it("cancela edição e limpa formulário", async () => {
    mockFetchJson(mockPalestrantes);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");
    fireEvent.click(screen.getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Nome temporário" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByRole("heading", { name: "Novo palestrante" })).toBeTruthy();
    expect(screen.getByLabelText("Nome")).toHaveProperty("value", "");
  });

  it("atualiza mini currículo no formulário", async () => {
    mockFetchJson([]);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Nenhum palestrante cadastrado.");

    fireEvent.change(screen.getByLabelText("Mini currículo"), {
      target: { value: "Palestrante experiente" },
    });

    expect(screen.getByLabelText("Mini currículo")).toHaveProperty(
      "value",
      "Palestrante experiente",
    );
  });

  it("deleta palestrante após confirmação", async () => {
    mockFetchJson(mockPalestrantes);
    mockFetchJson({ message: "Deletado" });
    mockFetchJson([]);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Excluir" }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/palestrantes/1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    expect(
      await screen.findByText("Nenhum palestrante cadastrado."),
    ).toBeTruthy();
  });

  it("exibe erro ao falhar carregamento", async () => {
    mockFetchJson(null, false, 500);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Não foi possível carregar palestrantes."),
    ).toBeTruthy();
  });

  it("exibe erro ao falhar salvamento", async () => {
    mockFetchJson([]);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Nenhum palestrante cadastrado.");

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Falha" },
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Error",
    } as Response);

    fireEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("Erro ao salvar palestrante.")).toBeTruthy();
  });

  it("alerta quando falha ao deletar", async () => {
    mockFetchJson(mockPalestrantes);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Error",
    } as Response);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Excluir" }),
    );

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith("Erro ao deletar palestrante.");
    });
  });
});
