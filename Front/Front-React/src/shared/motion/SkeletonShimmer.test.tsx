import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SkeletonShimmer } from "./SkeletonShimmer";

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => false,
}));

describe("SkeletonShimmer", () => {
  it("renders placeholder rows with motion-skeleton class", () => {
    const { container } = render(<SkeletonShimmer rows={3} />);
    expect(container.querySelectorAll(".motion-skeleton").length).toBe(3);
  });
});
