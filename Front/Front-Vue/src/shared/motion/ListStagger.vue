<template>
  <TransitionGroup
    v-if="!reduced && itemsLength > 0"
    name="motion-list"
    :tag="tag"
    :class="className"
  >
    <slot />
  </TransitionGroup>
  <component :is="tag" v-else :class="className"><slot /></component>
</template>

<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

withDefaults(
  defineProps<{
    itemsLength: number;
    className?: string;
    tag?: string;
  }>(),
  { tag: "div" },
);
const reduced = usePrefersReducedMotion();
</script>
