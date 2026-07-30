<template>
  <div v-if="reduced"><slot /></div>
  <Transition v-else appear name="motion-page">
    <div><slot /></div>
  </Transition>
</template>

<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const reduced = usePrefersReducedMotion();
</script>
