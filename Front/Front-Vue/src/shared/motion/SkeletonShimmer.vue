<template>
  <div class="flex flex-col gap-3" aria-hidden="true">
    <div
      v-for="i in rows"
      :key="i"
      :class="
        reduced
          ? 'h-10 rounded-[length:var(--radius-control)] bg-line'
          : 'motion-skeleton h-10 rounded-[length:var(--radius-control)]'
      "
    />
  </div>
</template>

<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

withDefaults(defineProps<{ rows?: number }>(), { rows: 4 });
const reduced = usePrefersReducedMotion();
</script>
