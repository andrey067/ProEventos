import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CurrencyInput } from "@/components/CurrencyInput";

describe("CurrencyInput", () => {
  it("calls onChange with parsed float", () => {
    const onChange = vi.fn();
    render(<CurrencyInput value={null} onChange={onChange} />);
    const input = screen.getByPlaceholderText("R$ 0,00");
    fireEvent.change(input, { target: { value: "12,50" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("calls onChange with undefined for empty value", () => {
    const onChange = vi.fn();
    render(<CurrencyInput value={10} onChange={onChange} />);
    const input = screen.getByPlaceholderText("R$ 0,00");
    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
