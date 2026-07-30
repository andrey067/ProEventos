import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingSpinner } from "@/components/LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders nothing when loading is false", () => {
    const { container } = render(<LoadingSpinner loading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders page variant by default", () => {
    render(<LoadingSpinner loading />);
    expect(screen.getByTestId("loading-spinner")).toBeTruthy();
    expect(screen.getByText("Carregando...")).toBeTruthy();
  });

  it("renders inline variant", () => {
    render(<LoadingSpinner loading variant="inline" label="Aguarde" />);
    expect(screen.getByLabelText("Aguarde")).toBeTruthy();
  });

  it("renders button variant", () => {
    render(<LoadingSpinner loading variant="button" size={20} />);
    expect(screen.getByTestId("loading-spinner")).toBeTruthy();
  });
});
