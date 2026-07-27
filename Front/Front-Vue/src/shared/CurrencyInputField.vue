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

const props = withDefaults(
  defineProps<{
    modelValue?: number | null;
    placeholder?: string;
  }>(),
  {
    modelValue: null,
    placeholder: "R$ 0,00",
  },
);

defineEmits<{
  "update:modelValue": [value: number | null];
}>();

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
  () => props.modelValue,
  (value) => {
    setValue(value ?? null);
  },
  { immediate: true },
);
</script>
