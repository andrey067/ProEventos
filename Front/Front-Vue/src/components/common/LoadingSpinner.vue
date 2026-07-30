<script setup lang="ts">
import Loading from "vue-loading-overlay";
import "vue-loading-overlay/dist/css/index.css";

withDefaults(
  defineProps<{
    active: boolean;
    variant?: "page" | "inline" | "button";
    label?: string;
  }>(),
  {
    variant: "page",
    label: "Carregando...",
  },
);
</script>

<template>
  <Loading
    v-if="variant === 'button'"
    :active="active"
    :can-cancel="false"
    :is-full-page="false"
    :width="18"
    :height="18"
    loader="spinner"
    :opacity="0"
    color="#6366f1"
    data-testid="loading-spinner"
    aria-busy="true"
  />
  <div
    v-else-if="active"
    :class="variant === 'inline' ? 'py-4' : 'py-12'"
    aria-busy="true"
    data-testid="loading-spinner"
  >
    <Loading
      :active="true"
      :can-cancel="false"
      :is-full-page="false"
      loader="spinner"
      :opacity="0.15"
      color="#6366f1"
    />
    <span class="sr-only">{{ label }}</span>
  </div>
</template>
