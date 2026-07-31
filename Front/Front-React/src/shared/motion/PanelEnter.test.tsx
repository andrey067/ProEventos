import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PanelEnter } from "./PanelEnter";

const { mockReduced } = vi.hoisted(() => ({
  mockReduced: vi.fn(() => false),
}));

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

describe("PanelEnter", () => {
  beforeEach(() => mockReduced.mockReturnValue(false));

  it("renders children when motion is allowed", () => {
    render(
      <PanelEnter>
        <p>painel</p>
      </PanelEnter>,
    );
    expect(screen.getByText("painel")).toBeTruthy();
  });

  it("renders static div under reduced motion", () => {
    mockReduced.mockReturnValue(true);
    const { container } = render(
      <PanelEnter className="panel">
        <span>static</span>
      </PanelEnter>,
    );
    expect(container.querySelector("div.panel")?.textContent).toBe("static");
  });
});
