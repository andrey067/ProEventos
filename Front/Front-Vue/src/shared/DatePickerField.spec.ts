import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import DatePickerField from "./DatePickerField.vue";

vi.mock("@vuepic/vue-datepicker", () => ({
  VueDatePicker: {
    name: "VueDatePicker",
    props: ["modelValue"],
    emits: ["update:modelValue", "closed"],
    template:
      '<input data-testid="dp" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" @blur="$emit(\'closed\')" />',
  },
}));

describe("DatePickerField", () => {
  it("emits model updates and blur", async () => {
    const wrapper = mount(DatePickerField, {
      props: { modelValue: "2026-01-15" },
    });

    const input = wrapper.get('[data-testid="dp"]');
    await input.setValue("2026-02-01");
    await input.trigger("blur");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["2026-02-01"]);
    expect(wrapper.emitted("blur")).toBeTruthy();
  });

  it("coerces null picker value to empty string", async () => {
    const wrapper = mount(DatePickerField, {
      props: { modelValue: null },
    });

    const input = wrapper.get('[data-testid="dp"]');
    await input.setValue("");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([""]);
  });
});
