import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RouteFade } from "./RouteFade";

const { mockReduced } = vi.hoisted(() => ({
  mockReduced: vi.fn(() => false),
}));

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

describe("RouteFade", () => {
  beforeEach(() => mockReduced.mockReturnValue(false));

  it("renders children with motion when allowed", () => {
    render(
      <RouteFade routeKey="/eventos">
        <h1>Rota</h1>
      </RouteFade>,
    );
    expect(screen.getByRole("heading", { name: "Rota" })).toBeTruthy();
  });

  it("renders children without motion wrapper when reduced", () => {
    mockReduced.mockReturnValue(true);
    render(
      <RouteFade routeKey="/eventos">
        <h1>Rota</h1>
      </RouteFade>,
    );
    expect(screen.getByRole("heading", { name: "Rota" })).toBeTruthy();
  });
});
