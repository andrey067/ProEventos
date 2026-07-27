<template>
  <TituloComponent
    :titulo="dadosTitulo?.titulo"
    :subtitulo="dadosTitulo?.subtitulo"
    :botaolistar="dadosTitulo?.botaolistar"
    :mostrarTitulo="dadosTitulo?.mostrarTitulo"
  />
  <router-view />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Titulo } from "../../interfaces/Titulo";
import TituloComponent from "../../shared/TituloComponent.vue";

const route = useRoute();
const dadosTitulo = ref<Titulo>();

watch(
  () => route.name,
  (name) => {
    dadosTitulo.value = titlePros(name?.toString());
  },
  { immediate: true },
);

function titlePros(routername?: string): Titulo {
  switch (routername) {
    case "lista":
      return {
        iconClass: "",
        subtitulo: "Lista de Eventos",
        titulo: "Evento",
        router: "evento",
        botaolistar: true,
        mostrarTitulo: false,
      };
    case "detalhe":
      return {
        iconClass: "",
        subtitulo: "Detalhes do Evento",
        titulo: "Evento",
        router: "evento",
        botaolistar: true,
        mostrarTitulo: false,
      };
    default:
      return {
        iconClass: "",
        subtitulo: "",
        titulo: "",
        router: "evento",
        botaolistar: false,
        mostrarTitulo: false,
      };
  }
}
</script>
