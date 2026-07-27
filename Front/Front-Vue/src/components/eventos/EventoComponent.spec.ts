import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import EventoComponent from "./EventoComponent.vue";
import TituloComponent from "../../shared/TituloComponent.vue";

async function mountEventoAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/eventos",
        component: EventoComponent,
        children: [
          {
            path: "lista",
            name: "lista",
            component: { template: "<div />" },
          },
          {
            path: "detalhes/:id?",
            name: "detalhe",
            component: { template: "<div />" },
          },
          {
            path: "other",
            name: "other",
            component: { template: "<div />" },
          },
        ],
      },
    ],
  });
  await router.push(path);
  await router.isReady();
  return mount(EventoComponent, { global: { plugins: [router] } });
}

describe("EventoComponent", () => {
  it("shows lista title props for lista route", async () => {
    const wrapper = await mountEventoAt("/eventos/lista");
    await wrapper.vm.$nextTick();

    const titulo = wrapper.findComponent(TituloComponent);
    expect(titulo.props("subtitulo")).toBe("Lista de Eventos");
    expect(titulo.props("botaoListar")).toBe(true);
  });

  it("shows detalhe title props for detalhe route", async () => {
    const wrapper = await mountEventoAt("/eventos/detalhes/1");
    await wrapper.vm.$nextTick();

    const titulo = wrapper.findComponent(TituloComponent);
    expect(titulo.props("subtitulo")).toBe("Detalhes do Evento");
  });

  it("uses default title for unknown route name", async () => {
    const wrapper = await mountEventoAt("/eventos/other");
    await wrapper.vm.$nextTick();

    const titulo = wrapper.findComponent(TituloComponent);
    expect(titulo.props("subtitulo")).toBe("");
    expect(titulo.props("titulo")).toBe("");
  });
});
