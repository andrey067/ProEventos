import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import PalestrantesPage from "./PalestrantesPage.vue";
import palestranteService from "../../services/palestranteService";
import type { Palestrante } from "../../Models/Palestrante";

vi.mock("../../services/authToken", () => ({
  canWrite: vi.fn(() => true),
  isAuthenticated: vi.fn(() => true),
}));

vi.mock("../../services/palestranteService", () => ({
  default: {
    list: vi.fn(),
    remove: vi.fn(),
  },
}));

import { canWrite } from "../../services/authToken";

const sample: Palestrante = {
  id: 1,
  nome: "Maria",
  email: "maria@test.com",
  telefone: "11999999999",
  miniCurriculo: "Bio",
  imagemURL: "https://example.com/maria.jpg",
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
  items: Palestrante[],
  opts?: Parameters<typeof pageResult>[1],
) {
  (palestranteService.list as any).mockResolvedValue({
    data: pageResult(items, opts),
  });
}

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/palestrantes/lista",
        name: "palestrantes-lista",
        component: { template: "<div />" },
      },
      {
        path: "/palestrantes/detalhes/:id?",
        name: "palestrante-detalhe",
        component: { template: "<div />" },
      },
    ],
  });
}

const searchInput = 'input[placeholder="Digite para buscar"]';

async function mountPage() {
  const router = createTestRouter();
  await router.push("/palestrantes/lista");
  await router.isReady();
  return mount(PalestrantesPage, {
    global: { plugins: [router] },
  });
}

describe("PalestrantesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (canWrite as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads palestrantes on mount", async () => {
    mockList([sample]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(palestranteService.list).toHaveBeenCalled();
    expect(wrapper.text()).toContain("Maria");
  });

  it("shows empty state", async () => {
    mockList([]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Nenhum palestrante cadastrado");
  });

  it("shows load error", async () => {
    (palestranteService.list as any).mockRejectedValue(new Error("fail"));
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Não foi possível carregar palestrantes");
  });

  it("navigates to create form on Novo palestrante", async () => {
    mockList([]);
    const wrapper = await mountPage();
    await flushPromises();

    const router = wrapper.vm.$.appContext.config.globalProperties.$router;
    await wrapper.findAll("button").find((b) => b.text() === "Novo palestrante")!.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("palestrante-detalhe");
  });

  it("links Editar to form route", async () => {
    mockList([sample]);
    const wrapper = await mountPage();
    await flushPromises();

    const editLink = wrapper.find('a[href="/palestrantes/detalhes/1"]');
    expect(editLink.exists()).toBe(true);
    expect(editLink.text()).toBe("Editar");
  });

  it("filters by q on submit", async () => {
    mockList([sample]);
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.find(searchInput).setValue("Maria");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(palestranteService.list).toHaveBeenCalledWith(
      expect.objectContaining({ q: "Maria" }),
    );
  });

  it("debounces typing before searching with q", async () => {
    vi.useFakeTimers();
    mockList([sample]);
    const wrapper = await mountPage();
    await flushPromises();
    expect(palestranteService.list).toHaveBeenCalledTimes(1);

    await wrapper.find(searchInput).setValue("M");
    await wrapper.find(searchInput).setValue("Ma");
    await wrapper.find(searchInput).setValue("Maria");
    vi.advanceTimersByTime(349);
    await flushPromises();
    expect(palestranteService.list).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1);
    await flushPromises();
    expect(palestranteService.list).toHaveBeenCalledTimes(2);
    expect(palestranteService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "Maria" }),
    );
  });

  it("submit cancels pending debounce and searches immediately", async () => {
    vi.useFakeTimers();
    mockList([sample]);
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.find(searchInput).setValue("Maria");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(palestranteService.list).toHaveBeenCalledTimes(2);
    expect(palestranteService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "Maria" }),
    );

    vi.advanceTimersByTime(350);
    await flushPromises();
    expect(palestranteService.list).toHaveBeenCalledTimes(2);
  });

  it("clears search and reloads immediately", async () => {
    vi.useFakeTimers();
    mockList([sample]);
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.find(searchInput).setValue("Maria");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    await wrapper.findAll("button").find((b) => b.text() === "Limpar")!.trigger("click");
    await flushPromises();

    expect(palestranteService.list).toHaveBeenCalledTimes(3);
    expect(
      (palestranteService.list as any).mock.calls.at(-1)[0].q,
    ).toBeUndefined();

    vi.advanceTimersByTime(350);
    await flushPromises();
    expect(palestranteService.list).toHaveBeenCalledTimes(3);
  });

  it("removes palestrante after confirm", async () => {
    mockList([sample]);
    (palestranteService.remove as any).mockResolvedValue({ status: 200 });
    const wrapper = await mountPage();
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

    expect(palestranteService.remove).toHaveBeenCalledWith(1);
  });

  it("skips remove when confirm cancelled", async () => {
    mockList([sample]);
    const wrapper = await mountPage();
    await flushPromises();

    await wrapper.findAll("button").find((b) => b.text() === "Excluir")!.trigger("click");
    await flushPromises();

    const cancelBtn = wrapper
      .find('[role="dialog"]')
      .findAll("button")
      .find((b) => b.text() === "Cancelar");
    await cancelBtn!.trigger("click");
    await flushPromises();

    expect(palestranteService.remove).not.toHaveBeenCalled();
  });

  it("hides write actions when canWrite is false", async () => {
    (canWrite as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    mockList([sample]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.find('[data-testid="readonly-message"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Novo palestrante");
    expect(wrapper.findAll("button").some((b) => b.text() === "Excluir")).toBe(false);
    expect(wrapper.findAll("a").some((a) => a.text() === "Editar")).toBe(false);
  });

  it("shows list thumbnail for remote imagemURL", async () => {
    mockList([sample]);
    const wrapper = await mountPage();
    await flushPromises();

    const img = wrapper.find('img[src="https://example.com/maria.jpg"]');
    expect(img.exists()).toBe(true);
  });

  it("paginates list when many items exist", async () => {
    const page1 = Array.from({ length: 10 }, (_, i) => ({
      ...sample,
      id: i + 1,
      nome: `Speaker ${i + 1}`,
    }));
    const page2Item = { ...sample, id: 11, nome: "Speaker 11" };
    (palestranteService.list as any)
      .mockResolvedValueOnce({
        data: pageResult(page1, { totalCount: 11, totalPages: 2 }),
      })
      .mockResolvedValueOnce({
        data: pageResult([page2Item], { page: 2, totalCount: 11, totalPages: 2 }),
      });
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).toContain("Página 1 de 2");
    expect(wrapper.text()).toContain("Speaker 1");
    expect(wrapper.text()).not.toContain("Speaker 11");

    await wrapper.findAll("button").find((b) => b.text() === "Próxima")!.trigger("click");
    await flushPromises();

    expect(palestranteService.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 }),
    );
    expect(wrapper.text()).toContain("Página 2 de 2");
    expect(wrapper.text()).toContain("Speaker 11");
  });

  it("does not render inline form fields", async () => {
    mockList([]);
    const wrapper = await mountPage();
    await flushPromises();

    expect(wrapper.text()).not.toContain("Mini currículo");
    expect(wrapper.find('[data-testid="speaker-redes-section"]').exists()).toBe(false);
  });
});
