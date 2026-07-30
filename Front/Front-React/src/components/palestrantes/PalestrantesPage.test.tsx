import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Palestrante } from "@/models";
import { PalestrantesPage } from "@/components/palestrantes/PalestrantesPage";
import { setRoles, setToken, clearToken } from "@/services/authToken";

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

describe("PalestrantesPage", () => {
  beforeEach(() => {
    setToken("test-token");
    setRoles(["User"]);
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("alert", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("carrega e exibe palestrantes", async () => {
    mockFetchPaged(mockPalestrantes);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Ana Silva")).toBeTruthy();
    expect(screen.getByText("ana@example.com")).toBeTruthy();
  });

  it("exibe mensagem quando lista está vazia", async () => {
    mockFetchPaged([]);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Nenhum palestrante encontrado."),
    ).toBeTruthy();
  });

  it("navega para criar via link Novo palestrante", async () => {
    mockFetchPaged([]);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Nenhum palestrante encontrado.");
    const novo = screen.getByRole("link", { name: "Novo palestrante" });
    expect(novo.getAttribute("href")).toBe("/palestrantes/new");
  });

  it("navega para editar via link Editar", async () => {
    mockFetchPaged(mockPalestrantes);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");
    const editar = screen.getByRole("link", { name: "Editar" });
    expect(editar.getAttribute("href")).toBe("/palestrantes/1");
  });

  it("deleta palestrante após confirmação", async () => {
    mockFetchPaged(mockPalestrantes);
    mockFetchJson({ message: "Deletado" });
    mockFetchPaged([]);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/palestrantes/1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    expect(
      await screen.findByText("Nenhum palestrante encontrado."),
    ).toBeTruthy();
  });

  it("não deleta quando confirmação é cancelada", async () => {
    mockFetchPaged(mockPalestrantes);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");
    fireEvent.click(screen.getAllByRole("button", { name: "Excluir" })[0]);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(vi.mocked(fetch).mock.calls.length).toBe(1);
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

  it("alerta quando falha ao deletar", async () => {
    mockFetchPaged(mockPalestrantes);
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
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith("Erro ao deletar palestrante.");
    });
  });

  it("filtra palestrantes por q no submit", async () => {
    mockFetchPaged(mockPalestrantes);
    mockFetchPaged(mockPalestrantes);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");

    fireEvent.change(screen.getByPlaceholderText("Digite para buscar"), {
      target: { value: "Ana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("http://localhost:5050/palestrantes?"),
        expect.any(Object),
      );
      const lastCall = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("q=Ana");
    });
  });

  it("debounced typing envia q após 350ms", async () => {
    mockFetchPaged(mockPalestrantes);
    mockFetchPaged(mockPalestrantes);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");
    vi.mocked(fetch).mockClear();
    mockFetchPaged(mockPalestrantes);

    vi.useFakeTimers({ shouldAdvanceTime: true });
    fireEvent.change(screen.getByPlaceholderText("Digite para buscar"), {
      target: { value: "React" },
    });

    expect(vi.mocked(fetch).mock.calls.length).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(vi.mocked(fetch).mock.calls.length).toBe(1);
    const lastCall = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("q=React");
    vi.useRealTimers();
  });

  it("limpa busca imediatamente sem q", async () => {
    mockFetchPaged(mockPalestrantes);
    mockFetchPaged(mockPalestrantes);
    mockFetchPaged(mockPalestrantes);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");

    fireEvent.change(screen.getByPlaceholderText("Digite para buscar"), {
      target: { value: "Ana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      const lastCall = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("q=Ana");
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

  it("pagina lista de palestrantes", async () => {
    const page1 = Array.from({ length: 10 }, (_, i) => ({
      ...mockPalestrantes[0],
      id: i + 1,
      nome: `Palestrante ${i + 1}`,
      email: `p${i + 1}@example.com`,
    }));
    const page2Item = {
      ...mockPalestrantes[0],
      id: 11,
      nome: "Palestrante 11",
      email: "p11@example.com",
    };
    mockFetchPaged(page1, { totalCount: 11, totalPages: 2 });

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Palestrante 1")).toBeTruthy();
    expect(screen.getByText("Página 1 de 2")).toBeTruthy();
    expect(screen.queryByText("Palestrante 11")).toBeNull();

    mockFetchPaged([page2Item], { page: 2, totalCount: 11, totalPages: 2 });
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => {
      const lastCall = vi.mocked(fetch).mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("page=2");
    });
    expect(await screen.findByText("Palestrante 11")).toBeTruthy();
    expect(screen.getByText("Página 2 de 2")).toBeTruthy();
  });

  it("exibe imagem remota na lista", async () => {
    const withImage = {
      ...mockPalestrantes[0],
      imagemURL: "https://example.com/ana.jpg",
    };
    mockFetchPaged([withImage]);

    const { container } = render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");
    expect(
      container.querySelector('img[src="https://example.com/ana.jpg"]'),
    ).toBeTruthy();
  });

  it("oculta ações de escrita quando canWrite é false", async () => {
    setRoles(["Palestrante"]);
    mockFetchPaged(mockPalestrantes);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Ana Silva");

    expect(screen.getByText(/Acesso somente leitura/)).toBeTruthy();
    expect(
      screen.queryByRole("link", { name: "Novo palestrante" }),
    ).toBeNull();
    expect(screen.queryByRole("link", { name: "Editar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Excluir" })).toBeNull();
  });

  it("mostra entrar para criar quando não autenticado", async () => {
    clearToken();
    mockFetchPaged([]);

    render(
      <MemoryRouter>
        <PalestrantesPage />
      </MemoryRouter>,
    );

    await screen.findByText("Nenhum palestrante encontrado.");
    expect(
      screen.getByRole("link", { name: "Entrar para criar" }),
    ).toBeTruthy();
  });
});
