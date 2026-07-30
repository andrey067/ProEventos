<template>
  <Transition :name="reduced ? undefined : 'motion-alert'">
    <div v-if="show" :class="className"><slot /></div>
  </Transition>
</template>

<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

defineProps<{ show: boolean; className?: string }>();
const reduced = usePrefersReducedMotion();
</script>
