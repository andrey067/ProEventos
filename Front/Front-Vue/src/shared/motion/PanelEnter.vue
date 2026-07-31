<template>
  <div v-if="reduced" :class="className" v-bind="$attrs"><slot /></div>
  <Transition v-else appear name="motion-panel">
    <div :class="className" v-bind="$attrs"><slot /></div>
  </Transition>
</template>

<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

defineOptions({ inheritAttrs: false });

defineProps<{ className?: string }>();
const reduced = usePrefersReducedMotion();
</script>
