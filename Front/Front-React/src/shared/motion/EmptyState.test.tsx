import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";

const { mockReduced } = vi.hoisted(() => ({
  mockReduced: vi.fn(() => false),
}));

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

describe("EmptyState", () => {
  beforeEach(() => mockReduced.mockReturnValue(false));

  it("renders when show is true", () => {
    render(
      <EmptyState show className="empty">
        vazio
      </EmptyState>,
    );
    expect(screen.getByText("vazio")).toBeTruthy();
  });

  it("renders nothing when show is false", () => {
    const { container } = render(
      <EmptyState show={false}>vazio</EmptyState>,
    );
    expect(container.textContent).toBe("");
  });

  it("renders under reduced motion", () => {
    mockReduced.mockReturnValue(true);
    render(<EmptyState show>vazio</EmptyState>);
    expect(screen.getByText("vazio")).toBeTruthy();
  });
});
