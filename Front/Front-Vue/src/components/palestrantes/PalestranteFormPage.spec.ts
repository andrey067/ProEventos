import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import PalestranteFormPage from "./PalestranteFormPage.vue";
import palestranteService from "../../services/palestranteService";
import redeSocialService from "../../services/redeSocialService";
import type { Palestrante } from "../../Models/Palestrante";

vi.mock("../../services/authToken", () => ({
  canWrite: vi.fn(() => true),
  isAuthenticated: vi.fn(() => true),
}));

vi.mock("../../services/palestranteService", () => ({
  default: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../../services/redeSocialService", () => ({
  default: {
    listByPalestrante: vi.fn(),
    saveByPalestrante: vi.fn(),
    removeByPalestrante: vi.fn(),
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

type FormVm = {
  save: () => Promise<void>;
  nome: string;
  imagemURL: string;
  addRede: () => void;
  removeRedeAt: (index: number) => Promise<void>;
  redes: { id: number; nome: string; url: string }[];
};

function createTestRouter(initialPath: string) {
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
        component: PalestranteFormPage,
      },
    ],
  });
}

async function mountForm(path: string) {
  const router = createTestRouter(path);
  await router.push(path);
  await router.isReady();
  const wrapper = mount(PalestranteFormPage, {
    global: { plugins: [router] },
  });
  return { wrapper, router };
}

