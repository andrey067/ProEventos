import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Evento } from "@/models";
import { EventosPage } from "@/components/eventos/EventosPage";
import { setToken } from "@/services/authToken";

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

describe("EventosPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("alert", vi.fn());
  });

  it("carrega e exibe eventos", async () => {
    mockFetchJson(mockEventos);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Workshop React")).toBeTruthy();
    expect(screen.getByText("São Paulo")).toBeTruthy();
    expect(screen.getByText("100")).toBeTruthy();
  });

  it("exibe mensagem quando não há eventos", async () => {
    mockFetchJson([]);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Nenhum evento encontrado."),
    ).toBeTruthy();
  });

  it("busca eventos por tema", async () => {
    mockFetchJson(mockEventos);
    mockFetchJson([mockEventos[0]]);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");

    fireEvent.change(screen.getByPlaceholderText("Digite parte do tema"), {
      target: { value: "react" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:5050/eventos/tema/react",
        expect.any(Object),
      );
    });
  });

  it("limpa busca e recarrega todos", async () => {
    mockFetchJson(mockEventos);
    mockFetchJson(mockEventos);

    render(
      <MemoryRouter>
        <EventosPage />
      </MemoryRouter>,
    );

    await screen.findByText("Workshop React");

    fireEvent.change(screen.getByPlaceholderText("Digite parte do tema"), {
      target: { value: "vue" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Digite parte do tema"),
      ).toHaveProperty("value", "");
    });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:5050/eventos",
      expect.any(Object),
    );
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
    mockFetchJson(mockEventos);
    mockFetchJson({ message: "Deletado" });
    mockFetchJson([]);

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
      await screen.findByText("Nenhum evento encontrado."),
    ).toBeTruthy();
  });

  it("não deleta quando confirmação é cancelada", async () => {
    setToken("test-token");
    mockFetchJson(mockEventos);

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
    mockFetchJson(mockEventos);
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
});
