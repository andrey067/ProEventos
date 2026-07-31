import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ListStagger, ListStaggerItem } from "./ListStagger";

const { mockReduced } = vi.hoisted(() => ({
  mockReduced: vi.fn(() => false),
}));

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

describe("ListStagger", () => {
  beforeEach(() => mockReduced.mockReturnValue(false));

  it("renders animated items when motion is allowed", () => {
    render(
      <ListStagger>
        <ListStaggerItem index={0}>A</ListStaggerItem>
        <ListStaggerItem index={1} className="row">
          B
        </ListStaggerItem>
      </ListStagger>,
    );
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
  });

  it("renders static items under reduced motion", () => {
    mockReduced.mockReturnValue(true);
    render(
      <ListStagger>
        <ListStaggerItem index={0}>A</ListStaggerItem>
        <ListStaggerItem index={1}>B</ListStaggerItem>
      </ListStagger>,
    );
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
  });
});
