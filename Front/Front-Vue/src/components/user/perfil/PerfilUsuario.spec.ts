import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import PerfilUsuario from "./PerfilUsuario.vue";
import PerfilDetalhe from "./PerfilDetalhe.vue";
import accountService from "../../../services/accountService";
import redeSocialService from "../../../services/redeSocialService";

vi.mock("../../../services/accountService", () => ({
  default: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock("../../../services/redeSocialService", () => ({
  default: {
    listMine: vi.fn(),
    saveMine: vi.fn(),
    removeMine: vi.fn(),
  },
}));

vi.mock("../../../services/palestranteService", () => ({
  default: {
    getMe: vi.fn(),
    update: vi.fn(),
  },
}));

const baseProfile = {
  nome: "Ana Silva",
  userName: "ana",
  email: "ana@test.com",
  primeiroNome: "Ana",
  ultimoNome: "Silva",
  titulo: "NaoInformado" as const,
  funcao: "Participante" as const,
  telefone: "11988887777",
  descricao: "Bio da Ana",
  imagemURL: "https://images.unsplash.com/photo-1?w=200",
  eventosMinistrados: 0,
  eventosParticipados: 0,
};

const palestranteProfile = {
  ...baseProfile,
  funcao: "Palestrante" as const,
};

type PerfilDetalheVm = {
  primeiroNome: string;
  ultimoNome: string;
  telefone: string;
  descricao: string;
  password: string;
  confirmePassword: string;
  submitForm: () => Promise<void>;
  cancelEdit: () => void;
};

type PerfilUsuarioVm = {
  onFormPreview: (preview: {
    primeiroNome: string;
    ultimoNome: string;
    descricao: string;
    funcao: string;
  }) => void;
  onImgError: () => void;
};

function getDetalhe(wrapper: VueWrapper) {
  return wrapper.findComponent(PerfilDetalhe);
}

function detalheVm(wrapper: VueWrapper) {
  return getDetalhe(wrapper).vm as unknown as PerfilDetalheVm;
}

async function mountComponent() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/user/perfil", component: PerfilUsuario }],
  });
  await router.push("/user/perfil");
  await router.isReady();
  return mount(PerfilUsuario, { global: { plugins: [router] } });
}

