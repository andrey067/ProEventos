import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import PerfilUsuario from "./PerfilUsuario.vue";
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

type PerfilUsuarioVm = {
  primeiroNome: string;
  ultimoNome: string;
  telefone: string;
  descricao: string;
  password: string;
  confirmePassword: string;
  isPalestrante: boolean;
  redes: { id?: number; nome: string; url: string }[];
  submitForm: () => Promise<void>;
  saveRedes: () => Promise<void>;
  askDeleteRede: (index: number) => void;
  confirmDeleteRede: () => Promise<void>;
  cancelEdit: () => void;
  onImgError: () => void;
};

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
    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
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

    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
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
    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
    await vm.submitForm();
    await flushPromises();
    expect(wrapper.text()).toContain("Não foi possível atualizar o perfil");
  });

  it("cancelEdit restores snapshot values", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();

    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
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

    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
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

    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
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
    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
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

    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
    vm.telefone = "";
    vm.descricao = "";
    await vm.submitForm();
    await flushPromises();

    expect(accountService.updateProfile).not.toHaveBeenCalled();
    expect(wrapper.text()).toMatch(/telefone|obrigatório/i);
  });

  it("hides redes section for Participante", async () => {
    (accountService.getProfile as any).mockResolvedValue(baseProfile);
    const wrapper = await mountComponent();
    await flushPromises();

    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
    expect(vm.isPalestrante).toBe(false);
    expect(wrapper.text()).not.toContain("Salvar Redes");
    expect(redeSocialService.listMine).not.toHaveBeenCalled();
  });

  it("loads and saves redes for Palestrante", async () => {
    (accountService.getProfile as any).mockResolvedValue(palestranteProfile);
    (redeSocialService.listMine as any).mockResolvedValue({
      data: [{ id: 1, nome: "GitHub", url: "https://github.com/me" }],
    });
    (redeSocialService.saveMine as any).mockResolvedValue({
      data: [{ id: 1, nome: "GitHub", url: "https://github.com/updated" }],
    });

    const wrapper = await mountComponent();
    await flushPromises();

    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
    expect(vm.isPalestrante).toBe(true);
    expect(redeSocialService.listMine).toHaveBeenCalled();
    expect(vm.redes).toHaveLength(1);

    vm.redes[0].url = "https://github.com/updated";
    await vm.saveRedes();
    await flushPromises();

    expect(redeSocialService.saveMine).toHaveBeenCalledWith([
      expect.objectContaining({
        nome: "GitHub",
        url: "https://github.com/updated",
      }),
    ]);
    expect(wrapper.text()).toContain("Redes sociais salvas com sucesso");
  });

  it("deletes persisted rede after confirmation", async () => {
    (accountService.getProfile as any).mockResolvedValue(palestranteProfile);
    (redeSocialService.listMine as any).mockResolvedValue({
      data: [{ id: 7, nome: "LinkedIn", url: "https://linkedin.com/in/me" }],
    });
    (redeSocialService.removeMine as any).mockResolvedValue({ status: 200 });

    const wrapper = await mountComponent();
    await flushPromises();

    const vm = wrapper.vm as unknown as PerfilUsuarioVm;
    vm.askDeleteRede(0);
    await vm.confirmDeleteRede();
    await flushPromises();

    expect(redeSocialService.removeMine).toHaveBeenCalledWith(7);
    expect(vm.redes).toHaveLength(0);
  });
});
