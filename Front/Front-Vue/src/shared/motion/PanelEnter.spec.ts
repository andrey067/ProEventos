import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import PanelEnter from "./PanelEnter.vue";

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

describe("PanelEnter", () => {
  it("renders slot when motion is allowed", () => {
    stubMotion(false);
    const w = mount(PanelEnter, {
      props: { className: "panel" },
      slots: { default: "<p>painel</p>" },
    });
    expect(w.text()).toContain("painel");
  });

  it("renders static div under reduced motion", () => {
    stubMotion(true);
    const w = mount(PanelEnter, {
      props: { className: "panel" },
      slots: { default: "<span>static</span>" },
    });
    expect(w.find("div.panel").text()).toContain("static");
  });
});
