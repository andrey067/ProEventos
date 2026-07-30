import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DatePicker } from "@/components/DatePicker";

describe("DatePicker", () => {
  it("shows placeholder when empty", () => {
    render(<DatePicker value="" onChange={vi.fn()} placeholder="Escolha" />);
    expect(screen.getByText("Escolha")).toBeTruthy();
  });

  it("formats selected ISO value", () => {
    render(<DatePicker value="2026-03-15" onChange={vi.fn()} />);
    expect(screen.getByText("15/03/2026")).toBeTruthy();
  });

  it("calls onChange when hidden input changes", () => {
    const onChange = vi.fn();
    const { container } = render(
      <DatePicker value="" onChange={onChange} name="data" />,
    );
    const hidden = container.querySelector('input[name="data"]') as HTMLInputElement;
    fireEvent.change(hidden, { target: { value: "2026-04-01" } });
    expect(onChange).toHaveBeenCalledWith("2026-04-01");
  });

  it("does not open popover when disabled", async () => {
    render(<DatePicker value="" onChange={vi.fn()} disabled />);
    fireEvent.click(screen.getByRole("button", { name: "Abrir calendário" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
