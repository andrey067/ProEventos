import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ListStagger, ListStaggerItem } from "./ListStagger";

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => true,
}));

describe("ListStagger", () => {
  it("renders items when reduced motion is on (static)", () => {
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
