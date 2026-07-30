import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import ConfirmDialog from "./ConfirmDialog.vue";

describe("ConfirmDialog", () => {
  it("não renderiza quando fechado", () => {
    const wrapper = mount(ConfirmDialog, {
      props: { open: false, message: "Apagar?" },
    });
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it("emite confirm e cancel", async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        open: true,
        title: "Excluir",
        message: "Deseja deletar o item?",
        confirmLabel: "Excluir",
      },
    });

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Deseja deletar o item?");

    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("cancel")).toBeTruthy();

    const buttons = wrapper.findAll("button");
    await buttons[1].trigger("click");
    expect(wrapper.emitted("confirm")).toBeTruthy();
  });

  it("emits cancel on Escape and backdrop click", async () => {
    const wrapper = mount(ConfirmDialog, {
      props: {
        open: true,
        message: "Deseja deletar?",
      },
    });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(wrapper.emitted("cancel")).toBeTruthy();

    await wrapper.find('[role="presentation"]').trigger("click");
    expect(wrapper.emitted("cancel")?.length).toBeGreaterThan(1);
  });
});
