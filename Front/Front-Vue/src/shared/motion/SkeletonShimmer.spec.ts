import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, afterEach } from "vitest";
import SkeletonShimmer from "./SkeletonShimmer.vue";

afterEach(() => vi.unstubAllGlobals());

it("renders N skeleton rows", () => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
  const w = mount(SkeletonShimmer, { props: { rows: 3 } });
  expect(w.findAll(".motion-skeleton, .bg-line").length).toBe(3);
});
