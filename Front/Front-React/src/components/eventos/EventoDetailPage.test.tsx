import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Evento, Lote, Palestrante, RedeSocial } from "@/models";
import { EventoDetailPage } from "@/components/eventos/EventoDetailPage";
import { setRoles, setToken } from "@/services/authToken";
import { palestranteService } from "@/services/palestranteService";
import { eventoSchema } from "@/forms/schemas/eventoSchema";

vi.mock("@/services/palestranteService", () => ({
  palestranteService: {
    listAll: vi.fn(),
    getByNome: vi.fn(),
    associate: vi.fn(),
    disassociate: vi.fn(),
  },
}));

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
  palestrantes: [],
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

describe("eventoSchema", () => {
  it("exige tema entre 4 e 50 caracteres e qtd máxima 120000", () => {
    const base = {
      id: 0,
      local: "SP",
      dataEvento: "2026-01-01",
      imagemURL: "",
      telefone: "11999999999",
      email: "ok@example.com",
      lotes: [],
      redesSociais: [],
    };
    expect(eventoSchema.safeParse({ ...base, tema: "abc", qtdPessoas: 1 }).success).toBe(
      false,
    );
    expect(
      eventoSchema.safeParse({ ...base, tema: "abcd", qtdPessoas: 1 }).success,
    ).toBe(true);
    expect(
      eventoSchema.safeParse({
        ...base,
        tema: "a".repeat(51),
        qtdPessoas: 1,
      }).success,
    ).toBe(false);
    expect(
      eventoSchema.safeParse({
        ...base,
        tema: "Evento",
        qtdPessoas: 120001,
      }).success,
    ).toBe(false);
    expect(
      eventoSchema.safeParse({
        ...base,
        tema: "Evento",
        email: "invalido",
        qtdPessoas: 10,
      }).success,
    ).toBe(false);
  });
});

