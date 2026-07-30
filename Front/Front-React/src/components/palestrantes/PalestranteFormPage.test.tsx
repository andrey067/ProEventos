import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Palestrante } from "@/models";
import { PalestranteFormPage } from "@/components/palestrantes/PalestranteFormPage";
import { setRoles, setToken } from "@/services/authToken";

const mockPalestrante: Palestrante = {
  id: 1,
  nome: "Ana Silva",
  miniCurriculo: "Especialista em React",
  imagemURL: "https://example.com/ana.jpg",
  telefone: "11999999999",
  email: "ana@example.com",
};

function mockFetchJson(data: unknown, ok = true, status = 200) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => data,
  } as Response);
}

function renderForm(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/palestrantes" element={<div>Lista</div>} />
        <Route path="/palestrantes/new" element={<PalestranteFormPage />} />
        <Route path="/palestrantes/:id" element={<PalestranteFormPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PalestranteFormPage", () => {
  beforeEach(() => {
    setToken("test-token");
    setRoles(["User"]);
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renderiza formulário de criação", async () => {
    renderForm("/palestrantes/new");

    expect(
      await screen.findByRole("heading", { name: "Novo palestrante" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Nome")).toHaveProperty("value", "");
  });

  it("cadastra novo palestrante e navega para lista", async () => {
    mockFetchJson({ ...mockPalestrante, id: 2, nome: "Carlos" });

    renderForm("/palestrantes/new");

    await screen.findByRole("heading", { name: "Novo palestrante" });
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Carlos" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/palestrantes",
        expect.objectContaining({ method: "POST" }),
      );
    });

    expect(await screen.findByText("Lista")).toBeTruthy();
  });

  it("carrega palestrante para edição e atualiza", async () => {
    mockFetchJson(mockPalestrante);
    mockFetchJson([]);
    mockFetchJson({ ...mockPalestrante, nome: "Ana Atualizada" });

    renderForm("/palestrantes/1");

    expect(
      await screen.findByRole("heading", { name: "Editar palestrante" }),
    ).toBeTruthy();
    expect(screen.getByLabelText("Nome")).toHaveProperty("value", "Ana Silva");

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Ana Atualizada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/palestrantes/1",
        expect.objectContaining({ method: "PUT" }),
      );
    });

    expect(await screen.findByText("Lista")).toBeTruthy();
  });

  it("cancela e navega para lista", async () => {
    renderForm("/palestrantes/new");

    await screen.findByRole("heading", { name: "Novo palestrante" });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(await screen.findByText("Lista")).toBeTruthy();
  });

  it("exibe erro ao falhar salvamento", async () => {
    renderForm("/palestrantes/new");

    await screen.findByRole("heading", { name: "Novo palestrante" });
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Falha" },
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Error",
    } as Response);

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Erro ao salvar palestrante.")).toBeTruthy();
  });

  it("atualiza mini currículo no formulário", async () => {
    renderForm("/palestrantes/new");

    await screen.findByRole("heading", { name: "Novo palestrante" });
    fireEvent.change(screen.getByLabelText("Mini currículo"), {
      target: { value: "Palestrante experiente" },
    });

    expect(screen.getByLabelText("Mini currículo")).toHaveProperty(
      "value",
      "Palestrante experiente",
    );
  });

  it("exibe preview de imagem remota", async () => {
    mockFetchJson(mockPalestrante);
    mockFetchJson([]);

    renderForm("/palestrantes/1");

    expect(await screen.findByAltText("Preview do palestrante")).toHaveProperty(
      "src",
      "https://example.com/ana.jpg",
    );
  });

  it("carrega e salva redes sociais", async () => {
    const redes = [
      {
        id: 1,
        nome: "Instagram",
        url: "https://instagram.com/ana",
        palestranteId: 1,
      },
    ];
    mockFetchJson(mockPalestrante);
    mockFetchJson(redes);
    mockFetchJson(mockPalestrante);
    mockFetchJson(redes);

    renderForm("/palestrantes/1");

    expect(await screen.findByDisplayValue("Instagram")).toBeTruthy();
    expect(screen.getByDisplayValue("https://instagram.com/ana")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "+ Rede" }));
    const nomeInputs = screen.getAllByPlaceholderText("Nome");
    const urlInputs = screen.getAllByPlaceholderText("URL");
    fireEvent.change(nomeInputs[1], { target: { value: "LinkedIn" } });
    fireEvent.change(urlInputs[1], {
      target: { value: "https://linkedin.com/in/ana" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/redes-sociais/palestrante/1",
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });

  it("exclui rede social persistida após confirmação", async () => {
    const redes = [
      {
        id: 5,
        nome: "Twitter",
        url: "https://x.com/ana",
        palestranteId: 1,
      },
    ];
    mockFetchJson(mockPalestrante);
    mockFetchJson(redes);
    mockFetchJson({ message: "Removido" });

    renderForm("/palestrantes/1");

    await screen.findByDisplayValue("Twitter");
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/redes-sociais/palestrante/1/5",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(
      await screen.findByText("Rede social excluída com sucesso."),
    ).toBeTruthy();
  });

  it("oculta salvar quando canWrite é false", async () => {
    setRoles(["Palestrante"]);
    mockFetchJson(mockPalestrante);
    mockFetchJson([]);

    renderForm("/palestrantes/1");

    await screen.findByRole("heading", { name: "Editar palestrante" });
    expect(screen.getByText(/Acesso somente leitura/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
  });
});
