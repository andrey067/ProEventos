import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AlertMotion } from "./AlertMotion";

const { mockReduced } = vi.hoisted(() => ({
  mockReduced: vi.fn(() => false),
}));

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

describe("AlertMotion", () => {
  beforeEach(() => mockReduced.mockReturnValue(false));

  it("renders alert when show is true", () => {
    render(
      <AlertMotion show className="alert">
        erro
      </AlertMotion>,
    );
    expect(screen.getByText("erro")).toBeTruthy();
  });

  it("renders nothing when show is false", () => {
    const { container } = render(
      <AlertMotion show={false}>erro</AlertMotion>,
    );
    expect(container.textContent).toBe("");
  });

  it("renders under reduced motion", () => {
    mockReduced.mockReturnValue(true);
    render(
      <AlertMotion show className="alert">
        ok
      </AlertMotion>,
    );
    expect(screen.getByText("ok")).toBeTruthy();
  });
});
