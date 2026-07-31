import { afterEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

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

describe("usePrefersReducedMotion", () => {
  it("returns true when media matches", () => {
    stubMotion(true);
    expect(usePrefersReducedMotion().value).toBe(true);
  });

  it("returns false when motion is allowed", () => {
    stubMotion(false);
    expect(usePrefersReducedMotion().value).toBe(false);
  });

  it("returns false when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(usePrefersReducedMotion().value).toBe(false);
  });

  it("subscribes to matchMedia change on mount", async () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener,
      }),
    );

    const Host = defineComponent({
      setup() {
        const reduced = usePrefersReducedMotion();
        return { reduced };
      },
      template: "<span>{{ reduced }}</span>",
    });
    const w = mount(Host);
    await nextTick();
    expect(addEventListener).toHaveBeenCalled();
    w.unmount();
    expect(removeEventListener).toHaveBeenCalled();
  });

  it("skips subscription when matchMedia missing on mount", async () => {
    vi.stubGlobal("matchMedia", undefined);
    const Host = defineComponent({
      setup() {
        const reduced = usePrefersReducedMotion();
        return { reduced };
      },
      template: "<span>{{ reduced }}</span>",
    });
    const w = mount(Host);
    await nextTick();
    expect(w.text()).toContain("false");
    w.unmount();
  });
});
