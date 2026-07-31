import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import EmptyState from "./EmptyState.vue";

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

describe("EmptyState", () => {
  it("renders when show is true", () => {
    stubMotion(false);
    const w = mount(EmptyState, {
      props: { show: true, className: "empty" },
      slots: { default: "vazio" },
    });
    expect(w.text()).toContain("vazio");
  });

  it("hides when show is false", () => {
    stubMotion(false);
    const w = mount(EmptyState, {
      props: { show: false },
      slots: { default: "vazio" },
    });
    expect(w.text()).not.toContain("vazio");
  });

  it("renders under reduced motion", () => {
    stubMotion(true);
    const w = mount(EmptyState, {
      props: { show: true },
      slots: { default: "vazio" },
    });
    expect(w.text()).toContain("vazio");
  });
});
