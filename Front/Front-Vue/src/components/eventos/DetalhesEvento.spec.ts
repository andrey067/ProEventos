import { describe, it, expect } from "vitest";
import { shallowMount } from "@vue/test-utils";
import DetalhesEvento from "./DetalhesEvento.vue";
import FormularioEvento from "./FormularioEvento.vue";

describe("DetalhesEvento", () => {
  it("renders FormularioEvento", () => {
    const wrapper = shallowMount(DetalhesEvento);
    expect(wrapper.findComponent(FormularioEvento).exists()).toBe(true);
  });
});
