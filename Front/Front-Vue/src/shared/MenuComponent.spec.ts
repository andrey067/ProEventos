import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import MenuComponent from "../shared/MenuComponent.vue";

vi.mock("../services/authToken", () => ({
  isAuthenticated: vi.fn(() => false),
}));

vi.mock("../services/accountService", () => ({
  default: {
    logout: vi.fn(),
  },
}));

import { isAuthenticated } from "../services/authToken";

describe("MenuComponent", () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockReturnValue(false);
  });

  it("renders ProEventos brand and Eventos/Palestrantes/Login when logged out", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", component: { template: "<div />" } },
        {
          path: "/eventos/lista",
          name: "lista",
          component: { template: "<div />" },
        },
        {
          path: "/palestrantes",
          name: "palestrantes",
          component: { template: "<div />" },
        },
        {
          path: "/user/login",
          name: "login",
          component: { template: "<div />" },
        },
      ],
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(MenuComponent, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain("ProEventos");
    expect(wrapper.text()).toContain("Eventos");
    expect(wrapper.text()).toContain("Palestrantes");
    expect(wrapper.text()).toContain("Login");
    expect(wrapper.text()).not.toContain("Contatos");
    expect(wrapper.text()).not.toContain("Perfil");
  });

  it("shows Perfil and Sair when authenticated", async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", component: { template: "<div />" } },
        {
          path: "/eventos/lista",
          name: "lista",
          component: { template: "<div />" },
        },
        {
          path: "/palestrantes",
          name: "palestrantes",
          component: { template: "<div />" },
        },
        {
          path: "/user/perfil",
          name: "perfil",
          component: { template: "<div />" },
        },
      ],
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(MenuComponent, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain("Perfil");
    expect(wrapper.text()).toContain("Sair");
    expect(wrapper.text()).not.toContain("Login");
  });
});
