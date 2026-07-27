import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import EventoLista from "./EventoLista.vue";
import eventoService from "../../services/eventoService";
import type { Evento } from "../../Models/Evento";

vi.mock("../../services/eventoService", () => ({
  default: {
    list: vi.fn(),
    getByTema: vi.fn(),
    remove: vi.fn(),
  },
}));

const sampleEvento: Evento = {
  id: 1,
  tema: "Vue Conf",
  local: "SP",
  dataEvento: "01-01-2026",
  qtdPessoas: 100,
  telefone: "11999999999",
  email: "a@b.com",
  imagemURL: "",
  lotes: [],
  redesSociais: [],
  palestrantesEventos: [],
};

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
      { path: "/eventos/detalhes/:id?", name: "detalhe", component: { template: "<div />" } },
    ],
  });
}

describe("EventoLista", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  it("loads and displays events on mount", async () => {
    (eventoService.list as any).mockResolvedValue({ data: [sampleEvento] });
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    expect(eventoService.list).toHaveBeenCalled();
    expect(wrapper.text()).toContain("Vue Conf");
    expect(wrapper.text()).toContain("SP");
  });

  it("shows empty state when no events", async () => {
    (eventoService.list as any).mockResolvedValue({ data: [] });
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    expect(wrapper.text()).toContain("Nenhum evento encontrado");
  });

  it("searches by tema on submit", async () => {
    (eventoService.list as any).mockResolvedValue({ data: [] });
    (eventoService.getByTema as any).mockResolvedValue({ data: [sampleEvento] });
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    await wrapper.find('input[placeholder="Digite parte do tema"]').setValue("Vue");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(eventoService.getByTema).toHaveBeenCalledWith("Vue");
    expect(wrapper.text()).toContain("Vue Conf");
  });

  it("clears search and reloads list", async () => {
    (eventoService.list as any).mockResolvedValue({ data: [] });
    (eventoService.getByTema as any).mockResolvedValue({ data: [sampleEvento] });
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    await wrapper.find('input[placeholder="Digite parte do tema"]').setValue("Vue");
    await wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    const limparBtn = wrapper.findAll("button").find((b) => b.text() === "Limpar");
    await limparBtn!.trigger("click");
    await flushPromises();

    expect(eventoService.list).toHaveBeenCalledTimes(2);
  });

  it("shows error when load fails", async () => {
    (eventoService.list as any).mockRejectedValue(new Error("fail"));
    const router = createTestRouter();
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(EventoLista, { global: { plugins: [router] } });
    await flushPromises();

    expect(wrapper.text()).toContain("Erro ao carregar os eventos");
  });

  it("deletes event after confirmation", async () => {
    (eventoService.list as any).mockResolvedValue({ data: [sampleEvento] });
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
  });

  it("skips delete when user cancels confirm", async () => {
    (eventoService.list as any).mockResolvedValue({ data: [sampleEvento] });
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
    (eventoService.list as any).mockResolvedValue({ data: [] });
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
});
