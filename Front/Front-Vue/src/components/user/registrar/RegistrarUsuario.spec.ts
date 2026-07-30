import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import RegistrarUsuario from "./RegistrarUsuario.vue";
import accountService from "../../../services/accountService";

vi.mock("../../../services/accountService", () => ({
  default: {
    register: vi.fn(),
    registerPalestrante: vi.fn(),
  },
}));

describe("RegistrarUsuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function mountPage() {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/user/registro", component: RegistrarUsuario },
        { path: "/user/login", name: "login", component: { template: "<div />" } },
        { path: "/eventos/lista", component: { template: "<div />" } },
      ],
    });
    await router.push("/user/registro");
    await router.isReady();
    return mount(RegistrarUsuario, { global: { plugins: [router] } });
  }

  it("renders registration form and login link", async () => {
    const wrapper = await mountPage();
    expect(wrapper.text()).toContain("Cadastro de Usuário");
    expect(wrapper.text()).toContain("Cadastrar");
    expect(wrapper.text()).toContain("Registrar como palestrante");
    expect(wrapper.find('a[href="/user/login"]').exists()).toBe(true);
  });

  it("submits registerPalestrante when checkbox is checked", async () => {
    (accountService.registerPalestrante as any).mockResolvedValue({ token: "t" });
    const wrapper = await mountPage();
    const vm = wrapper.vm as any;

    vm.nome = "Ana";
    vm.userName = "ana";
    vm.email = "ana@test.com";
    vm.password = "senha123";
    vm.asPalestrante = true;
    vm.miniCurriculo = "Bio curta";
    vm.telefone = "11999990000";
    vm.imagemURL = "https://example.com/ana.jpg";
    await flushPromises();

    await vm.submitForm();
    await flushPromises();

    expect(accountService.registerPalestrante).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: "Ana",
        userName: "ana",
        email: "ana@test.com",
        password: "senha123",
        miniCurriculo: "Bio curta",
        telefone: "11999990000",
        imagemURL: "https://example.com/ana.jpg",
      }),
    );
    expect(accountService.register).not.toHaveBeenCalled();
  });

  it("submits register for participant when checkbox is off", async () => {
    (accountService.register as any).mockResolvedValue({ token: "t" });
    const wrapper = await mountPage();
    const vm = wrapper.vm as any;

    vm.nome = "João";
    vm.userName = "joao";
    vm.email = "joao@test.com";
    vm.password = "senha123";
    vm.asPalestrante = false;
    await vm.submitForm();
    await flushPromises();

    expect(accountService.register).toHaveBeenCalled();
    expect(accountService.registerPalestrante).not.toHaveBeenCalled();
  });

  it("shows error when registration fails", async () => {
    (accountService.register as any).mockRejectedValue(new Error("fail"));
    const wrapper = await mountPage();
    const vm = wrapper.vm as any;

    vm.nome = "João";
    vm.userName = "joao";
    vm.email = "joao@test.com";
    vm.password = "senha123";
    await vm.submitForm();
    await flushPromises();

    expect(accountService.registerPalestrante).not.toHaveBeenCalled();
  });

  it("shows validation errors for empty required fields", async () => {
    const wrapper = await mountPage();
    const vm = wrapper.vm as any;
    await vm.submitForm();
    await flushPromises();
    expect(wrapper.text()).toContain("Nome é obrigatório");
    expect(accountService.register).not.toHaveBeenCalled();
  });
});
