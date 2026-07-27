import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Evento, Lote, RedeSocial } from "@/models";
import { EventoDetailPage } from "@/components/eventos/EventoDetailPage";

const mockEvento: Evento = {
  id: 1,
  tema: "Summit React",
  local: "São Paulo",
  dataEvento: "15-09-2026",
  qtdPessoas: 200,
  imagemURL: "https://example.com/img.jpg",
  telefone: "11999999999",
  email: "contato@example.com",
  lotes: [],
  redesSociais: [],
};

const mockLotes: Lote[] = [
  {
    id: 1,
    nome: "VIP",
    preco: 150,
    dataIncio: "01-08-2026",
    dataFim: "15-09-2026",
    quantidade: 30,
    eventoId: 1,
  },
];

const mockRedes: RedeSocial[] = [
  { id: 1, nome: "Instagram", url: "https://instagram.com/pro", eventoId: 1 },
];

function mockFetchJson(data: unknown, ok = true, status = 200) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => data,
  } as Response);
}

function renderDetail(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/eventos/:id" element={<EventoDetailPage />} />
        <Route path="/eventos/:id/view" element={<EventoDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EventoDetailPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renderiza formulário vazio para novo evento", async () => {
    renderDetail("/eventos/new");

    expect(await screen.findByRole("heading", { name: "Novo evento" })).toBeTruthy();
    expect(screen.getByLabelText("Tema")).toHaveProperty("value", "");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeTruthy();
  });

  it("carrega evento existente com lotes e redes", async () => {
    mockFetchJson(mockEvento);
    mockFetchJson(mockLotes);
    mockFetchJson(mockRedes);

    renderDetail("/eventos/1");

    expect(await screen.findByDisplayValue("Summit React")).toBeTruthy();
    expect(screen.getByDisplayValue("São Paulo")).toBeTruthy();
    expect(screen.getByDisplayValue("VIP")).toBeTruthy();
    expect(screen.getByDisplayValue("Instagram")).toBeTruthy();
  });

  it("exibe erro para id inválido", async () => {
    renderDetail("/eventos/abc");

    expect(await screen.findByText("ID inválido.")).toBeTruthy();
  });

  it("exibe erro quando evento não é encontrado", async () => {
    mockFetchJson(null, false, 404);
    mockFetchJson([], false, 404);
    mockFetchJson([], false, 404);

    renderDetail("/eventos/99");

    expect(await screen.findByText("Evento não encontrado.")).toBeTruthy();
  });

  it("cria evento e navega para detalhe", async () => {
    localStorage.setItem("proeventos_token", "test-token");
    const saved = { ...mockEvento, id: 5, tema: "Novo Evento" };
    mockFetchJson(saved);
    mockFetchJson(mockLotes);
    mockFetchJson(mockRedes);

    render(
      <MemoryRouter initialEntries={["/eventos/new"]}>
        <Routes>
          <Route path="/eventos/:id" element={<EventoDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(await screen.findByLabelText("Tema"), {
      target: { value: "Novo Evento" },
    });
    fireEvent.change(screen.getByLabelText("Local"), {
      target: { value: "São Paulo" },
    });
    fireEvent.change(screen.getByLabelText("Data do evento"), {
      target: { value: "2026-09-15" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "11999999999" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "novo@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Lote" }));
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Early Bird" },
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Rede" }));
    fireEvent.change(screen.getByPlaceholderText("Nome"), {
      target: { value: "LinkedIn" },
    });
    fireEvent.change(screen.getByPlaceholderText("URL"), {
      target: { value: "https://linkedin.com/pro" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/eventos",
        expect.objectContaining({ method: "POST" }),
      );
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/lotes/5",
        expect.objectContaining({ method: "PUT" }),
      );
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/redes-sociais/evento/5",
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });

  it("atualiza evento existente", async () => {
    localStorage.setItem("proeventos_token", "test-token");
    mockFetchJson(mockEvento);
    mockFetchJson(mockLotes);
    mockFetchJson(mockRedes);
    mockFetchJson({ ...mockEvento, tema: "Summit Atualizado" });
    mockFetchJson(mockLotes);
    mockFetchJson(mockRedes);

    renderDetail("/eventos/1");

    const temaInput = await screen.findByDisplayValue("Summit React");
    fireEvent.change(temaInput, { target: { value: "Summit Atualizado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/eventos/1",
        expect.objectContaining({ method: "PUT" }),
      );
    });
  });

  it("exibe erro ao falhar ao salvar", async () => {
    renderDetail("/eventos/new");

    fireEvent.change(await screen.findByLabelText("Tema"), {
      target: { value: "Falha" },
    });
    fireEvent.change(screen.getByLabelText("Local"), {
      target: { value: "SP" },
    });
    fireEvent.change(screen.getByLabelText("Data do evento"), {
      target: { value: "2026-01-01" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "11999999999" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "falha@example.com" },
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Error",
    } as Response);

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Erro ao salvar evento.")).toBeTruthy();
  });

  it("atualiza campos do formulário", async () => {
    renderDetail("/eventos/new");

    fireEvent.change(await screen.findByLabelText("Local"), {
      target: { value: "Campinas" },
    });
    fireEvent.change(screen.getByLabelText("Qtd pessoas"), {
      target: { value: "50" },
    });

    expect(screen.getByLabelText("Local")).toHaveProperty("value", "Campinas");
    expect(screen.getByLabelText("Qtd pessoas")).toHaveProperty("value", "50");
  });

  it("atualiza preço e quantidade de lote", async () => {
    mockFetchJson(mockEvento);
    mockFetchJson(mockLotes);
    mockFetchJson(mockRedes);

    renderDetail("/eventos/1");

    await screen.findByDisplayValue("VIP");

    fireEvent.change(screen.getByLabelText("Preço"), {
      target: { value: "200" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade"), {
      target: { value: "40" },
    });

    expect(screen.getByLabelText("Preço")).toHaveProperty("value", "R$\xa0200");
    expect(screen.getByLabelText("Quantidade")).toHaveProperty(
      "value",
      "40",
    );
  });

  it("mostra preview com imagem remota e espelha dados do formulário", async () => {
    mockFetchJson(mockEvento);
    mockFetchJson(mockLotes);
    mockFetchJson(mockRedes);

    renderDetail("/eventos/1");

    const img = await screen.findByAltText("Imagem do evento");
    expect(img).toHaveProperty("src", "https://example.com/img.jpg");

    const card = screen.getByTestId("evento-preview-card");
    expect(card.textContent).toContain("São Paulo");
    expect(card.textContent).toContain("11999999999");
    expect(card.textContent).toContain("contato@example.com");
  });

  it("abre editor de URL no card e rejeita path local", async () => {
    renderDetail("/eventos/new");

    fireEvent.click(
      await screen.findByText("Clique para informar URL da imagem"),
    );

    const urlInput = screen.getByLabelText("URL da imagem");
    fireEvent.change(urlInput, { target: { value: "/assets/local.jpg" } });
    fireEvent.blur(urlInput);

    expect(
      await screen.findByText(/Use um link http:\/\/ ou https:\/\//),
    ).toBeTruthy();

    fireEvent.change(urlInput, {
      target: { value: "https://cdn.example.com/ok.jpg" },
    });
    fireEvent.keyDown(urlInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByAltText("Imagem do evento")).toHaveProperty(
        "src",
        "https://cdn.example.com/ok.jpg",
      );
    });
  });
});
