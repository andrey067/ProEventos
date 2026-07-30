<template>
  <header class="sticky top-0 z-10 border-b border-line bg-panel">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
      <router-link
        to="/eventos/lista"
        class="text-xl font-semibold text-accent-dark"
        @click="closeMenu"
      >
        ProEventos Vue
      </router-link>

      <button
        type="button"
        class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] p-2 text-muted transition-colors hover:bg-accent-soft hover:text-accent-dark md:hidden"
        :aria-expanded="menuOpen"
        aria-controls="mobile-nav"
        aria-label="Menu"
        @click="toggleMenu"
      >
        <svg
          v-if="menuOpen"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-6"
          aria-hidden="true"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-6"
          aria-hidden="true"
        >
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>

      <nav class="hidden flex-wrap gap-1 md:flex">
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

    <nav
      v-if="menuOpen"
      id="mobile-nav"
      class="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden"
    >
      <router-link
        v-for="link in links"
        :key="`mobile-${link.key}`"
        :to="link.to"
        class="min-h-11 rounded-[length:var(--radius-control)] px-4 py-3 text-sm font-medium transition-colors"
        :class="
          isActive(link.name)
            ? 'bg-accent-soft text-accent-dark'
            : 'text-muted hover:bg-accent-soft hover:text-accent-dark'
        "
        @click="closeMenu"
      >
        {{ link.label }}
      </router-link>
      <button
        v-if="authenticated"
        type="button"
        class="min-h-11 rounded-[length:var(--radius-control)] px-4 py-3 text-left text-sm font-medium text-muted transition-colors hover:bg-accent-soft hover:text-accent-dark"
        @click="logoutFromMobile"
      >
        Sair
      </button>
    </nav>
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
const menuOpen = ref(false);

watch(
  () => route.fullPath,
  () => {
    authenticated.value = isAuthenticated();
    menuOpen.value = false;
  },
);

const links = computed(() => {
  const base = [
    { key: "eventos", to: "/eventos/lista", name: "lista", label: "Eventos" },
    {
      key: "palestrantes",
      to: "/palestrantes/lista",
      name: "palestrantes-lista",
      label: "Palestrantes",
    },
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
  if (name === "palestrantes-lista") {
    return (
      route.name === "palestrantes-lista" || route.name === "palestrante-detalhe"
    );
  }
  if (name === "perfil") {
    return route.name === "perfil" || route.name === "senha";
  }
  return route.name === name;
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

async function logout() {
  accountService.logout();
  authenticated.value = false;
  closeMenu();
  await router.push({ name: "login" });
}

async function logoutFromMobile() {
  await logout();
}
</script>
