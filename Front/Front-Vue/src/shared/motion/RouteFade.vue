<template>
  <router-view v-slot="{ Component, route }">
    <Transition :name="reduced ? undefined : 'motion-fade'" mode="out-in">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </router-view>
</template>

<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const reduced = usePrefersReducedMotion();
</script>
