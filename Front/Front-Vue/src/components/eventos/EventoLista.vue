<template>
  <PageEnter>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Eventos</h1>
        <p class="mt-1 text-sm text-muted">
          Lista, busca e gerenciamento básico.
        </p>
      </div>
      <button
        v-if="writeAllowed"
        type="button"
        class="motion-press inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98]"
        @click="router.push('/eventos/detalhes')"
      >
        Novo evento
      </button>
    </div>

    <p
      v-if="!writeAllowed && isLoggedIn"
      class="rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted"
      data-testid="readonly-message"
    >
      Perfil somente leitura — você pode consultar, mas não criar ou editar.
    </p>

    <form
      class="flex flex-wrap items-end gap-3 rounded-[length:var(--radius-control)] border border-line bg-panel p-4"
      @submit.prevent="buscar"
    >
      <label class="flex w-full min-w-0 flex-1 flex-col gap-2 text-sm">
        <span class="font-medium text-ink">Buscar</span>
        <input
          v-model="q"
          v-bind="qAttrs"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Digite para buscar"
        />
      </label>
      <button
        type="submit"
        class="motion-press inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98]"
      >
        Buscar
      </button>
      <button
        type="button"
        class="motion-press inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface"
        @click="limpar"
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

    <template v-if="!loading && eventos.length > 0">
      <div class="overflow-x-auto rounded-[length:var(--radius-control)] border border-line bg-panel">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-line bg-surface text-left text-muted">
              <th class="px-4 py-3 font-medium">
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded p-1 text-muted hover:bg-surface hover:text-ink"
                  :title="showImages ? 'Ocultar' : 'Mostrar'"
                  :aria-label="showImages ? 'Ocultar' : 'Mostrar'"
                  @click="showImages = !showImages"
                >
                  <svg
                    v-if="showImages"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                    />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    <line
                      x1="1"
                      y1="1"
                      x2="23"
                      y2="23"
                    />
                  </svg>
                </button>
              </th>
              <th class="px-4 py-3 font-medium">Tema</th>
              <th class="px-4 py-3 font-medium">Local</th>
              <th class="px-4 py-3 font-medium">Data</th>
              <th class="px-4 py-3 font-medium">Qtd</th>
              <th class="px-4 py-3 font-medium">1º lote</th>
              <th class="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <ListStagger
            tag="tbody"
            class="divide-y divide-line"
            :items-length="paged.items.length"
          >
            <tr
              v-for="(evento, index) in paged.items"
              :key="evento.id"
              class="hover:bg-surface"
              :style="{ '--motion-stagger-index': index }"
            >
              <td class="px-4 py-3">
                <img
                  v-if="showImages && evento.imagemURL"
                  :src="evento.imagemURL"
                  alt=""
                  class="h-10 w-10 rounded object-cover"
                  @error="onImageError"
                />
              </td>
              <td class="px-4 py-3 break-words">
                <router-link
                  :to="`/eventos/detalhes/${evento.id}`"
                  class="font-medium text-accent-dark hover:underline"
                >
                  {{ evento.tema }}
                </router-link>
              </td>
              <td class="px-4 py-3">{{ evento.local }}</td>
              <td class="px-4 py-3">{{ formatDateBr(evento.dataEvento) }}</td>
              <td class="px-4 py-3">{{ evento.qtdPessoas }}</td>
              <td class="px-4 py-3">{{ primeiroLoteNome(evento) }}</td>
              <td class="px-4 py-3">
                <div
                  v-if="writeAllowed"
                  class="flex flex-wrap gap-2"
                >
                  <router-link
                    :to="`/eventos/detalhes/${evento.id}`"
                    class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft"
                  >
                    Editar
                  </router-link>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-danger-border bg-panel px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft"
                    @click="pedirDeletarEvento($event, evento)"
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
            class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
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
            class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="paged.page >= paged.totalPages"
            @click="goToPage(paged.page + 1)"
          >
            Próxima
          </button>
        </div>
      </div>
    </template>

    <EmptyState
      :show="!loading && eventos.length === 0"
      class="rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-8 text-center text-sm text-muted"
    >
      Nenhum evento encontrado.
    </EmptyState>

    <ConfirmDialog
      :open="pendingDelete !== null"
      title="Excluir evento"
      :message="deleteMessage"
      confirm-label="Excluir"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />
  </div>
  </PageEnter>
</template>