describe("EventoDetailPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    setToken("test-token");
    setRoles(["User"]);
    vi.mocked(palestranteService.listAll).mockReset();
    vi.mocked(palestranteService.getByNome).mockReset();
    vi.mocked(palestranteService.associate).mockReset();
    vi.mocked(palestranteService.disassociate).mockReset();
  });

  it("renderiza formulário vazio para novo evento", async () => {
    renderDetail("/eventos/new");

    expect(await screen.findByRole("heading", { name: "Novo evento" })).toBeTruthy();
    expect(screen.getByLabelText("Tema")).toHaveProperty("value", "");
    expect(screen.getByRole("button", { name: "Salvar" })).toBeTruthy();
  });

  it("trata id 0 como novo evento sem buscar na API", async () => {
    renderDetail("/eventos/0");

    expect(await screen.findByRole("heading", { name: "Novo evento" })).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
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
      target: { value: "Falha Evento" },
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

  it("espelha digitação no preview no create (two-way binding)", async () => {
    renderDetail("/eventos/new");

    fireEvent.change(await screen.findByLabelText("Local"), {
      target: { value: "Arena Live" },
    });
    fireEvent.change(screen.getByLabelText("Telefone"), {
      target: { value: "11911112222" },
    });
    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "live@test.com" },
    });

    const card = screen.getByTestId("evento-preview-card");
    expect(card.textContent).toContain("Arena Live");
    expect(card.textContent).toContain("11911112222");
    expect(card.textContent).toContain("live@test.com");
  });

  it("espelha dataEvento no preview ao alterar o DatePicker", async () => {
    renderDetail("/eventos/new");

    await screen.findByLabelText("Local");
    const dateInput = document.getElementById("dataEvento") as HTMLInputElement;
    expect(dateInput).toBeTruthy();
    fireEvent.change(dateInput, { target: { value: "2026-07-20" } });

    await waitFor(() => {
      expect(screen.getByTestId("evento-preview-card").textContent).toMatch(
        /20\/07\/2026/,
      );
    });
  });

  it("preenche formulário e preview no edit e continua espelhando mudanças", async () => {
    mockFetchJson(mockEvento);
    mockFetchJson(mockLotes);
    mockFetchJson(mockRedes);

    renderDetail("/eventos/1");

    await screen.findByDisplayValue("São Paulo");
    const card = screen.getByTestId("evento-preview-card");
    expect(card.textContent).toContain("São Paulo");
    expect(card.textContent).toContain("11999999999");
    expect(card.textContent).toContain("contato@example.com");

    fireEvent.change(screen.getByLabelText("Local"), {
      target: { value: "Campinas" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("evento-preview-card").textContent).toContain(
        "Campinas",
      );
    });
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

  it("exclui lote persistido após confirmação", async () => {
    mockFetchJson(mockEvento);
    mockFetchJson(mockLotes);
    mockFetchJson(mockRedes);
    mockFetchJson({ message: "Deletado" });

    renderDetail("/eventos/1");

    await screen.findByDisplayValue("VIP");
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/lotes/1/1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(await screen.findByText("Lote excluído com sucesso.")).toBeTruthy();
    expect(screen.queryByDisplayValue("VIP")).toBeNull();
  });

  it("remove lote local sem DELETE quando id é 0", async () => {
    renderDetail("/eventos/new");

    fireEvent.click(await screen.findByRole("button", { name: "+ Lote" }));
    expect(screen.getByLabelText("Nome")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("Nome")).toBeNull();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("exclui rede social persistida após confirmação", async () => {
    mockFetchJson(mockEvento);
    mockFetchJson(mockLotes);
    mockFetchJson(mockRedes);
    mockFetchJson({ message: "Deletado" });

    renderDetail("/eventos/1");

    await screen.findByDisplayValue("Instagram");
    const excluirButtons = screen.getAllByRole("button", { name: "Excluir" });
    fireEvent.click(excluirButtons[excluirButtons.length - 1]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/redes-sociais/evento/1/1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(
      await screen.findByText("Rede social excluída com sucesso."),
    ).toBeTruthy();
  });

  it("oculta ações de escrita sem role User", async () => {
    setRoles(["Palestrante"]);
    renderDetail("/eventos/new");

    expect(await screen.findByRole("heading", { name: "Novo evento" })).toBeTruthy();
    expect(
      screen.getByText(/Acesso somente leitura/),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Salvar" })).toBeNull();
  });

  it("associa palestrante ao evento", async () => {
    const speaker: Palestrante = {
      id: 9,
      nome: "Carlos Speaker",
      miniCurriculo: "",
      imagemURL: "",
      telefone: "11999999999",
      email: "carlos@example.com",
    };
    mockFetchJson(mockEvento);
    mockFetchJson(mockLotes);
    mockFetchJson(mockRedes);
    vi.mocked(palestranteService.listAll).mockResolvedValue([speaker]);
    vi.mocked(palestranteService.associate).mockResolvedValue({
      message: "Associado",
    });

    renderDetail("/eventos/1");

    await screen.findByText("Nenhum palestrante associado.");
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByText("Carlos Speaker")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    await waitFor(() => {
      expect(palestranteService.associate).toHaveBeenCalledWith(1, 9);
    });
    expect(screen.getByText("Carlos Speaker")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Desassociar" })).toBeTruthy();
  });

  it("desassocia palestrante após confirmação", async () => {
    const linked: Palestrante = {
      id: 3,
      nome: "Ana Linked",
      miniCurriculo: "",
      imagemURL: "",
      telefone: "11999999999",
      email: "ana@example.com",
    };
    mockFetchJson({ ...mockEvento, palestrantes: [linked] });
    mockFetchJson(mockLotes);
    mockFetchJson(mockRedes);
    vi.mocked(palestranteService.disassociate).mockResolvedValue({
      message: "Removido",
    });

    renderDetail("/eventos/1");

    expect(await screen.findByText("Ana Linked")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Desassociar" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Desassociar" }),
    );

    await waitFor(() => {
      expect(palestranteService.disassociate).toHaveBeenCalledWith(1, 3);
    });
    expect(await screen.findByText("Nenhum palestrante associado.")).toBeTruthy();
  });
});
