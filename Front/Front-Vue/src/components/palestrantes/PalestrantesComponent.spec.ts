import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import PalestrantesComponent from "./PalestrantesComponent.vue";

describe("PalestrantesComponent", () => {
  it("mounts without errors", () => {
    const wrapper = mount(PalestrantesComponent);
    expect(wrapper.exists()).toBe(true);
  });
});
