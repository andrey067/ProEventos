import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import LotesEvento from "./LotesEvento.vue";

describe("LotesEvento", () => {
  it("renders lote props as readonly inputs", () => {
    const wrapper = mount(LotesEvento, {
      props: {
        id: 1,
        nome: "VIP",
        preco: 150,
        quantidade: 20,
        eventoId: 5,
        dataInicio: "2026-01-01",
        dataFim: "2026-02-01",
      },
    });

    const inputs = wrapper.findAll("input");
    expect(inputs[0].element.value).toBe("VIP");
    expect(inputs[1].element.value).toBe("150");
    expect(inputs[2].element.value).toBe("20");
    expect(inputs[3].element.value).toBe("01/01/2026");
    expect(inputs[4].element.value).toBe("01/02/2026");
    expect(wrapper.text()).toContain("Lote");
    expect(wrapper.text()).toContain("Data início");
    expect(wrapper.text()).toContain("Data fim");
  });

  it("uses default dataInicio when not provided", () => {
    const wrapper = mount(LotesEvento, {
      props: {
        nome: "Padrão",
        quantidade: 10,
        preco: 50,
      },
    });
    expect(wrapper.props("dataInicio")).toBeInstanceOf(Date);
  });
});