<script setup lang="ts">
import { Evento } from "../../Models/Evento";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useForm } from "vee-validate";
import {
  defaultEventoSearchValues,
  eventoSearchSchema,
} from "../../forms/schemas";
import { toTypedSchema } from "../../forms/toTyped";
import { canWrite, isAuthenticated } from "../../services/authToken";
import eventoService from "../../services/eventoService";
import { useRouter } from "vue-router";
import ConfirmDialog from "../../shared/ConfirmDialog.vue";
import LoadingSpinner from "../common/LoadingSpinner.vue";
import PageEnter from "../../shared/motion/PageEnter.vue";
import AlertMotion from "../../shared/motion/AlertMotion.vue";
import ListStagger from "../../shared/motion/ListStagger.vue";
import SkeletonShimmer from "../../shared/motion/SkeletonShimmer.vue";
import EmptyState from "../../shared/motion/EmptyState.vue";
import { formatDateBr } from "../../utils/date";
import { debounce } from "../../utils/debounce";
import { PAGE_SIZES, type PageSize } from "../../Models/pagination";

const SEARCH_DEBOUNCE_MS = 350;

const eventos = ref<Evento[]>([]);
const page = ref(1);
const pageSize = ref<PageSize>(10);
const totalPages = ref(0);
const showImages = ref(true);
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const pendingDelete = ref<Evento | null>(null);
const router = useRouter();
const writeAllowed = computed(() => canWrite());
const isLoggedIn = computed(() => isAuthenticated());
let listRequestId = 0;

const { defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(eventoSearchSchema),
  initialValues: defaultEventoSearchValues(),
});

const [q, qAttrs] = defineField("q");

const debouncedSearch = debounce(() => {
  getEventos({ resetPage: true });
}, SEARCH_DEBOUNCE_MS);

watch(
  q,
  () => {
    debouncedSearch();
  },
  { flush: "sync" },
);

const paged = computed(() => ({
  items: eventos.value,
  page: page.value,
  pageSize: pageSize.value,
  totalPages: totalPages.value,
}));
const deleteMessage = computed(() =>
  pendingDelete.value
    ? `Deseja deletar o evento "${pendingDelete.value.tema}"?`
    : "",
);

function primeiroLoteNome(evento: Evento): string {
  const nome = evento.lotes?.[0]?.nome?.trim();
  return nome || "—";
}

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
}

function onPageSizeChange() {
  page.value = 1;
  getEventos({ keepPage: true });
}

function pedirDeletarEvento(event: Event, evento: Evento) {
  if (!writeAllowed.value) return;
  event.stopPropagation();
  pendingDelete.value = evento;
}

async function confirmDelete() {
  const evento = pendingDelete.value;
  pendingDelete.value = null;
  if (!evento) return;
  success.value = null;
  const response = await deletar(evento);
  getEventos({ resetPage: true });
  if (response?.status === 200) {
    success.value = "Evento deletado com sucesso.";
    alert("Evento deletado com sucesso");
  } else {
    alert("Erro ao deletar o evento");
  }
}

function getEventos(options?: { keepPage?: boolean; resetPage?: boolean }): void {
  debouncedSearch.cancel();
  loading.value = true;
  error.value = null;
  if (options?.resetPage || !options?.keepPage) page.value = 1;

  const requestId = ++listRequestId;
  const searchTerm = (q.value ?? "").trim();
  eventoService
    .list({
      page: page.value,
      pageSize: pageSize.value,
      q: searchTerm || undefined,
    })
    .then((response) => {
      if (requestId !== listRequestId) return;
      const data = response.data;
      eventos.value = data.items;
      page.value = data.page;
      totalPages.value = data.totalPages;
    })
    .catch(() => {
      if (requestId !== listRequestId) return;
      error.value = "Erro ao carregar os eventos";
    })
    .finally(() => {
      if (requestId !== listRequestId) return;
      loading.value = false;
    });
}

function goToPage(next: number) {
  page.value = next;
  getEventos({ keepPage: true });
}

function buscar() {
  debouncedSearch.cancel();
  getEventos({ resetPage: true });
}

function limpar() {
  resetForm({ values: defaultEventoSearchValues() });
  debouncedSearch.cancel();
  getEventos({ resetPage: true });
}

async function deletar(evento: Evento): Promise<{ status: number } | undefined> {
  loading.value = true;
  try {
    return await eventoService.remove(evento.id);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  getEventos();
});

onUnmounted(() => {
  debouncedSearch.cancel();
});
</script>
