import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import RegistrarUsuario from "./RegistrarUsuario.vue";

vi.mock("../../../services/accountService", () => ({
  default: {
    register: vi.fn(),
  },
}));

describe("RegistrarUsuario", () => {
  it("renders registration form and login link", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/user/registro", component: RegistrarUsuario },
        { path: "/user/login", name: "login", component: { template: "<div />" } },
      ],
    });
    await router.push("/user/registro");
    await router.isReady();

    const wrapper = mount(RegistrarUsuario, { global: { plugins: [router] } });

    expect(wrapper.text()).toContain("Cadastro de Usuário");
    expect(wrapper.text()).toContain("Cadastrar");
    expect(wrapper.find('a[href="/user/login"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Já sou cadastrado");
  });
});
