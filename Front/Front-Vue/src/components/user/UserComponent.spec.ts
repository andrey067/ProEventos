import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import UserComponent from "./UserComponent.vue";

describe("UserComponent", () => {
  it("emits titulo on mount for login route", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/user/login", name: "login", component: UserComponent },
        { path: "/user/registro", component: { template: "<div />" } },
      ],
    });
    await router.push("/user/login");
    await router.isReady();

    const wrapper = mount(UserComponent, {
      global: { plugins: [router] },
    });

    expect(wrapper.emitted("titulo")).toBeTruthy();
    expect(wrapper.emitted("titulo")![0][0]).toEqual({ mostrarTitulo: false });
  });

  it("emits titulo for detalhe route name via titlePros", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/eventos/detalhes/:id", name: "detalhe", component: UserComponent },
      ],
    });
    await router.push("/eventos/detalhes/1");
    await router.isReady();

    const wrapper = mount(UserComponent, {
      global: { plugins: [router] },
    });

    expect(wrapper.emitted("titulo")![0][0]).toEqual(
      expect.objectContaining({
        titulo: "Evento",
        subtitulo: "Detalhes do Evento",
      }),
    );
  });

  it("emits empty titulo for default route", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/other", name: "other", component: UserComponent },
      ],
    });
    await router.push("/other");
    await router.isReady();

    const wrapper = mount(UserComponent, {
      global: { plugins: [router] },
    });

    expect(wrapper.emitted("titulo")![0][0]).toEqual({});
    consoleSpy.mockRestore();
  });
});
