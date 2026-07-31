<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import type { Palestrante } from "../../Models/Palestrante";
import { canWrite, isAuthenticated } from "../../services/authToken";
import palestranteService from "../../services/palestranteService";
import ConfirmDialog from "../../shared/ConfirmDialog.vue";
import LoadingSpinner from "../common/LoadingSpinner.vue";
import PageEnter from "../../shared/motion/PageEnter.vue";
import AlertMotion from "../../shared/motion/AlertMotion.vue";
import ListStagger from "../../shared/motion/ListStagger.vue";
import SkeletonShimmer from "../../shared/motion/SkeletonShimmer.vue";
import EmptyState from "../../shared/motion/EmptyState.vue";
import { debounce } from "../../utils/debounce";
import { isRemoteImageUrl } from "../../utils/imageUrl";
import { PAGE_SIZES, type PageSize } from "../../Models/pagination";

const SEARCH_DEBOUNCE_MS = 350;

const router = useRouter();
const items = ref<Palestrante[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const pendingDelete = ref<Palestrante | null>(null);
const filterQ = ref("");
const page = ref(1);
const pageSize = ref<PageSize>(10);
const totalPages = ref(0);
const writeAllowed = computed(() => canWrite());
const isLoggedIn = computed(() => isAuthenticated());
let listRequestId = 0;

const paged = computed(() => ({
  items: items.value,
  page: page.value,
  pageSize: pageSize.value,
  totalPages: totalPages.value,
}));

const deleteMessage = computed(() =>
  pendingDelete.value
    ? `Deseja deletar "${pendingDelete.value.nome}"?`
    : "",
);

const debouncedSearch = debounce(() => {
  void load({ resetPage: true });
}, SEARCH_DEBOUNCE_MS);

watch(
  filterQ,
  () => {
    debouncedSearch();
  },
  { flush: "sync" },
);

async function load(opts?: { keepPage?: boolean; resetPage?: boolean }) {
  debouncedSearch.cancel();
  loading.value = true;
  error.value = null;
  if (opts?.resetPage || !opts?.keepPage) page.value = 1;
  const requestId = ++listRequestId;
  try {
    const { data } = await palestranteService.list({
      page: page.value,
      pageSize: pageSize.value,
      q: filterQ.value.trim() || undefined,
    });
    if (requestId !== listRequestId) return;
    items.value = data.items;
    page.value = data.page;
    totalPages.value = data.totalPages;
  } catch {
    if (requestId !== listRequestId) return;
    error.value = "Não foi possível carregar palestrantes.";
  } finally {
    if (requestId === listRequestId) loading.value = false;
  }
}

function goToPage(next: number) {
  page.value = next;
  void load({ keepPage: true });
}

function onPageSizeChange() {
  page.value = 1;
  void load({ keepPage: true });
}

function buscar() {
  debouncedSearch.cancel();
  void load({ resetPage: true });
}

function limparFiltro() {
  filterQ.value = "";
  debouncedSearch.cancel();
  void load({ resetPage: true });
}

function goToCreate() {
  if (!writeAllowed.value) return;
  void router.push({ name: "palestrante-detalhe" });
}

function pedirRemover(row: Palestrante) {
  if (!writeAllowed.value) return;
  pendingDelete.value = row;
}

async function confirmRemove() {
  const row = pendingDelete.value;
  pendingDelete.value = null;
  if (!row) return;
  success.value = null;
  error.value = null;
  try {
    await palestranteService.remove(row.id);
    await load({ resetPage: true });
    success.value = "Palestrante excluído.";
  } catch {
    error.value = "Erro ao excluir palestrante.";
  }
}

function onThumbError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
}

onMounted(() => load());

onUnmounted(() => {
  debouncedSearch.cancel();
});
</script>

