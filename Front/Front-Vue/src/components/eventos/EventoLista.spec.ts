import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import EventoLista from "./EventoLista.vue";
import eventoService from "../../services/eventoService";
import type { Evento } from "../../Models/Evento";

vi.mock("../../services/authToken", () => ({
  canWrite: vi.fn(() => true),
  isAuthenticated: vi.fn(() => true),
}));

vi.mock("../../services/eventoService", () => ({
  default: {
    list: vi.fn(),
    getByTema: vi.fn(),
    remove: vi.fn(),
  },
}));

import { canWrite, isAuthenticated } from "../../services/authToken";

const sampleEvento: Evento = {
  id: 1,
  tema: "Vue Conf",
  local: "SP",
  dataEvento: "01-01-2026",
  qtdPessoas: 100,
  telefone: "11999999999",
  email: "a@b.com",
  imagemURL: "",
  lotes: [{ id: 1, nome: "1º Lote", preco: 50, quantidade: 10, dataInicio: "", dataFim: "", eventoId: 1 }],
  redesSociais: [],
  palestrantesEventos: [],
};

function pageResult<T>(
  items: T[],
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
    (totalCount === 0 ? 0 : Math.max(1, Math.ceil(totalCount / pageSize)));
  return {
    items,
    page: opts.page ?? 1,
    pageSize,
    totalCount,
    totalPages,
  };
}

function mockList(
  items: Evento[],
  opts?: Parameters<typeof pageResult>[1],
) {
  (eventoService.list as any).mockResolvedValue({
    data: pageResult(items, opts),
  });
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
      { path: "/eventos/detalhes/:id?", name: "detalhe", component: { template: "<div />" } },
    ],
  });
}

const searchInput = 'input[placeholder="Digite para buscar"]';

