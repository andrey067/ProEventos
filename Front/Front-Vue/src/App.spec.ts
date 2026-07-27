import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import App from "./App.vue";
import MenuComponent from "./shared/MenuComponent.vue";

vi.mock("./services/authToken", () => ({
  isAuthenticated: vi.fn(() => false),
}));

vi.mock("./services/accountService", () => ({
  default: {
    logout: vi.fn(),
  },
}));

describe("App", () => {
  it("renders menu and router outlet", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", component: { template: "<div data-test='page'>Home</div>" } },
        { path: "/eventos/lista", name: "lista", component: { template: "<div />" } },
        { path: "/palestrantes", name: "palestrantes", component: { template: "<div />" } },
        { path: "/user/login", name: "login", component: { template: "<div />" } },
      ],
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(App, { global: { plugins: [router] } });

    expect(wrapper.findComponent(MenuComponent).exists()).toBe(true);
    expect(wrapper.find("[data-test='page']").exists()).toBe(true);
  });
});
