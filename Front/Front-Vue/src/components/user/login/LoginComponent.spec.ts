import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import LoginComponent from "./LoginComponent.vue";
import accountService from "../../../services/accountService";

vi.mock("../../../services/accountService", () => ({
  default: {
    login: vi.fn(),
  },
}));

async function mountLogin(query = "") {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/user/login", name: "login", component: LoginComponent },
      { path: "/user/registro", name: "registro", component: { template: "<div />" } },
      { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
      { path: "/user/perfil", name: "perfil", component: { template: "<div />" } },
    ],
  });
  await router.push(`/user/login${query}`);
  await router.isReady();
  return { wrapper: mount(LoginComponent, { global: { plugins: [router] } }), router };
}

describe("LoginComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with userName and password fields", async () => {
    const { wrapper } = await mountLogin();

    expect(wrapper.text()).toContain("Login");
    expect(wrapper.text()).toContain("Entrar");
    expect(wrapper.find('input[autocomplete="username"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Cadastre-se");
  });

  it("logs in and redirects to lista by default", async () => {
    vi.mocked(accountService.login).mockResolvedValue(undefined);
    const { wrapper, router } = await mountLogin();
    const vm = wrapper.vm as { userName: string; password: string; submitForm: () => Promise<void> };

    vm.userName = "ana";
    vm.password = "secret";
    await vm.submitForm();
    await flushPromises();

    expect(accountService.login).toHaveBeenCalledWith({
      userName: "ana",
      password: "secret",
    });
    expect(router.currentRoute.value.path).toBe("/eventos/lista");
  });

  it("redirects to query redirect when present", async () => {
    vi.mocked(accountService.login).mockResolvedValue(undefined);
    const { wrapper, router } = await mountLogin("?redirect=/user/perfil");
    const vm = wrapper.vm as { userName: string; password: string; submitForm: () => Promise<void> };

    vm.userName = "ana";
    vm.password = "secret";
    await vm.submitForm();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/user/perfil");
  });

  it("shows 401 error message", async () => {
    const { AxiosError } = await import("axios");
    const err = new AxiosError("unauthorized");
    err.response = { status: 401, data: { description: "Credenciais inválidas" } } as never;
    vi.mocked(accountService.login).mockRejectedValue(err);

    const { wrapper } = await mountLogin();
    const vm = wrapper.vm as { userName: string; password: string; submitForm: () => Promise<void> };
    vm.userName = "ana";
    vm.password = "wrong";
    await vm.submitForm();
    await flushPromises();

    expect(wrapper.text()).toContain("Credenciais inválidas");
  });

  it("shows generic error on other failures", async () => {
    vi.mocked(accountService.login).mockRejectedValue(new Error("network"));
    const { wrapper } = await mountLogin();
    const vm = wrapper.vm as { userName: string; password: string; submitForm: () => Promise<void> };

    vm.userName = "ana";
    vm.password = "secret";
    await vm.submitForm();
    await flushPromises();

    expect(wrapper.text()).toContain("Não foi possível entrar");
  });

  it("shows validation errors for empty fields", async () => {
    const { wrapper } = await mountLogin();
    const vm = wrapper.vm as { submitForm: () => Promise<void> };

    await vm.submitForm();
    await flushPromises();

    expect(accountService.login).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Usuário é obrigatório");
    expect(wrapper.text()).toContain("Senha é obrigatória");
  });
});
