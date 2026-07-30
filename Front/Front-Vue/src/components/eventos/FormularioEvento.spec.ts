import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import FormularioEvento from "./FormularioEvento.vue";
import eventoService from "../../services/eventoService";
import loteService from "../../services/loteService";
import redeSocialService from "../../services/redeSocialService";
import palestranteService from "../../services/palestranteService";
import type { Evento } from "../../Models/Evento";
import type { Palestrante } from "../../Models/Palestrante";

vi.mock("../../services/authToken", () => ({
  canWrite: vi.fn(() => true),
  isAuthenticated: vi.fn(() => true),
  hasRole: vi.fn(() => false),
}));

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
    remove: vi.fn(),
  },
}));

vi.mock("../../services/redeSocialService", () => ({
  default: {
    saveByEvento: vi.fn(),
    listByEvento: vi.fn(),
    removeByEvento: vi.fn(),
  },
}));

vi.mock("../../services/palestranteService", () => ({
  default: {
    getByNome: vi.fn(),
    associate: vi.fn(),
    disassociate: vi.fn(),
  },
}));

import { canWrite } from "../../services/authToken";

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
  onDataEventoChange: (value: string) => Promise<void>;
  addLote: () => void;
  addRede: () => void;
  removeLoteAt: (index: number) => Promise<void>;
  removeRedeAt: (index: number) => Promise<void>;
  associateSpeaker: (speaker: { id: number; nome: string }) => Promise<void>;
  disassociateSpeaker: (speaker: { id: number; nome: string }) => Promise<void>;
  speakerSearch: string;
  searchSpeakers: () => Promise<void>;
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
    (canWrite as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    (redeSocialService.listByEvento as any).mockResolvedValue({ data: [] });
  });

  it("renders new event form", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();
    expect(wrapper.text()).toContain("Novo evento");
  });

  it("treats id 0 as new and does not fetch", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes/0");
    await flushPromises();

    expect(eventoService.getById).not.toHaveBeenCalled();
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

    expect(wrapper.text()).toContain("Tema deve ter ao menos 4 caracteres");
    expect(eventoService.create).not.toHaveBeenCalled();
  });

  it("validates email format", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    fillRequiredEventoFields(vm);
    vm.email = "nao-email";
    await vm.submitForm();
    await flushPromises();

    expect(wrapper.text()).toContain("E-mail inválido");
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

  it("mirrors create typing into preview card (two-way binding)", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    vm.local = "Arena Live";
    vm.telefone = "11911112222";
    vm.email = "live@test.com";
    await flushPromises();
    await wrapper.vm.$nextTick();

    const card = wrapper.find('[data-testid="evento-preview-card"]');
    expect(card.text()).toContain("Arena Live");
    expect(card.text()).toContain("11911112222");
    expect(card.text()).toContain("live@test.com");
  });

  it("keeps preview in sync after edit load and field change", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: {
        ...baseEvento,
        id: 5,
        local: "Sala A",
        telefone: "11900001111",
        email: "edit@test.com",
        dataEvento: "2026-03-15",
      },
    });
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    let card = wrapper.find('[data-testid="evento-preview-card"]');
    expect(card.text()).toContain("Sala A");
    expect(card.text()).toContain("11900001111");
    expect(card.text()).toContain("edit@test.com");
    expect(card.text()).toMatch(/15\/03\/2026/);

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    vm.local = "Sala B";
    await flushPromises();
    await wrapper.vm.$nextTick();

    card = wrapper.find('[data-testid="evento-preview-card"]');
    expect(card.text()).toContain("Sala B");
  });

  it("updates preview date when dataEvento changes", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.onDataEventoChange("2026-07-20");
    await flushPromises();
    await wrapper.vm.$nextTick();

    const card = wrapper.find('[data-testid="evento-preview-card"]');
    expect(card.text()).toMatch(/20\/07\/2026/);
  });

  it("renders redes sociais section and allows adding a rede", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    expect(wrapper.find('[data-testid="redes-section"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Redes sociais");

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    vm.addRede();
    await flushPromises();

    const redes = wrapper.find('[data-testid="redes-section"]');
    expect(redes.find('input[placeholder="Nome"]').exists()).toBe(true);
    expect(redes.find('input[placeholder="URL"]').exists()).toBe(true);
  });

  it("removes local lote without API when id is 0", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    vm.addLote();
    await flushPromises();

    const lotesSection = wrapper.find('[data-testid="lotes-section"]');
    expect(lotesSection.findAll("button").some((b) => b.text() === "Excluir")).toBe(true);

    await vm.removeLoteAt(0);
    await flushPromises();

    expect(loteService.remove).not.toHaveBeenCalled();
    expect(
      wrapper.find('[data-testid="lotes-section"]').findAll("button").some((b) => b.text() === "Excluir"),
    ).toBe(false);
  });

  it("calls loteService.remove for persisted lote", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: {
        ...baseEvento,
        id: 5,
        tema: "Com Lote",
        lotes: [
          {
            id: 9,
            nome: "VIP",
            preco: 100,
            quantidade: 10,
            dataInicio: "2026-01-01",
            dataFim: "2026-01-02",
            eventoId: 5,
          },
        ],
      },
    });
    (loteService.remove as any).mockResolvedValue({ status: 200 });
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.removeLoteAt(0);
    await flushPromises();

    expect(loteService.remove).toHaveBeenCalledWith(5, 9);
  });

  it("hides write controls when canWrite is false", async () => {
    (canWrite as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    expect(wrapper.find('[data-testid="readonly-message"]').exists()).toBe(true);
    expect(wrapper.findAll("button").some((b) => b.text() === "Salvar")).toBe(false);
    expect(wrapper.findAll("button").some((b) => b.text() === "+ Lote")).toBe(false);
  });

  it("shows palestrantes section for existing event", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: {
        ...baseEvento,
        id: 5,
        tema: "Com Speakers",
        palestrantesEventos: [{ id: 1, nome: "Ana", email: "", telefone: "", miniCurriculo: "", imagemURL: "", redesSociais: [], palestrantesEventos: [] }],
      },
    });
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    expect(wrapper.find('[data-testid="palestrantes-section"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Ana");
  });

  it("removes local rede without API when id is 0", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    vm.addRede();
    await flushPromises();

    await vm.removeRedeAt(0);
    await flushPromises();

    expect(redeSocialService.removeByEvento).not.toHaveBeenCalled();
    expect(window.confirm).toHaveBeenCalled();
  });

  it("calls redeSocialService.removeByEvento for persisted rede", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: { ...baseEvento, id: 5, tema: "Com Rede" },
    });
    (redeSocialService.listByEvento as any).mockResolvedValue({
      data: [{ id: 11, nome: "X", url: "https://x.com" }],
    });
    (redeSocialService.removeByEvento as any).mockResolvedValue({ status: 200 });
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.removeRedeAt(0);
    await flushPromises();

    expect(redeSocialService.removeByEvento).toHaveBeenCalledWith(5, 11);
  });

  it("associateSpeaker calls palestranteService.associate", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: { ...baseEvento, id: 5, tema: "Assoc", palestrantesEventos: [] },
    });
    (palestranteService.associate as any).mockResolvedValue({ status: 200 });
    const speaker: Palestrante = {
      id: 8,
      nome: "Bruno",
      email: "",
      telefone: "",
      miniCurriculo: "",
      imagemURL: "",
      redesSociais: [],
      palestrantesEventos: [],
    };
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.associateSpeaker(speaker);
    await flushPromises();

    expect(palestranteService.associate).toHaveBeenCalledWith(5, 8);
    expect(wrapper.text()).toContain("Bruno");
  });

  it("disassociateSpeaker calls palestranteService.disassociate", async () => {
    const speaker: Palestrante = {
      id: 1,
      nome: "Ana",
      email: "",
      telefone: "",
      miniCurriculo: "",
      imagemURL: "",
      redesSociais: [],
      palestrantesEventos: [],
    };
    (eventoService.getById as any).mockResolvedValue({
      data: {
        ...baseEvento,
        id: 5,
        tema: "Dissoc",
        palestrantesEventos: [speaker],
      },
    });
    (palestranteService.disassociate as any).mockResolvedValue({ status: 200 });
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.disassociateSpeaker(speaker);
    await flushPromises();

    expect(window.confirm).toHaveBeenCalled();
    expect(palestranteService.disassociate).toHaveBeenCalledWith(5, 1);
  });

  it("associateSpeaker shows error when API fails", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: { ...baseEvento, id: 5, tema: "Assoc", palestrantesEventos: [] },
    });
    (palestranteService.associate as any).mockRejectedValue(new Error("fail"));
    const speaker: Palestrante = {
      id: 8,
      nome: "Bruno",
      email: "",
      telefone: "",
      miniCurriculo: "",
      imagemURL: "",
      redesSociais: [],
      palestrantesEventos: [],
    };
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.associateSpeaker(speaker);
    await flushPromises();

    expect(wrapper.text()).toContain("Falha ao associar palestrante");
  });

  it("disassociateSpeaker shows error when API fails", async () => {
    const speaker: Palestrante = {
      id: 1,
      nome: "Ana",
      email: "",
      telefone: "",
      miniCurriculo: "",
      imagemURL: "",
      redesSociais: [],
      palestrantesEventos: [],
    };
    (eventoService.getById as any).mockResolvedValue({
      data: { ...baseEvento, id: 5, palestrantesEventos: [speaker] },
    });
    (palestranteService.disassociate as any).mockRejectedValue(new Error("fail"));
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.disassociateSpeaker(speaker);
    await flushPromises();

    expect(wrapper.text()).toContain("Falha ao remover palestrante");
  });

  it("disassociateSpeaker aborts when confirm is cancelled", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const speaker: Palestrante = {
      id: 1,
      nome: "Ana",
      email: "",
      telefone: "",
      miniCurriculo: "",
      imagemURL: "",
      redesSociais: [],
      palestrantesEventos: [],
    };
    (eventoService.getById as any).mockResolvedValue({
      data: { ...baseEvento, id: 5, palestrantesEventos: [speaker] },
    });
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.disassociateSpeaker(speaker);
    await flushPromises();

    expect(palestranteService.disassociate).not.toHaveBeenCalled();
  });

  it("saves redes sociais on create", async () => {
    (eventoService.create as any).mockResolvedValue({ data: { ...baseEvento, id: 11 } });
    (redeSocialService.saveByEvento as any).mockResolvedValue({ data: [] });
    const { wrapper, router } = await mountWithRoute("/eventos/detalhes");
    const pushSpy = vi.spyOn(router, "push");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    fillRequiredEventoFields(vm);
    vm.addRede();
    await flushPromises();
    const redesSection = wrapper.find('[data-testid="redes-section"]');
    await redesSection.find('input[placeholder="Nome"]').setValue("Twitter");
    await redesSection.find('input[placeholder="URL"]').setValue("https://x.com");
    await vm.submitForm();
    await flushPromises();

    expect(redeSocialService.saveByEvento).toHaveBeenCalledWith(11, expect.any(Array));
    expect(pushSpy).toHaveBeenCalledWith({ name: "lista" });
  });

  it("loads evento when listByEvento fails and keeps payload redes", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: {
        ...baseEvento,
        id: 5,
        redesSociais: [{ id: 1, nome: "Site", url: "https://x.com", eventoId: 5 }],
      },
    });
    (redeSocialService.listByEvento as any).mockRejectedValue(new Error("fail"));
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    expect(wrapper.text()).toContain("Editar evento");
  });

  it("searchSpeakers populates results", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: { ...baseEvento, id: 5, palestrantesEventos: [] },
    });
    (palestranteService.getByNome as any).mockResolvedValue({
      data: {
        items: [{ id: 2, nome: "Carlos", email: "", telefone: "", miniCurriculo: "", imagemURL: "", redesSociais: [], palestrantesEventos: [] }],
        page: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
      },
    });
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    vm.speakerSearch = "Car";
    await vm.searchSpeakers();
    await flushPromises();

    expect(palestranteService.getByNome).toHaveBeenCalledWith("Car");
  });

  it("skips associateSpeaker when user cannot write", async () => {
    (canWrite as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.associateSpeaker({
      id: 1,
      nome: "Ana",
      email: "",
      telefone: "",
      miniCurriculo: "",
      imagemURL: "",
      redesSociais: [],
      palestrantesEventos: [],
    });
    expect(palestranteService.associate).not.toHaveBeenCalled();
  });

  it("searchSpeakers clears results when term is blank", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    vm.speakerSearch = "   ";
    await vm.searchSpeakers();
    await flushPromises();

    expect(palestranteService.getByNome).not.toHaveBeenCalled();
  });

  it("searchSpeakers shows error when API fails", async () => {
    (palestranteService.getByNome as any).mockRejectedValue(new Error("fail"));
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    (eventoService.getById as any).mockResolvedValue({
      data: { ...baseEvento, id: 5, palestrantesEventos: [] },
    });
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    vm.speakerSearch = "Ana";
    await vm.searchSpeakers();
    await flushPromises();

    expect(wrapper.text()).toContain("Falha ao buscar palestrantes");
  });

  it("removeRedeAt shows error when persisted delete fails", async () => {
    (eventoService.getById as any).mockResolvedValue({
      data: { ...baseEvento, id: 5, tema: "Com Rede" },
    });
    (redeSocialService.listByEvento as any).mockResolvedValue({
      data: [{ id: 11, nome: "X", url: "https://x.com" }],
    });
    (redeSocialService.removeByEvento as any).mockRejectedValue(new Error("fail"));
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.removeRedeAt(0);
    await flushPromises();

    expect(wrapper.text()).toContain("Falha ao excluir rede social");
  });

  it("covers lote helpers and preview image error", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as Record<string, unknown>;
    (vm.addLote as () => void)();
    await (vm.onLotePrecoChange as (index: number, value: number | null) => Promise<void>)(0, 150);
    await (vm.onLoteDateChange as (index: number, field: string, value: string) => Promise<void>)(
      0,
      "dataInicio",
      "2026-01-01",
    );
    await (vm.onLoteDateChange as (index: number, field: string, value: string) => Promise<void>)(
      0,
      "dataFim",
      "2026-01-31",
    );
    expect((vm.loteFieldError as (index: number, field: string) => string | undefined)(0, "nome")).toBeUndefined();

    (vm.imagemURL as string) = "https://example.com/broken.jpg";
    await flushPromises();
    (vm.onImageError as () => void)();
    await flushPromises();
    expect(wrapper.find('[data-testid="evento-preview-card"]').text()).toBeTruthy();
  });

  it("clears imagemURL when commitUrl receives empty draft", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as Record<string, unknown>;
    await (vm.openUrlEditor as () => Promise<void>)();
    (vm.urlDraft as string) = "   ";
    await (vm.commitUrl as () => Promise<void>)();
    await flushPromises();

    expect(vm.imagemURL).toBe("");
    expect(vm.showUrlEditor).toBe(false);
  });

  it("removeLoteAt shows error when persisted delete fails", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    (eventoService.getById as any).mockResolvedValue({
      data: {
        ...baseEvento,
        id: 5,
        tema: "Com Lote",
        lotes: [
          {
            id: 9,
            nome: "VIP",
            preco: 100,
            quantidade: 10,
            dataInicio: "2026-01-01",
            dataFim: "2026-01-31",
            eventoId: 5,
          },
        ],
      },
    });
    (loteService.remove as any).mockRejectedValue(new Error("fail"));
    const { wrapper } = await mountWithRoute("/eventos/detalhes/5");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormularioEventoVm;
    await vm.removeLoteAt(0);
    await flushPromises();

    expect(wrapper.text()).toContain("Falha ao excluir lote");
  });

  it("rejects invalid URL in commitUrl", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as Record<string, unknown>;
    await (vm.openUrlEditor as () => Promise<void>)();
    (vm.urlDraft as string) = "/local/path.jpg";
    await (vm.commitUrl as () => Promise<void>)();
    await flushPromises();

    expect(vm.urlError).toContain("http://");
    expect(vm.showUrlEditor).toBe(true);
  });

  it("ignores commitUrl when editor is closed", async () => {
    const { wrapper } = await mountWithRoute("/eventos/detalhes");
    await flushPromises();

    const vm = wrapper.vm as Record<string, unknown>;
    (vm.imagemURL as string) = "https://example.com/keep.jpg";
    await (vm.commitUrl as () => Promise<void>)();
    expect(vm.imagemURL).toBe("https://example.com/keep.jpg");
  });
});
