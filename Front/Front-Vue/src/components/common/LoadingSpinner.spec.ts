import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import LoadingSpinner from "./LoadingSpinner.vue";

describe("LoadingSpinner", () => {
  it("renders button variant", () => {
    const wrapper = mount(LoadingSpinner, {
      props: { active: true, variant: "button" },
    });
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true);
  });

  it("renders inline variant with label", () => {
    const wrapper = mount(LoadingSpinner, {
      props: { active: true, variant: "inline", label: "Aguarde" },
    });
    expect(wrapper.text()).toContain("Aguarde");
    expect(wrapper.classes()).toContain("py-4");
  });

  it("renders page variant", () => {
    const wrapper = mount(LoadingSpinner, {
      props: { active: true, variant: "page" },
    });
    expect(wrapper.classes()).toContain("py-12");
  });

  it("renders nothing when inactive for non-button variants", () => {
    const wrapper = mount(LoadingSpinner, {
      props: { active: false, variant: "page" },
    });
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(false);
  });
});
