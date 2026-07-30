import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageEnter } from "./PageEnter";

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => false,
}));

describe("PageEnter", () => {
  it("renders children", () => {
    render(
      <PageEnter>
        <h1>Olá</h1>
      </PageEnter>,
    );
    expect(screen.getByRole("heading", { name: "Olá" })).toBeTruthy();
  });
});
