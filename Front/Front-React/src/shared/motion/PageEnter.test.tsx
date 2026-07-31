import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PageEnter } from "./PageEnter";

const { mockReduced } = vi.hoisted(() => ({
  mockReduced: vi.fn(() => false),
}));

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

describe("PageEnter", () => {
  beforeEach(() => mockReduced.mockReturnValue(false));

  it("renders children with motion when allowed", () => {
    render(
      <PageEnter>
        <h1>Olá</h1>
      </PageEnter>,
    );
    expect(screen.getByRole("heading", { name: "Olá" })).toBeTruthy();
  });

  it("renders static div under reduced motion", () => {
    mockReduced.mockReturnValue(true);
    const { container } = render(
      <PageEnter className="page">
        <span>static</span>
      </PageEnter>,
    );
    expect(container.querySelector("div.page")?.textContent).toBe("static");
  });
});