describe("PalestranteFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (canWrite as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);
    (redeSocialService.listByPalestrante as any).mockResolvedValue({ data: [] });
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("shows create form without id", async () => {
    const { wrapper } = await mountForm("/palestrantes/detalhes");
    await flushPromises();

    expect(wrapper.text()).toContain("Novo palestrante");
    expect(wrapper.text()).toContain("Mini currículo");
    expect(wrapper.text()).toContain("URL da imagem");
    expect(palestranteService.getById).not.toHaveBeenCalled();
  });

  it("loads palestrante and redes on edit", async () => {
    (palestranteService.getById as any).mockResolvedValue({ data: sample });
    (redeSocialService.listByPalestrante as any).mockResolvedValue({
      data: [{ id: 3, nome: "LinkedIn", url: "https://linkedin.com/in/maria" }],
    });
    const { wrapper } = await mountForm("/palestrantes/detalhes/1");
    await flushPromises();

    expect(palestranteService.getById).toHaveBeenCalledWith(1);
    expect(redeSocialService.listByPalestrante).toHaveBeenCalledWith(1);
    expect(wrapper.text()).toContain("Editar palestrante");
    expect(wrapper.find('[data-testid="speaker-redes-section"]').exists()).toBe(true);
    expect(wrapper.find('input[placeholder="Nome"]').element.value).toBe("LinkedIn");
  });

  it("creates palestrante on save and navigates to list", async () => {
    (palestranteService.create as any).mockResolvedValue({ data: sample });
    const { wrapper, router } = await mountForm("/palestrantes/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormVm;
    vm.nome = "João";
    await vm.save();
    await flushPromises();

    expect(palestranteService.create).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "João" }),
    );
    expect(router.currentRoute.value.name).toBe("palestrantes-lista");
  });

  it("requires nome before save", async () => {
    const { wrapper } = await mountForm("/palestrantes/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormVm;
    vm.nome = "";
    await vm.save();
    await flushPromises();

    expect(palestranteService.create).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Nome é obrigatório");
  });

  it("updates palestrante when editing", async () => {
    (palestranteService.getById as any).mockResolvedValue({ data: sample });
    (palestranteService.update as any).mockResolvedValue({ data: sample });
    const { wrapper, router } = await mountForm("/palestrantes/detalhes/1");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormVm;
    vm.nome = "Maria Atualizada";
    await vm.save();
    await flushPromises();

    expect(palestranteService.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ nome: "Maria Atualizada" }),
    );
    expect(router.currentRoute.value.name).toBe("palestrantes-lista");
  });

  it("cancels back to list", async () => {
    const { wrapper, router } = await mountForm("/palestrantes/detalhes");
    await flushPromises();

    await wrapper.findAll("button").find((b) => b.text() === "Cancelar")!.trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.name).toBe("palestrantes-lista");
  });

  it("shows save error without navigating", async () => {
    (palestranteService.create as any).mockRejectedValue(new Error("fail"));
    const { wrapper, router } = await mountForm("/palestrantes/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormVm;
    vm.nome = "Teste";
    await vm.save();
    await flushPromises();

    expect(wrapper.text()).toContain("Erro ao salvar palestrante");
    expect(router.currentRoute.value.name).toBe("palestrante-detalhe");
  });

  it("hides write form when canWrite is false", async () => {
    (canWrite as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const { wrapper } = await mountForm("/palestrantes/detalhes");
    await flushPromises();

    expect(wrapper.find('[data-testid="readonly-message"]').exists()).toBe(true);
    expect(wrapper.find("form").exists()).toBe(false);
  });

  it("saves speaker redes on update", async () => {
    (palestranteService.getById as any).mockResolvedValue({ data: sample });
    (palestranteService.update as any).mockResolvedValue({ data: sample });
    (redeSocialService.saveByPalestrante as any).mockResolvedValue({ status: 200 });
    const { wrapper } = await mountForm("/palestrantes/detalhes/1");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormVm;
    vm.addRede();
    vm.redes[0].nome = "Instagram";
    vm.redes[0].url = "https://instagram.com/maria";
    await vm.save();
    await flushPromises();

    expect(redeSocialService.saveByPalestrante).toHaveBeenCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({ nome: "Instagram", url: "https://instagram.com/maria" }),
      ]),
    );
  });

  it("deletes speaker rede via removeByPalestrante", async () => {
    (palestranteService.getById as any).mockResolvedValue({ data: sample });
    (redeSocialService.listByPalestrante as any).mockResolvedValue({
      data: [{ id: 7, nome: "X", url: "https://x.com/maria" }],
    });
    (redeSocialService.removeByPalestrante as any).mockResolvedValue({ status: 200 });
    const { wrapper } = await mountForm("/palestrantes/detalhes/1");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormVm;
    await vm.removeRedeAt(0);
    await flushPromises();

    expect(window.confirm).toHaveBeenCalled();
    expect(redeSocialService.removeByPalestrante).toHaveBeenCalledWith(1, 7);
  });

  it("shows image preview when imagemURL is remote", async () => {
    const { wrapper } = await mountForm("/palestrantes/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormVm;
    vm.imagemURL = "https://example.com/preview.jpg";
    await flushPromises();

    const preview = wrapper.find('[data-testid="speaker-image-preview"]');
    expect(preview.exists()).toBe(true);
    expect(preview.find("img").attributes("src")).toBe("https://example.com/preview.jpg");
  });

  it("does not expose userId field", async () => {
    const { wrapper } = await mountForm("/palestrantes/detalhes");
    await flushPromises();

    expect(wrapper.text().toLowerCase()).not.toContain("userid");
    expect(wrapper.text().toLowerCase()).not.toContain("user id");
  });

  it("shows error for invalid palestrante id", async () => {
    const { wrapper } = await mountForm("/palestrantes/detalhes/abc");
    await flushPromises();

    expect(wrapper.text()).toContain("Palestrante não encontrado");
    expect(palestranteService.getById).not.toHaveBeenCalled();
  });

  it("shows error when load fails", async () => {
    (palestranteService.getById as any).mockRejectedValue(new Error("fail"));
    const { wrapper } = await mountForm("/palestrantes/detalhes/1");
    await flushPromises();

    expect(wrapper.text()).toContain("Não foi possível carregar o palestrante");
  });

  it("clears redes when listByPalestrante fails", async () => {
    (palestranteService.getById as any).mockResolvedValue({ data: sample });
    (redeSocialService.listByPalestrante as any).mockRejectedValue(new Error("fail"));
    const { wrapper } = await mountForm("/palestrantes/detalhes/1");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormVm;
    expect(vm.redes).toEqual([]);
  });

  it("removes local rede without API call", async () => {
    const { wrapper } = await mountForm("/palestrantes/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormVm;
    vm.addRede();
    vm.redes[0].nome = "Local";
    await vm.removeRedeAt(0);
    await flushPromises();

    expect(redeSocialService.removeByPalestrante).not.toHaveBeenCalled();
    expect(vm.redes).toHaveLength(0);
  });

  it("shows error when persisted rede delete fails", async () => {
    (palestranteService.getById as any).mockResolvedValue({ data: sample });
    (redeSocialService.listByPalestrante as any).mockResolvedValue({
      data: [{ id: 7, nome: "X", url: "https://x.com" }],
    });
    (redeSocialService.removeByPalestrante as any).mockRejectedValue(new Error("fail"));
    const { wrapper } = await mountForm("/palestrantes/detalhes/1");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormVm;
    await vm.removeRedeAt(0);
    await flushPromises();

    expect(wrapper.text()).toContain("Falha ao excluir rede social");
  });

  it("hides broken thumbnail via onThumbError", async () => {
    const { wrapper } = await mountForm("/palestrantes/detalhes");
    await flushPromises();

    const vm = wrapper.vm as unknown as FormVm & { onThumbError: (e: Event) => void };
    vm.imagemURL = "https://example.com/preview.jpg";
    await flushPromises();

    const img = wrapper.find('[data-testid="speaker-image-preview"] img');
    const el = img.element as HTMLImageElement;
    vm.onThumbError({ target: el } as Event);
    expect(el.style.display).toBe("none");
  });
});