describe("EventoLista", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (canWrite as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (isAuthenticated as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads and displays events on mount", async () => {
    mockList([sampleEvento]);
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    expect(eventoService.list).toHaveBeenCalled();
    expect(wrapper.text()).toContain("Vue Conf");
    expect(wrapper.text()).toContain("SP");
    expect(wrapper.text()).toContain("1º Lote");
  });

  it("shows dash when first lote is missing", async () => {
    (eventoService.list as any).mockResolvedValue({
      data: pageResult([{ ...sampleEvento, lotes: [] }]),
    });
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    expect(wrapper.text()).toContain("1º lote");
    const cells = wrapper.findAll("td");
    expect(cells.some((c) => c.text() === "—")).toBe(true);
  });

  it("shows empty state when no events", async () => {
    mockList([]);
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    expect(wrapper.text()).toContain("Nenhum evento encontrado");
  });

  it("searches by q on submit", async () => {
    (eventoService.list as any)
      .mockResolvedValueOnce({ data: pageResult([]) })
      .mockResolvedValueOnce({ data: pageResult([sampleEvento]) });
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    await wrapper.find(searchInput).setValue("Vue");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(eventoService.list).toHaveBeenCalledWith(
      expect.objectContaining({ q: "Vue" }),
    );
    expect(wrapper.text()).toContain("Vue Conf");
  });

  it("debounces typing before searching with q", async () => {
    vi.useFakeTimers();
    (eventoService.list as any)
      .mockResolvedValueOnce({ data: pageResult([]) })
      .mockResolvedValueOnce({ data: pageResult([sampleEvento]) });
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();
    expect(eventoService.list).toHaveBeenCalledTimes(1);

    await wrapper.find(searchInput).setValue("V");
    await wrapper.find(searchInput).setValue("Vu");
    await wrapper.find(searchInput).setValue("Vue");
    vi.advanceTimersByTime(349);
    await flushPromises();
    expect(eventoService.list).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await flushPromises();
    expect(eventoService.list).toHaveBeenCalledTimes(2);
    expect(eventoService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "Vue" }),
    );
  });

  it("submit cancels pending debounce and searches immediately", async () => {
    vi.useFakeTimers();
    (eventoService.list as any)
      .mockResolvedValueOnce({ data: pageResult([]) })
      .mockResolvedValueOnce({ data: pageResult([sampleEvento]) });
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    await wrapper.find(searchInput).setValue("Vue");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(eventoService.list).toHaveBeenCalledTimes(2);
    expect(eventoService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "Vue" }),
    );

    vi.advanceTimersByTime(350);
    await flushPromises();
    expect(eventoService.list).toHaveBeenCalledTimes(2);
  });

  it("clears search and reloads list immediately", async () => {
    vi.useFakeTimers();
    (eventoService.list as any)
      .mockResolvedValueOnce({ data: pageResult([]) })
      .mockResolvedValueOnce({ data: pageResult([sampleEvento]) })
      .mockResolvedValueOnce({ data: pageResult([]) });
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    await wrapper.find(searchInput).setValue("Vue");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    const limparBtn = wrapper.findAll("button").find((b) => b.text() === "Limpar");
    await limparBtn!.trigger("click");
    await flushPromises();

    expect(eventoService.list).toHaveBeenCalledTimes(3);
    expect(
      (eventoService.list as any).mock.calls.at(-1)[0].q,
    ).toBeUndefined();

    vi.advanceTimersByTime(350);
    await flushPromises();
    expect(eventoService.list).toHaveBeenCalledTimes(3);
  });

  it("shows error when load fails", async () => {
    vi.useFakeTimers();
    (eventoService.list as any).mockRejectedValue(new Error("fail"));
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();
    await vi.advanceTimersByTimeAsync(400);
    await flushPromises();

    expect(wrapper.text()).toContain("Erro ao carregar os eventos");
    vi.useRealTimers();
  });

  it("deletes event after confirmation", async () => {
    mockList([sampleEvento]);
    (eventoService.remove as any).mockResolvedValue({ status: 200 });
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    const excluirBtn = wrapper.findAll("button").find((b) => b.text() === "Excluir");
    await excluirBtn!.trigger("click");
    await flushPromises();

    const dialogExcluir = wrapper
      .find('[role="dialog"]')
      .findAll("button")
      .find((b) => b.text() === "Excluir");
    await dialogExcluir!.trigger("click");
    await flushPromises();

    expect(eventoService.remove).toHaveBeenCalledWith(1);
    expect(window.alert).toHaveBeenCalledWith("Evento deletado com sucesso");
    expect(wrapper.text()).toContain("Evento deletado com sucesso");
  });

  it("skips delete when user cancels confirm", async () => {
    mockList([sampleEvento]);
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    const excluirBtn = wrapper.findAll("button").find((b) => b.text() === "Excluir");
    await excluirBtn!.trigger("click");
    await flushPromises();

    const cancelBtn = wrapper
      .find('[role="dialog"]')
      .findAll("button")
      .find((b) => b.text() === "Cancelar");
    await cancelBtn!.trigger("click");
    await flushPromises();

    expect(eventoService.remove).not.toHaveBeenCalled();
  });

  it("navigates to new event form", async () => {
    mockList([]);
    const router = createTestRouter();
    const pushSpy = vi.spyOn(router, "push");
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    const novoBtn = wrapper.findAll("button").find((b) => b.text() === "Novo evento");
    await novoBtn!.trigger("click");

    expect(pushSpy).toHaveBeenCalledWith("/eventos/detalhes");
  });

  it("hides write actions when canWrite is false", async () => {
    (canWrite as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    (isAuthenticated as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    mockList([sampleEvento]);
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    expect(wrapper.find('[data-testid="readonly-message"]').exists()).toBe(true);
    expect(wrapper.findAll("button").some((b) => b.text() === "Novo evento")).toBe(false);
    expect(wrapper.findAll("button").some((b) => b.text() === "Excluir")).toBe(false);
    expect(wrapper.findAll("a").some((a) => a.text() === "Editar")).toBe(false);
  });

  it("paginates and toggles image column", async () => {
    const page1 = Array.from({ length: 10 }, (_, i) => ({
      ...sampleEvento,
      id: i + 1,
      tema: `Evento ${i + 1}`,
    }));
    (eventoService.list as any)
      .mockResolvedValueOnce({
        data: pageResult(page1, { totalCount: 11, totalPages: 2 }),
      })
      .mockResolvedValueOnce({
        data: pageResult([{ ...sampleEvento, id: 11, tema: "Evento 11" }], {
          page: 2,
          totalCount: 11,
          totalPages: 2,
        }),
      })
      .mockResolvedValueOnce({
        data: pageResult(page1, { totalCount: 11, totalPages: 2 }),
      });
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    expect(wrapper.text()).toContain("Página 1 de 2");

    const toggleBtn = wrapper.find('button[aria-label="Ocultar"]');
    await toggleBtn.trigger("click");
    expect(wrapper.find('button[aria-label="Mostrar"]').exists()).toBe(true);

    await wrapper.findAll("button").find((b) => b.text() === "Próxima")!.trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("Evento 11");

    await wrapper.find("select").setValue("20");
    await flushPromises();
    expect(eventoService.list).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 20 }),
    );
  });

  it("handles broken list images and empty lote label", async () => {
    mockList([
      {
        ...sampleEvento,
        imagemURL: "https://cdn.test/broken.jpg",
        lotes: [{ id: 1, nome: "  ", preco: 1, dataInicio: "", dataFim: "", quantidade: 1, eventoId: 1, evento: sampleEvento }],
      },
    ]);
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    const img = wrapper.find("img");
    if (img.exists()) await img.trigger("error");
    expect(wrapper.text()).toContain("—");
  });
});
