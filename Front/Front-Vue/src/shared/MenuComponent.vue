<template>
  <header class="sticky top-0 z-10 border-b border-line bg-panel">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
      <router-link
        to="/eventos/lista"
        class="text-xl font-semibold text-accent-dark"
      >
        ProEventos Vue
      </router-link>
      <nav class="flex flex-wrap gap-1">
        <router-link
          v-for="link in links"
          :key="link.key"
          :to="link.to"
          class="rounded-[length:var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors"
          :class="
            isActive(link.name)
              ? 'bg-accent-soft text-accent-dark'
              : 'text-muted hover:bg-accent-soft hover:text-accent-dark'
          "
        >
          {{ link.label }}
        </router-link>
        <button
          v-if="authenticated"
          type="button"
          class="rounded-[length:var(--radius-control)] px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent-soft hover:text-accent-dark"
          @click="logout"
        >
          Sair
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { isAuthenticated } from "../services/authToken";
import accountService from "../services/accountService";

const route = useRoute();
const router = useRouter();
const authenticated = ref(isAuthenticated());

watch(
  () => route.fullPath,
  () => {
    authenticated.value = isAuthenticated();
  },
);

const links = computed(() => {
  const base = [
    { key: "eventos", to: "/eventos/lista", name: "lista", label: "Eventos" },
    { key: "palestrantes", to: "/palestrantes", name: "palestrantes", label: "Palestrantes" },
  ];

  if (authenticated.value) {
    return [
      ...base,
      { key: "perfil", to: "/user/perfil", name: "perfil", label: "Perfil" },
    ];
  }

  return [
    ...base,
    { key: "login", to: "/user/login", name: "login", label: "Login" },
  ];
});

function isActive(name: string) {
  if (name === "lista") {
    return route.name === "lista" || route.name === "detalhe";
  }
  if (name === "perfil") {
    return route.name === "perfil" || route.name === "senha";
  }
  return route.name === name;
}

async function logout() {
  accountService.logout();
  authenticated.value = false;
  await router.push({ name: "login" });
}
</script>
