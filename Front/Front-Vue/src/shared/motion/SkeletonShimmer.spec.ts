import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import SkeletonShimmer from "./SkeletonShimmer.vue";

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

describe("SkeletonShimmer", () => {
  it("renders N skeleton rows with motion class", () => {
    stubMotion(false);
    const w = mount(SkeletonShimmer, { props: { rows: 3 } });
    expect(w.findAll(".motion-skeleton").length).toBe(3);
  });

  it("uses static bg-line under reduced motion", () => {
    stubMotion(true);
    const w = mount(SkeletonShimmer, { props: { rows: 2 } });
    expect(w.findAll(".bg-line").length).toBe(2);
    expect(w.findAll(".motion-skeleton").length).toBe(0);
  });
});
