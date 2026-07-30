<template>
  <div class="flex min-h-[100dvh] flex-col bg-surface font-sans text-ink">
    <MenuComponent />
    <div class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:py-8">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import MenuComponent from "./shared/MenuComponent.vue";
</script>
