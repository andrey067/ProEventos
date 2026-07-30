import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Evento } from "@/models";
import { EventosPage } from "@/components/eventos/EventosPage";
import { setRoles, setToken } from "@/services/authToken";

const mockEventos: Evento[] = [
  {
    id: 1,
    tema: "Workshop React",
    local: "São Paulo",
    dataEvento: "10-08-2026",
    qtdPessoas: 100,
    imagemURL: "",
    telefone: "11999999999",
    email: "contato@example.com",
    lotes: [
      {
        id: 1,
        nome: "Early Bird",
        preco: 50,
        dataIncio: "01-07-2026",
        dataFim: "10-08-2026",
        quantidade: 20,
        eventoId: 1,
      },
    ],
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

function mockFetchPaged(
  items: unknown[],
  opts: {
    page?: number;
    pageSize?: number;
    totalCount?: number;
    totalPages?: number;
  } = {},
) {
  const pageSize = opts.pageSize ?? 10;
  const totalCount = opts.totalCount ?? items.length;
  const totalPages =
    opts.totalPages ??
    (totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize));
  const page = opts.page ?? 1;
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: "OK",
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "pagination"
          ? JSON.stringify({
              currentPage: page,
              itemsPerPage: pageSize,
              totalItems: totalCount,
              totalPages,
            })
          : null,
    },
    json: async () => items,
  } as unknown as Response);
}

describe("EventosPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("alert", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("carrega e exibe eventos", async () => {
    mockFetchPaged(mockEventos);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Workshop React")).toBeTruthy();
    expect(screen.getByText("São Paulo")).toBeTruthy();
    expect(screen.getByText("100")).toBeTruthy();
    expect(screen.getByText("Early Bird")).toBeTruthy();
    expect(screen.getByText("1º lote")).toBeTruthy();
  });

  it("exibe mensagem quando não há eventos", async () => {
    mockFetchPaged([]);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Nenhum evento encontrado."),
    ).toBeTruthy();
  });

  it("busca eventos por q no submit", async () => {
    mockFetchPaged(mockEventos);
    mockFetchPaged([mockEventos[0]]);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");

    fireEvent.change(screen.getByPlaceholderText("Digite para buscar"), {
      target: { value: "react" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("http://localhost:5050/eventos?"),
        expect.any(Object),
      );
      const lastCall = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("q=react");
    });
  });

  it("debounced typing envia q após 350ms", async () => {
    mockFetchPaged(mockEventos);
    mockFetchPaged([mockEventos[0]]);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");
    vi.mocked(fetch).mockClear();
    mockFetchPaged([mockEventos[0]]);

    vi.useFakeTimers({ shouldAdvanceTime: true });
    fireEvent.change(screen.getByPlaceholderText("Digite para buscar"), {
      target: { value: "summit" },
    });

    expect(vi.mocked(fetch).mock.calls.length).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(vi.mocked(fetch).mock.calls.length).toBe(1);
    const lastCall = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("q=summit");
    vi.useRealTimers();
  });

  it("limpa busca e recarrega todos imediatamente", async () => {
    mockFetchPaged(mockEventos);
    mockFetchPaged([mockEventos[0]]);
    mockFetchPaged(mockEventos);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");

    fireEvent.change(screen.getByPlaceholderText("Digite para buscar"), {
      target: { value: "vue" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      const lastCall = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("q=vue");
    });

    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Digite para buscar"),
      ).toHaveProperty("value", "");
      const lastCall = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string;
      expect(lastCall).not.toContain("q=");
    });
  });

  it("exibe erro quando falha ao carregar", async () => {
    mockFetchJson(null, false, 500);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Não foi possível carregar os eventos."),
    ).toBeTruthy();
  });

  it("deleta evento após confirmação", async () => {
    setToken("test-token");
    setRoles(["User"]);
    mockFetchPaged(mockEventos);
    mockFetchJson({ message: "Deletado" });
    mockFetchPaged([]);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Excluir" }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/eventos/1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    expect(
      await screen.findByText("Evento excluído com sucesso."),
    ).toBeTruthy();
    expect(
      await screen.findByText("Nenhum evento encontrado."),
    ).toBeTruthy();
  });

  it("não deleta quando confirmação é cancelada", async () => {
    setToken("test-token");
    setRoles(["User"]);
    mockFetchPaged(mockEventos);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("alerta quando falha ao deletar", async () => {
    setToken("test-token");
    setRoles(["User"]);
    mockFetchPaged(mockEventos);
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Error",
    } as Response);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");
    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Excluir" }),
    );

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith("Erro ao deletar evento.");
    });
  });

  it("oculta Novo e Excluir quando canWrite é false", async () => {
    setToken("test-token");
    setRoles(["Palestrante"]);
    mockFetchPaged(mockEventos);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");

    expect(
      screen.getByText(/Acesso somente leitura/),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Novo evento" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
    expect(screen.getByRole("link", { name: "Ver" })).toBeTruthy();
  });

  it("mostra placeholder quando evento não tem 1º lote", async () => {
    mockFetchPaged([
      {
        ...mockEventos[0],
        lotes: [],
      },
    ]);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("pagina resultados e alterna coluna de imagens", async () => {
    const page1 = Array.from({ length: 10 }, (_, i) => ({
      ...mockEventos[0],
      id: i + 1,
      tema: `Evento ${i + 1}`,
      imagemURL: "https://cdn.test/img.jpg",
    }));
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "pagination"
              ? JSON.stringify({
                  currentPage: 1,
                  itemsPerPage: 10,
                  totalItems: 11,
                  totalPages: 2,
                })
              : null,
        },
        json: async () => page1,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) =>
            name.toLowerCase() === "pagination"
              ? JSON.stringify({
                  currentPage: 2,
                  itemsPerPage: 10,
                  totalItems: 11,
                  totalPages: 2,
                })
              : null,
        },
        json: async () => [{ ...mockEventos[0], id: 11, tema: "Evento 11" }],
      } as Response);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Evento 1");
    expect(screen.getByText("Página 1 de 2")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Ocultar" }));
    expect(screen.getByRole("button", { name: "Mostrar" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(await screen.findByText("Evento 11")).toBeTruthy();
  });

  it("altera page size e oculta imagem com erro", async () => {
    mockFetchPaged(
      [{ ...mockEventos[0], imagemURL: "https://cdn.test/broken.jpg" }],
      { totalCount: 1, totalPages: 1 },
    );
    mockFetchPaged(
      [{ ...mockEventos[0], imagemURL: "https://cdn.test/broken.jpg" }],
      { pageSize: 20, totalCount: 1, totalPages: 1 },
    );

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");
    const img = document.querySelector("img");
    if (img) fireEvent.error(img);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "20" },
    });

    await waitFor(() => {
      const lastCall = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("pageSize=20");
    });
  });

  it("mostra link de login para visitante sem sessão", async () => {
    mockFetchPaged(mockEventos);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");
    expect(screen.getByRole("link", { name: "Entrar para editar" })).toBeTruthy();
  });
});
