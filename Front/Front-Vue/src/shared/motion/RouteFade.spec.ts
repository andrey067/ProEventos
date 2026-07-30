import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryHistory, createRouter } from "vue-router";
import { defineComponent, h } from "vue";
import RouteFade from "./RouteFade.vue";

function stubMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

const StubPage = defineComponent({
  name: "StubPage",
  setup: () => () => h("h1", "Rota"),
});

async function mountRouteFade(matches: boolean) {
  stubMotion(matches);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: StubPage }],
  });
  await router.push("/");
  await router.isReady();
  return mount(RouteFade, {
    global: { plugins: [router] },
  });
}

describe("RouteFade", () => {
  it("renders router view with fade when motion is allowed", async () => {
    const w = await mountRouteFade(false);
    expect(w.text()).toContain("Rota");
  });

  it("renders router view under reduced motion", async () => {
    const w = await mountRouteFade(true);
    expect(w.text()).toContain("Rota");
  });
});
