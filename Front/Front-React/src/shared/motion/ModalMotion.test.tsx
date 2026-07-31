import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ModalMotion } from "./ModalMotion";

const { mockReduced } = vi.hoisted(() => ({
  mockReduced: vi.fn(() => false),
}));

vi.mock("./usePrefersReducedMotion", () => ({
  usePrefersReducedMotion: () => mockReduced(),
}));

describe("ModalMotion", () => {
  const onCancel = vi.fn();

  beforeEach(() => {
    mockReduced.mockReturnValue(false);
    onCancel.mockClear();
  });

  it("returns null when closed", () => {
    const { container } = render(
      <ModalMotion open={false} onCancel={onCancel}>
        body
      </ModalMotion>,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders children and calls onCancel on backdrop click", () => {
    render(
      <ModalMotion open onCancel={onCancel}>
        <p>modal</p>
      </ModalMotion>,
    );
    expect(screen.getByText("modal")).toBeTruthy();
    fireEvent.click(screen.getByRole("presentation"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("stops propagation from panel click", () => {
    render(
      <ModalMotion open onCancel={onCancel}>
        <p>modal</p>
      </ModalMotion>,
    );
    fireEvent.click(screen.getByText("modal"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("renders under reduced motion", () => {
    mockReduced.mockReturnValue(true);
    render(
      <ModalMotion open onCancel={onCancel}>
        <p>modal</p>
      </ModalMotion>,
    );
    expect(screen.getByText("modal")).toBeTruthy();
  });
});
