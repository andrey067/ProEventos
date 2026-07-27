<template>
  <VueDatePicker
    :model-value="modelValue || null"
    model-type="yyyy-MM-dd"
    :formats="{ input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }"
    :locale="ptBR"
    auto-apply
    :time-picker="false"
    :teleport="true"
    :input-attrs="{ clearable: false }"
    placeholder="Selecione a data"
    @update:model-value="emit('update:modelValue', $event ?? '')"
  >
    <template #input-icon>
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="text-muted"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </template>
  </VueDatePicker>
</template>

<script setup lang="ts">
import { VueDatePicker } from "@vuepic/vue-datepicker";
import { ptBR } from "date-fns/locale";
import "@vuepic/vue-datepicker/dist/main.css";

defineProps<{
  modelValue?: string | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<style scoped>
:deep(.dp--input-wrap) {
  width: 100%;
}

:deep(.dp--input) {
  border-radius: var(--radius-control);
  border-color: var(--color-line, #e2e8f0);
  background: var(--color-panel, #fff);
  font-size: 0.875rem;
  padding-block: 0.5rem;
  padding-inline: 0.75rem 2.25rem;
}

:deep(.dp--input-icon-pad) {
  padding-inline-start: 0.75rem;
  padding-inline-end: 2.25rem;
}

:deep(.dp--input:focus),
:deep(.dp--input:hover) {
  border-color: var(--color-accent, #0d9488);
}

:deep(.dp--input-icon) {
  inset-inline-start: auto;
  inset-inline-end: 0.5rem;
  color: var(--color-muted, #64748b);
}
</style>