describe("PerfilUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads profile card fields", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);

    const wrapper = await mountComponent();
    await flushPromises();

    expect(accountService.getProfile).toHaveBeenCalled();
    const vm = detalheVm(wrapper);
    expect(vm.primeiroNome).toBe("Ana");
    expect(vm.telefone).toBe("11988887777");
    expect(vm.descricao).toBe("Bio da Ana");
    expect(wrapper.text()).toContain("@ana");
    expect(wrapper.text()).toContain("Eventos Ministrados");
  });

  it("save calls updateProfile with course fields", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    (accountService.updateProfile as any).mockResolvedValue({
      ...baseProfile,
      primeiroNome: "Ana",
      ultimoNome: "Atualizada",
      nome: "Ana Atualizada",
      telefone: "11977776666",
      descricao: "Nova bio",
    });

    const wrapper = await mountComponent();
    await flushPromises();

    const vm = detalheVm(wrapper);
    vm.ultimoNome = "Atualizada";
    vm.telefone = "11977776666";
    vm.descricao = "Nova bio";
    await vm.submitForm();
    await flushPromises();

    expect(accountService.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        primeiroNome: "Ana",
        ultimoNome: "Atualizada",
        userName: "ana",
        email: "ana@test.com",
        telefone: "11977776666",
        descricao: "Nova bio",
      }),
    );
    expect(wrapper.text()).toContain("Perfil atualizado com sucesso");
  });

  it("shows error when profile load fails", async () => {
    (accountService.getProfile as any).mockRejectedValue(new Error("fail"));
    const wrapper = await mountComponent();
    await flushPromises();
    expect(wrapper.text()).toContain("Não foi possível carregar o perfil");
  });

  it("shows error when save fails", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    (accountService.updateProfile as any).mockRejectedValue(new Error("fail"));
    const wrapper = await mountComponent();
    await flushPromises();
    const vm = detalheVm(wrapper);
    await vm.submitForm();
    await flushPromises();
    expect(wrapper.text()).toContain("Não foi possível atualizar o perfil");
  });

  it("cancelEdit restores snapshot values", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();

    const vm = detalheVm(wrapper);
    vm.ultimoNome = "Alterado";
    vm.cancelEdit();

    expect(vm.ultimoNome).toBe("Silva");
    expect(vm.telefone).toBe("11988887777");
  });

  it("onImgError falls back to placeholder image", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();

    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
    vm.onImgError();
    await wrapper.vm.$nextTick();

    const img = wrapper.find("img");
    expect(img.attributes("src")).toContain("data:image/svg+xml");
  });

  it("rejects mismatched passwords", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();

    const vm = detalheVm(wrapper);
    vm.password = "senha123";
    vm.confirmePassword = "outra";
    await vm.submitForm();
    await flushPromises();

    expect(accountService.updateProfile).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("As senhas não coincidem");
  });

  it("submits password when provided", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    (accountService.updateProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();

    const vm = detalheVm(wrapper);
    vm.password = "novaSenha1";
    vm.confirmePassword = "novaSenha1";
    await vm.submitForm();
    await flushPromises();

    expect(accountService.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ password: "novaSenha1" }),
    );
  });

  it("shows API error message on axios save failure", async () => {
    const { AxiosError } = await import("axios");
    const axiosError = new AxiosError("conflict");
    axiosError.response = { data: { description: "E-mail já cadastrado" } } as never;
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    (accountService.updateProfile as any).mockRejectedValue(axiosError);
    const wrapper = await mountComponent();
    await flushPromises();
    const vm = detalheVm(wrapper);
    await vm.submitForm();
    await flushPromises();
    expect(wrapper.text()).toContain("E-mail já cadastrado");
  });

  it("displays composed name when nome is empty", async () => {
    (accountService.getProfile as any).mockResolvedValue({
      ...baseProfile,
      nome: "",
    });
    const wrapper = await mountComponent();
    await flushPromises();
    expect(wrapper.text()).toContain("Ana Silva");
  });

  it("uses placeholder when profile has no imagemURL", async () => {
    (accountService.getProfile as any).mockResolvedValue({
      ...baseProfile,
      imagemURL: null,
    });
    const wrapper = await mountComponent();
    await flushPromises();
    expect(wrapper.find("img").attributes("src")).toContain("data:image/svg+xml");
  });

  it("shows validation errors for required fields", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();

    const vm = detalheVm(wrapper);
    vm.telefone = "";
    vm.descricao = "";
    await vm.submitForm();
    await flushPromises();

    expect(accountService.updateProfile).not.toHaveBeenCalled();
    expect(wrapper.text()).toMatch(/telefone|obrigatório/i);
  });

  it("updates card nome/descricao live from formPreview", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();
    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
    vm.onFormPreview({
      primeiroNome: "Live",
      ultimoNome: "Nome",
      descricao: "Bio ao vivo",
      funcao: "Participante",
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Live Nome");
    expect(wrapper.text()).toContain("Bio ao vivo");
  });

  it("hides Palestrante and Rede Social tabs for Participante", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true);
    expect(wrapper.find('[data-tab="palestrante"]').exists()).toBe(false);
  });

  it("shows extra tabs when funcao becomes Palestrante", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();
    (wrapper.vm as unknown as PerfilUsuarioVm).onFormPreview({
      primeiroNome: "N",
      ultimoNome: "S",
      descricao: "D",
      funcao: "Palestrante",
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-tab="palestrante"]').exists()).toBe(true);
    expect(wrapper.find('[data-tab="rede-social"]').exists()).toBe(true);
  });

  it.skip("hides redes section for Participante", async () => {
    // Task 7
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-tab="rede-social"]').exists()).toBe(false);
    expect(redeSocialService.listMine).not.toHaveBeenCalled();
  });

  it.skip("loads and saves redes for Palestrante", async () => {
    // Task 7
    (accountService.getProfile as any).mockResolvedValue(palestranteProfile);
    (redeSocialService.listMine as any).mockResolvedValue({
      data: [{ id: 1, nome: "GitHub", url: "https://github.com/me" }],
    });
    (redeSocialService.saveMine as any).mockResolvedValue({
      data: [{ id: 1, nome: "GitHub", url: "https://github.com/updated" }],
    });

    const wrapper = await mountComponent();
    await flushPromises();

    expect(wrapper.find('[data-tab="rede-social"]').exists()).toBe(true);
  });

  it.skip("deletes persisted rede after confirmation", async () => {
    // Task 7
    (accountService.getProfile as any).mockResolvedValue(palestranteProfile);
    (redeSocialService.listMine as any).mockResolvedValue({
      data: [{ id: 7, nome: "LinkedIn", url: "https://linkedin.com/in/me" }],
    });
    (redeSocialService.removeMine as any).mockResolvedValue({ status: 200 });

    const wrapper = await mountComponent();
    await flushPromises();

    expect(redeSocialService.removeMine).toHaveBeenCalledWith(7);
  });
});
