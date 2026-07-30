import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import PageEnter from "./PageEnter.vue";

afterEach(() => vi.unstubAllGlobals());

it("renders slot content", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
  const w = mount(PageEnter, { slots: { default: "<p>Oi</p>" } });
  expect(w.text()).toContain("Oi");
});
