import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
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
import accountService from "../services/accountService";

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
          path: "/palestrantes/lista",
          name: "palestrantes-lista",
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
          path: "/palestrantes/lista",
          name: "palestrantes-lista",
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

  it("toggles mobile menu open and closed", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", component: { template: "<div />" } },
        {
          path: "/eventos/lista",
          name: "lista",
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

    expect(wrapper.find("#mobile-nav").exists()).toBe(false);

    const menuButton = wrapper.find('button[aria-label="Menu"]');
    await menuButton.trigger("click");
    expect(wrapper.find("#mobile-nav").exists()).toBe(true);

    await menuButton.trigger("click");
    expect(wrapper.find("#mobile-nav").exists()).toBe(false);
  });

  it("closes mobile menu when route changes", async () => {
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
          path: "/palestrantes/lista",
          name: "palestrantes-lista",
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

    await wrapper.find('button[aria-label="Menu"]').trigger("click");
    expect(wrapper.find("#mobile-nav").exists()).toBe(true);

    await router.push("/palestrantes/lista");
    await wrapper.vm.$nextTick();

    expect(wrapper.find("#mobile-nav").exists()).toBe(false);
  });

  it("logs out from mobile menu and navigates to login", async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", component: { template: "<div />" } },
        { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
        { path: "/user/login", name: "login", component: { template: "<div />" } },
      ],
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(MenuComponent, { global: { plugins: [router] } });
    await wrapper.find('button[aria-label="Menu"]').trigger("click");
    const sairBtn = wrapper
      .findAll("#mobile-nav button")
      .find((b) => b.text() === "Sair");
    await sairBtn!.trigger("click");
    await flushPromises();

    expect(accountService.logout).toHaveBeenCalled();
    expect(router.currentRoute.value.name).toBe("login");
  });

  it("highlights detalhe route as active eventos link", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/eventos/detalhes/:id", name: "detalhe", component: { template: "<div />" } },
        { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
      ],
    });
    await router.push("/eventos/detalhes/1");
    await router.isReady();

    const wrapper = mount(MenuComponent, { global: { plugins: [router] } });
    const eventosLink = wrapper.findAll("a").find((a) => a.text() === "Eventos");
    expect(eventosLink?.classes()).toContain("bg-accent-soft");
  });

  it("logs out from desktop nav", async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", component: { template: "<div />" } },
        { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
        { path: "/user/login", name: "login", component: { template: "<div />" } },
      ],
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(MenuComponent, { global: { plugins: [router] } });
    const sairBtn = wrapper
      .findAll("nav button")
      .find((b) => b.text() === "Sair");
    await sairBtn!.trigger("click");
    await flushPromises();

    expect(accountService.logout).toHaveBeenCalled();
    expect(router.currentRoute.value.name).toBe("login");
  });

  it("highlights palestrante detail route in mobile nav", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/palestrantes/detalhes/:id",
          name: "palestrante-detalhe",
          component: { template: "<div />" },
        },
        {
          path: "/palestrantes/lista",
          name: "palestrantes-lista",
          component: { template: "<div />" },
        },
      ],
    });
    await router.push("/palestrantes/detalhes/1");
    await router.isReady();

    const wrapper = mount(MenuComponent, { global: { plugins: [router] } });
    await wrapper.find('button[aria-label="Menu"]').trigger("click");

    const palestrantesLink = wrapper
      .findAll("#mobile-nav a")
      .find((a) => a.text() === "Palestrantes");
    expect(palestrantesLink?.classes()).toContain("bg-accent-soft");
  });

  it("highlights perfil route when on senha page", async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true);
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/user/senha", name: "senha", component: { template: "<div />" } },
        { path: "/user/perfil", name: "perfil", component: { template: "<div />" } },
        { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
      ],
    });
    await router.push("/user/senha");
    await router.isReady();

    const wrapper = mount(MenuComponent, { global: { plugins: [router] } });
    const perfilLink = wrapper.findAll("a").find((a) => a.text() === "Perfil");
    expect(perfilLink?.classes()).toContain("bg-accent-soft");
  });

  it("closes mobile menu when a mobile link is clicked", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
        { path: "/palestrantes/lista", name: "palestrantes-lista", component: { template: "<div />" } },
      ],
    });
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(MenuComponent, { global: { plugins: [router] } });
    await wrapper.find('button[aria-label="Menu"]').trigger("click");
    const palestrantesLink = wrapper
      .findAll("#mobile-nav a")
      .find((a) => a.text() === "Palestrantes");
    await palestrantesLink!.trigger("click");
    expect(wrapper.find("#mobile-nav").exists()).toBe(false);
  });

  it("shows inactive styling for eventos link on login route", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/user/login", name: "login", component: { template: "<div />" } },
        { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
      ],
    });
    await router.push("/user/login");
    await router.isReady();

    const wrapper = mount(MenuComponent, { global: { plugins: [router] } });
    const eventosLink = wrapper.findAll("a").find((a) => a.text() === "Eventos");
    expect(eventosLink?.classes()).not.toContain("bg-accent-soft");
  });

  it("renders hamburger icon when closed and close icon when open", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: "/eventos/lista", name: "lista", component: { template: "<div />" } }],
    });
    await router.push("/eventos/lista");
    await router.isReady();

    const wrapper = mount(MenuComponent, { global: { plugins: [router] } });
    expect(wrapper.html()).toContain('d="M4 6h16"');

    await wrapper.find('button[aria-label="Menu"]').trigger("click");
    expect(wrapper.html()).toContain('d="M18 6 6 18"');
  });
});
