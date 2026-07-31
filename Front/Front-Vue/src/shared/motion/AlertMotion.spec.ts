import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import AlertMotion from "./AlertMotion.vue";

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

describe("AlertMotion", () => {
  it("renders when show is true", () => {
    stubMotion(false);
    const w = mount(AlertMotion, {
      props: { show: true, className: "alert" },
      slots: { default: "erro" },
    });
    expect(w.text()).toContain("erro");
  });

  it("hides when show is false", () => {
    stubMotion(false);
    const w = mount(AlertMotion, {
      props: { show: false },
      slots: { default: "erro" },
    });
    expect(w.text()).not.toContain("erro");
  });

  it("renders under reduced motion", () => {
    stubMotion(true);
    const w = mount(AlertMotion, {
      props: { show: true },
      slots: { default: "ok" },
    });
    expect(w.text()).toContain("ok");
  });
});
