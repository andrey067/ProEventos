import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import ListStagger from "./ListStagger.vue";

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

describe("ListStagger", () => {
  it("uses TransitionGroup when motion is allowed and has items", () => {
    stubMotion(false);
    const w = mount(ListStagger, {
      props: { itemsLength: 2, className: "list", tag: "ul" },
      slots: { default: "<li>A</li><li>B</li>" },
    });
    expect(w.text()).toContain("A");
    expect(w.text()).toContain("B");
  });

  it("falls back to plain tag when empty", () => {
    stubMotion(false);
    const w = mount(ListStagger, {
      props: { itemsLength: 0, tag: "div" },
      slots: { default: "" },
    });
    expect(w.find("div").exists()).toBe(true);
  });

  it("falls back to plain tag under reduced motion", () => {
    stubMotion(true);
    const w = mount(ListStagger, {
      props: { itemsLength: 2, className: "list", tag: "div" },
      slots: { default: "<span>A</span>" },
    });
    expect(w.find("div.list").text()).toContain("A");
  });
});
