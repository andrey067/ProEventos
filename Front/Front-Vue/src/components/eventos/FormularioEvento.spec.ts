import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import FormularioEvento from "./FormularioEvento.vue";
import eventoService from "../../services/eventoService";
import loteService from "../../services/loteService";
import type { Evento } from "../../Models/Evento";

vi.mock("../../services/eventoService", () => ({
  default: {
    create: vi.fn(),
    update: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock("../../services/loteService", () => ({
  default: {
    save: vi.fn(),
  },
}));

vi.mock("../../services/redeSocialService", () => ({
  default: {
    saveByEvento: vi.fn(),
  },
}));

const baseEvento: Evento = {
  id: 0,
  tema: "Novo Tema",
  local: "Local X",
  dataEvento: "01-01-2026",
  qtdPessoas: 50,
  telefone: "11999999999",
  email: "test@example.com",
  imagemURL: "",
  lotes: [],
  redesSociais: [],
  palestrantesEventos: [],
};

type FormularioEventoVm = {
  submitForm: () => Promise<void>;
  tema: string;
  local: string;
  dataEvento: string;
  telefone: string;
  email: string;
  addLote: () => void;
};

async function mountWithRoute(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
      { path: "/eventos/detalhes/:id?", name: "detalhe", component: FormularioEvento },
    ],
  });
  await router.push(path);
  await router.isReady();
  const wrapper = mount(FormularioEvento, { global: { plugins: [router] } });
  return { wrapper, router };
}

function fillRequiredEventoFields(vm: FormularioEventoVm) {
  vm.tema = "Tema Válido";
  vm.local = "Local ABC";
  vm.dataEvento = "01-01-2026";
  vm.telefone = "11999999999";
  vm.email = "test@example.com";
}

describe("FormularioEvento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders new event form", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();
    expect(wrapper.text()).toContain("Novo evento");
  });

  it("loads existing event by id", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: { ...baseEvento, id: 5, tema: "Carregado" },
    });
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    expect(eventoService.getById).toHaveBeenCalledWith(5);
    expect(wrapper.text()).toContain("Editar evento");
    const vm = wrapper.vm as unknown as FormularioEventoVm;
    expect(vm.tema).toBe("Carregado");
  });

  it("shows load error for existing event", async () => {
    (eventoService.getById as any).mockRejectedValue(new Error("fail"));
    const { wrapper } = await mountWithRoute("/eventos/detalhes/99");
    await flushPromises();

    expect(wrapper.text()).toContain("Erro ao carregar o evento: 99");
  });

  it("validates tema before submit", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.submitForm();
    await flushPromises();

    expect(wrapper.text()).toContain("Tema deve ter ao menos 3 caracteres");
    expect(eventoService.create).not.toHaveBeenCalled();
  });

  it("creates new event and saves lotes", async () => {
    (eventoService.create as any).mockResolvedValue({ data: { ...baseEvento, id: 10 } });
    (loteService.save as any).mockResolvedValue({ data: [] });
    const { wrapper, router } = await mountWithRoute("/eventos/detalhes");
    const pushSpy = vi.spyOn(router, "push");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    fillRequiredEventoFields(vm);
    vm.addLote();
    await vm.submitForm();
    await flushPromises();

    expect(eventoService.create).toHaveBeenCalled();
    expect(loteService.save).toHaveBeenCalledWith(10, expect.any(Array));
    expect(pushSpy).toHaveBeenCalledWith({ name: "lista" });
  });

  it("updates existing event", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: { ...baseEvento, id: 7, tema: "Existente" },
    });
    (eventoService.update as any).mockResolvedValue({ data: { ...baseEvento, id: 7 } });
    const { wrapper, router } = await mountWithRoute("/eventos/detalhes/7");
    const pushSpy = vi.spyOn(router, "push");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.submitForm();
    await flushPromises();

    expect(eventoService.update).toHaveBeenCalledWith(7, expect.objectContaining({ tema: "Existente" }));
    expect(pushSpy).toHaveBeenCalledWith({ name: "lista" });
  });

  it("shows error when save fails", async () => {
    (eventoService.create as any).mockRejectedValue(new Error("fail"));
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    fillRequiredEventoFields(vm);
    await vm.submitForm();
    await flushPromises();

    expect(wrapper.text()).toContain("Falha ao salvar evento");
  });

  it("navigates back to lista", async () => {
    const { wrapper, router } = await mountWithRoute("/eventos/detalhes");
    const pushSpy = vi.spyOn(router, "push");

    const voltarBtn = wrapper.findAll("button").find((b) => b.text() === "Voltar");
    await voltarBtn!.trigger("click");

    expect(pushSpy).toHaveBeenCalledWith({ name: "lista" });
  });

  it("shows preview card with placeholder and opens URL editor on click", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const card = wrapper.find('[data-testid="evento-preview-card"]');
    expect(card.exists()).toBe(true);
    expect(card.text()).toContain("Clique para informar URL da imagem");
    expect(card.find("img").exists()).toBe(false);

    await card.find("button").trigger("click");
    await flushPromises();

    const urlInput = card.find('input[type="url"]');
    expect(urlInput.exists()).toBe(true);

    await urlInput.setValue("/local/path.jpg");
    await urlInput.trigger("blur");
    await flushPromises();

    expect(card.text()).toContain("Use um link http:// ou https://");
    expect((wrapper.vm as any).imagemURL).toBe("");

    await urlInput.setValue("https://example.com/event.jpg");
    await urlInput.trigger("keydown.enter");
    await flushPromises();

    expect((wrapper.vm as any).imagemURL).toBe("https://example.com/event.jpg");
  });

  it("renders remote image in preview card when imagemURL is https", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: {
        ...baseEvento,
        id: 5,
        imagemURL: "https://example.com/photo.jpg",
        local: "Arena",
        telefone: "11988887777",
        email: "a@b.com",
      },
    });
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const card = wrapper.find('[data-testid="evento-preview-card"]');
    const img = card.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe("https://example.com/photo.jpg");
    expect(card.text()).toContain("Arena");
    expect(card.text()).toContain("11988887777");
    expect(card.text()).toContain("a@b.com");
  });
});
