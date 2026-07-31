<template>
  <ModalMotion :open="open" @cancel="emit('cancel')">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      class="w-full max-w-md rounded-[length:var(--radius-control)] border border-line bg-panel p-6 shadow-lg"
    >
      <h2
        id="confirm-dialog-title"
        class="text-lg font-semibold tracking-tight text-ink"
      >
        {{ title }}
      </h2>
      <p
        id="confirm-dialog-message"
        class="mt-2 text-sm text-muted"
      >
        {{ message }}
      </p>
      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          class="motion-press inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          class="motion-press inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </ModalMotion>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import ModalMotion from "./motion/ModalMotion.vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
  }>(),
  {
    title: "Confirmar",
    confirmLabel: "Confirmar",
    cancelLabel: "Cancelar",
  },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape" && props.open) emit("cancel");
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) window.addEventListener("keydown", onKeyDown);
    else window.removeEventListener("keydown", onKeyDown);
  },
);

onMounted(() => {
  if (props.open) window.addEventListener("keydown", onKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeyDown);
});
</script>
