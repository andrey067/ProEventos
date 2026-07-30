<template>
  <input
    ref="inputRef"
    type="text"
    :placeholder="placeholder"
    class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
  />
</template>

<script setup lang="ts">
import { watch } from "vue";
import { CurrencyDisplay, useCurrencyInput } from "vue-currency-input";

const model = defineModel<number | null>({ default: null });

withDefaults(
  defineProps<{
    placeholder?: string;
  }>(),
  {
    placeholder: "R$ 0,00",
  },
);

const { inputRef, setValue } = useCurrencyInput({
  currency: "BRL",
  locale: "pt-BR",
  currencyDisplay: CurrencyDisplay.symbol,
  precision: 2,
  valueRange: { min: 0.01 },
  hideCurrencySymbolOnFocus: false,
  hideGroupingSeparatorOnFocus: false,
});

watch(
  model,
  (value) => {
    setValue(value ?? null);
  },
  { immediate: true },
);
</script>
