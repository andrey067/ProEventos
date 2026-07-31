import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SkeletonShimmer } from "./SkeletonShimmer";

const { mockReduced } = vi.hoisted(() => ({
  mockReduced: vi.fn(() => false),
}));

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

describe("SkeletonShimmer", () => {
  beforeEach(() => mockReduced.mockReturnValue(false));

  it("renders placeholder rows with motion-skeleton class", () => {
    const { container } = render(<SkeletonShimmer rows={3} />);
    expect(container.querySelectorAll(".motion-skeleton").length).toBe(3);
  });

  it("uses static bg-line under reduced motion", () => {
    mockReduced.mockReturnValue(true);
    const { container } = render(<SkeletonShimmer rows={2} />);
    expect(container.querySelectorAll(".bg-line").length).toBe(2);
    expect(container.querySelectorAll(".motion-skeleton").length).toBe(0);
  });
});
