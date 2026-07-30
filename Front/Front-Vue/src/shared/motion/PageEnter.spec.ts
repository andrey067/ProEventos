import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import PageEnter from "./PageEnter.vue";

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

describe("PageEnter", () => {
  it("renders slot with transition when motion is allowed", () => {
    stubMotion(false);
    const w = mount(PageEnter, { slots: { default: "<p>Oi</p>" } });
    expect(w.text()).toContain("Oi");
  });

  it("renders static wrapper under reduced motion", () => {
    stubMotion(true);
    const w = mount(PageEnter, { slots: { default: "<p>Oi</p>" } });
    expect(w.text()).toContain("Oi");
    expect(w.find("div").exists()).toBe(true);
  });
});
