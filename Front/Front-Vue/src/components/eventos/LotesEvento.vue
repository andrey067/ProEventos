<template>
  <div
    class="mt-3 rounded-[length:var(--radius-control)] border border-line bg-panel p-4"
  >
    <h2 class="mb-3 text-lg font-medium text-accent-dark">Lote</h2>
    <div class="grid gap-3 md:grid-cols-2">
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Nome</span>
        <input
          :value="nome"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm"
          readonly
        />
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Preço</span>
        <input
          :value="preco"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm"
          readonly
        />
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Quantidade</span>
        <input
          :value="quantidade"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm"
          readonly
        />
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Data início</span>
        <input
          :value="formattedDataInicio"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm"
          readonly
        />
      </label>
      <label class="flex flex-col gap-2 text-sm md:col-span-2">
        <span class="font-medium">Data fim</span>
        <input
          :value="formattedDataFim"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm"
          readonly
        />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatDateBr } from "../../utils/date";

const props = withDefaults(
  defineProps<{
    id?: number;
    nome?: string;
    preco?: number;
    dataInicio?: string | Date;
    dataFim?: string | Date;
    quantidade?: number;
    eventoId?: number;
  }>(),
  {
    dataInicio: () => new Date(),
  },
);

const formattedDataInicio = computed(() => formatDateBr(props.dataInicio));
const formattedDataFim = computed(() => formatDateBr(props.dataFim));
</script>
