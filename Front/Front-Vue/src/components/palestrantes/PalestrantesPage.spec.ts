import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import PalestrantesPage from "./PalestrantesPage.vue";
import palestranteService from "../../services/palestranteService";
import type { Palestrante } from "../../Models/Palestrante";

vi.mock("../../services/palestranteService", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

const sample: Palestrante = {
  id: 1,
  nome: "Maria",
  email: "maria@test.com",
  telefone: "11999999999",
  miniCurriculo: "Bio",
  imagemURL: "",
  redesSociais: [],
  palestrantesEventos: [],
};

type PalestrantesPageVm = {
  save: () => Promise<void>;
  nome: string;
  edit: (row: Palestrante) => void;
  resetFormValues: () => void;
};

describe("PalestrantesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads palestrantes on mount", async () => {
    (palestranteService.list as any).mockResolvedValue({ data: [sample] });
    const wrapper = mount(PalestrantesPage);
    await flushPromises();

    expect(palestranteService.list).toHaveBeenCalled();
    expect(wrapper.text()).toContain("Maria");
  });

  it("shows empty state", async () => {
    (palestranteService.list as any).mockResolvedValue({ data: [] });
    const wrapper = mount(PalestrantesPage);
    await flushPromises();

    expect(wrapper.text()).toContain("Nenhum palestrante cadastrado");
  });

  it("shows load error", async () => {
    (palestranteService.list as any).mockRejectedValue(new Error("fail"));
    const wrapper = mount(PalestrantesPage);
    await flushPromises();

    expect(wrapper.text()).toContain("Não foi possível carregar palestrantes");
  });

  it("creates palestrante on save", async () => {
    (palestranteService.list as any).mockResolvedValue({ data: [] });
    (palestranteService.create as any).mockResolvedValue({ data: sample });
    const wrapper = mount(PalestrantesPage);
    await flushPromises();

    const vm = wrapper.vm as unknown as PalestrantesPageVm;
    vm.nome = "João";
    await vm.save();
    await flushPromises();

    expect(palestranteService.create).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "João" }),
    );
  });

  it("requires nome before save", async () => {
    (palestranteService.list as any).mockResolvedValue({ data: [] });
    const wrapper = mount(PalestrantesPage);
    await flushPromises();

    const vm = wrapper.vm as unknown as PalestrantesPageVm;
    vm.nome = "";
    await vm.save();
    await flushPromises();

    expect(palestranteService.create).not.toHaveBeenCalled();
  });

  it("validates empty nome via save handler", async () => {
    (palestranteService.list as any).mockResolvedValue({ data: [] });
    const wrapper = mount(PalestrantesPage);
    await flushPromises();

    const vm = wrapper.vm as unknown as PalestrantesPageVm;
    vm.nome = "";
    await vm.save();
    await flushPromises();

    expect(wrapper.text()).toContain("Nome é obrigatório");
  });

  it("updates palestrante when editing", async () => {
    (palestranteService.list as any).mockResolvedValue({ data: [sample] });
    (palestranteService.update as any).mockResolvedValue({ data: sample });
    const wrapper = mount(PalestrantesPage);
    await flushPromises();

    const vm = wrapper.vm as unknown as PalestrantesPageVm;
    vm.edit(sample);
    vm.nome = "Maria Atualizada";
    await vm.save();
    await flushPromises();

    expect(palestranteService.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ nome: "Maria Atualizada" }),
    );
  });

  it("resets form when canceling edit", async () => {
    (palestranteService.list as any).mockResolvedValue({ data: [sample] });
    const wrapper = mount(PalestrantesPage);
    await flushPromises();

    const vm = wrapper.vm as unknown as PalestrantesPageVm;
    vm.edit(sample);
    vm.resetFormValues();

    expect(wrapper.text()).toContain("Novo palestrante");
  });

  it("removes palestrante after confirm", async () => {
    (palestranteService.list as any).mockResolvedValue({ data: [sample] });
    (palestranteService.remove as any).mockResolvedValue({ status: 200 });
    const wrapper = mount(PalestrantesPage);
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
    (palestranteService.list as any).mockResolvedValue({ data: [sample] });
    const wrapper = mount(PalestrantesPage);
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

  it("shows save error", async () => {
    (palestranteService.list as any).mockResolvedValue({ data: [] });
    (palestranteService.create as any).mockRejectedValue(new Error("fail"));
    const wrapper = mount(PalestrantesPage);
    await flushPromises();

    const vm = wrapper.vm as unknown as PalestrantesPageVm;
    vm.nome = "Teste";
    await vm.save();
    await flushPromises();

    expect(wrapper.text()).toContain("Erro ao salvar palestrante");
  });
});
