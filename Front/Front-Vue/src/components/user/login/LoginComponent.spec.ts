import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import LoginComponent from "./LoginComponent.vue";

vi.mock("../../../services/accountService", () => ({
  default: {
    login: vi.fn(),
  },
}));

describe("LoginComponent", () => {
  it("renders login form with userName and password fields", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/user/login", name: "login", component: LoginComponent },
        { path: "/user/registro", name: "registro", component: { template: "<div />" } },
        { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
      ],
    });
    await router.push("/user/login");
    await router.isReady();

    const wrapper = mount(LoginComponent, { global: { plugins: [router] } });

    expect(wrapper.text()).toContain("Login");
    expect(wrapper.text()).toContain("Entrar");
    expect(wrapper.find('input[autocomplete="username"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Cadastre-se");
  });
});