<template>
  <PageEnter>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Palestrantes</h1>
        <p class="mt-1 text-sm text-muted">
          Lista, busca e gerenciamento básico.
        </p>
      </div>
      <button
        v-if="writeAllowed"
        type="button"
        class="motion-press inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98]"
        @click="goToCreate"
      >
        Novo palestrante
      </button>
    </div>

    <p
      v-if="!writeAllowed"
      class="rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted"
      data-testid="readonly-message"
    >
      <template v-if="isLoggedIn">
        Perfil somente leitura — você pode consultar, mas não criar ou editar.
      </template>
      <template v-else>
        Faça login com perfil organizador para cadastrar ou editar palestrantes.
      </template>
    </p>

    <form
      class="flex flex-wrap items-end gap-3 rounded-[length:var(--radius-control)] border border-line bg-panel p-4"
      @submit.prevent="buscar"
    >
      <label class="flex w-full min-w-0 flex-1 flex-col gap-2 text-sm">
        <span class="font-medium">Buscar</span>
        <input
          v-model="filterQ"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Digite para buscar"
        />
      </label>
      <button
        type="submit"
        class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
      >
        Buscar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink hover:bg-surface"
        @click="limparFiltro"
      >
        Limpar
      </button>
    </form>

    <AlertMotion
      :show="!!success"
      class="rounded-[length:var(--radius-control)] border border-line bg-accent-soft px-4 py-3 text-sm text-accent-dark"
    >
      {{ success }}
    </AlertMotion>

    <AlertMotion
      :show="!!error"
      class="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </AlertMotion>

    <LoadingSpinner :active="loading" variant="page" />

    <SkeletonShimmer v-if="loading" :rows="5" class="p-4" />

    <template v-if="!loading && items.length > 0">
      <div class="overflow-x-auto rounded-[length:var(--radius-control)] border border-line bg-panel">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-line bg-surface text-left text-muted">
              <th class="px-4 py-3 font-medium">Foto</th>
              <th class="px-4 py-3 font-medium">Nome</th>
              <th class="px-4 py-3 font-medium">E-mail</th>
              <th class="px-4 py-3 font-medium">Telefone</th>
              <th class="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <ListStagger
            tag="tbody"
            class="divide-y divide-line"
            :items-length="paged.items.length"
          >
            <tr
              v-for="(row, index) in paged.items"
              :key="row.id"
              class="hover:bg-surface"
              :style="{ '--motion-stagger-index': index }"
            >
              <td class="px-4 py-3">
                <img
                  v-if="isRemoteImageUrl(row.imagemURL)"
                  :src="row.imagemURL"
                  alt=""
                  class="h-10 w-10 rounded object-cover"
                  @error="onThumbError"
                />
                <span
                  v-else
                  class="text-xs text-muted"
                >—</span>
              </td>
              <td class="px-4 py-3 break-words font-medium">{{ row.nome }}</td>
              <td class="px-4 py-3">{{ row.email }}</td>
              <td class="px-4 py-3">{{ row.telefone }}</td>
              <td class="px-4 py-3">
                <div
                  v-if="writeAllowed"
                  class="flex flex-wrap gap-2"
                >
                  <router-link
                    :to="`/palestrantes/detalhes/${row.id}`"
                    class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft"
                  >
                    Editar
                  </router-link>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-danger-border bg-panel px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft"
                    @click="pedirRemover(row)"
                  >
                    Excluir
                  </button>
                </div>
                <span
                  v-else
                  class="text-xs text-muted"
                >—</span>
              </td>
            </tr>
          </ListStagger>
        </table>
      </div>

      <div
        v-if="paged.totalPages > 0"
        class="flex flex-wrap items-center justify-between gap-3"
      >
        <label class="flex items-center gap-2 text-sm">
          <span class="font-medium text-muted">Itens por página</span>
          <select
            v-model.number="pageSize"
            class="rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            @change="onPageSizeChange"
          >
            <option
              v-for="size in PAGE_SIZES"
              :key="size"
              :value="size"
            >
              {{ size }}
            </option>
          </select>
        </label>
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink hover:bg-surface disabled:opacity-60"
            :disabled="paged.page <= 1"
            @click="goToPage(paged.page - 1)"
          >
            Anterior
          </button>
          <span class="text-sm text-muted">
            Página {{ paged.page }} de {{ paged.totalPages }}
          </span>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink hover:bg-surface disabled:opacity-60"
            :disabled="paged.page >= paged.totalPages"
            @click="goToPage(paged.page + 1)"
          >
            Próxima
          </button>
        </div>
      </div>
    </template>

    <EmptyState
      :show="!loading && items.length === 0"
      class="rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-8 text-center text-sm text-muted"
    >
      Nenhum palestrante cadastrado.
    </EmptyState>

    <ConfirmDialog
      :open="pendingDelete !== null"
      title="Excluir palestrante"
      :message="deleteMessage"
      confirm-label="Excluir"
      @confirm="confirmRemove"
      @cancel="pendingDelete = null"
    />
  </div>
  </PageEnter>
</template>
