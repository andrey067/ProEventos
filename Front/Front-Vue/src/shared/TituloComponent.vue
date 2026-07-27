<template>
  <div
    v-if="mostrarTitulo"
    class="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[length:var(--radius-control)] border border-line bg-panel p-4"
  >
    <div>
      <h2 class="text-xl font-semibold text-accent-dark">{{ titulo }}</h2>
      <p class="text-sm text-muted">{{ subtitulo }}</p>
    </div>
    <router-link
      v-if="botaoListar"
      class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-3 py-2 text-sm font-medium text-accent-dark hover:bg-accent-soft"
      :to="`/${titulo}/lista`"
    >
      Listar {{ titulo }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
defineProps({
  titulo: {
    type: String,
    default: "Evento",
  },
  subtitulo: {
    type: String,
    default: "Lista de Evento",
  },
  iconClass: {
    type: String,
    default: "",
  },
  botaoListar: {
    type: Boolean,
    default: true,
  },
  router: {
    type: String,
    default: "evento",
  },
  mostrarTitulo: {
    type: Boolean,
    default: true,
  },
});
</script>
