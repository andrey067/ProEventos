import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import ModalMotion from "./ModalMotion.vue";

function stubMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe("ModalMotion", () => {
  it("renders nothing when closed", () => {
    stubMotion(false);
    const w = mount(ModalMotion, {
      props: { open: false },
      slots: { default: "<p>modal</p>" },
    });
    expect(w.text()).not.toContain("modal");
  });

  it("renders children and emits cancel on backdrop click", async () => {
    stubMotion(false);
    const w = mount(ModalMotion, {
      props: { open: true },
      slots: { default: "<p>modal</p>" },
    });
    expect(w.text()).toContain("modal");
    await w.find('[role="presentation"]').trigger("click");
    expect(w.emitted("cancel")).toBeTruthy();
  });

  it("renders under reduced motion", () => {
    stubMotion(true);
    const w = mount(ModalMotion, {
      props: { open: true },
      slots: { default: "<p>modal</p>" },
    });
    expect(w.text()).toContain("modal");
  });
});
