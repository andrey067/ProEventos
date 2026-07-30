import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import PalestrantesComponent from "./PalestrantesComponent.vue";

describe("PalestrantesComponent", () => {
  it("mounts with router-view", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
          component: PalestrantesComponent,
          children: [
            { path: "", component: { template: "<div data-test='child'>child</div>" } },
          ],
        },
      ],
    });
    await router.push("/");
    await router.isReady();

    const wrapper = mount(PalestrantesComponent, {
      global: { plugins: [router] },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find("[data-test='child']").exists()).toBe(true);
  });
});
