import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import CurrencyInputField from "./CurrencyInputField.vue";

const setValue = vi.fn();

vi.mock("vue-currency-input", () => ({
  CurrencyDisplay: { symbol: "symbol" },
  useCurrencyInput: () => ({
    inputRef: { value: null },
    setValue,
  }),
}));

describe("CurrencyInputField", () => {
  it("syncs model value into currency input", async () => {
    const wrapper = mount(CurrencyInputField, {
      props: { modelValue: 10.5 },
    });

    expect(setValue).toHaveBeenCalledWith(10.5);
    await wrapper.setProps({ modelValue: null });
    expect(setValue).toHaveBeenCalledWith(null);
  });
});
