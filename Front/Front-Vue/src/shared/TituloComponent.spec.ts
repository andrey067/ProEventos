import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import TituloComponent from "./TituloComponent.vue";

async function mountTitulo(props: Record<string, unknown>) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/", component: { template: "<div />" } }],
  });
  await router.push("/");
  await router.isReady();
  return mount(TituloComponent, {
    global: { plugins: [router] },
    props,
  });
}

describe("TituloComponent", () => {
  it("renders title block when mostrarTitulo is true", async () => {
    const wrapper = await mountTitulo({
      titulo: "Evento",
      subtitulo: "Lista de Eventos",
      mostrarTitulo: true,
      botaoListar: true,
    });

    expect(wrapper.text()).toContain("Evento");
    expect(wrapper.text()).toContain("Lista de Eventos");
    expect(wrapper.find('a[href="/Evento/lista"]').exists()).toBe(true);
  });

  it("hides title block when mostrarTitulo is false", async () => {
    const wrapper = await mountTitulo({
      mostrarTitulo: false,
      botaoListar: true,
    });

    expect(wrapper.find("h2").exists()).toBe(false);
  });

  it("hides list button when botaoListar is false", async () => {
    const wrapper = await mountTitulo({
      mostrarTitulo: true,
      botaoListar: false,
      titulo: "Evento",
    });

    expect(wrapper.find("a").exists()).toBe(false);
  });
});
