<template>
  <Transition :name="reduced ? undefined : 'motion-modal-backdrop'">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="presentation"
      @click="$emit('cancel')"
    >
      <Transition appear :name="reduced ? undefined : 'motion-modal-panel'">
        <div @click.stop>
          <slot />
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

defineProps<{ open: boolean }>();
defineEmits<{ cancel: [] }>();
const reduced = usePrefersReducedMotion();
</script>
