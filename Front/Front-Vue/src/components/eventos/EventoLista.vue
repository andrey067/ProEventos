<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Eventos</h1>
        <p class="mt-1 text-sm text-muted">
          Lista, busca por tema e gerenciamento básico.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98]"
        @click="router.push('/eventos/detalhes')"
      >
        Novo evento
      </button>
    </div>

    <form
      class="flex flex-wrap items-end gap-3 rounded-[length:var(--radius-control)] border border-line bg-panel p-4"
      @submit.prevent="buscar"
    >
      <label class="flex min-w-60 flex-1 flex-col gap-2 text-sm">
        <span class="font-medium text-ink">Buscar por tema</span>
        <input
          v-model="tema"
          v-bind="temaAttrs"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          placeholder="Digite parte do tema"
        />
      </label>
      <button
        type="submit"
        class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98]"
      >
        Buscar
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface"
        @click="limpar"
      >
        Limpar
      </button>
    </form>

    <p
      v-if="error"
      class="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </p>

    <div
      v-if="loading"
      class="space-y-2"
      aria-busy="true"
    >
      <div class="h-10 animate-pulse rounded bg-line/60" />
      <div class="h-10 animate-pulse rounded bg-line/40" />
      <div class="h-10 animate-pulse rounded bg-line/60" />
    </div>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface"
          @click="showImages = !showImages"
        >
          {{ showImages ? "Ocultar imagens" : "Mostrar imagens" }}
        </button>
        <label class="flex items-center gap-2 text-sm">
          <span class="font-medium text-muted">Itens por página</span>
          <select
            v-model="pageSize"
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
      </div>

      <div class="overflow-hidden rounded-[length:var(--radius-control)] border border-line bg-panel">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-line bg-surface text-left text-muted">
              <th
                v-if="showImages"
                class="px-4 py-3 font-medium"
              >
                Imagem
              </th>
              <th class="px-4 py-3 font-medium">Tema</th>
              <th class="px-4 py-3 font-medium">Local</th>
              <th class="px-4 py-3 font-medium">Data</th>
              <th class="px-4 py-3 font-medium">Qtd</th>
              <th class="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line">
            <tr v-if="eventos.length === 0">
              <td
                :colspan="colSpan"
                class="px-4 py-8 text-center text-muted"
              >
                Nenhum evento encontrado.
              </td>
            </tr>
            <tr
              v-for="evento in paged.items"
              :key="evento.id"
              class="hover:bg-surface"
            >
              <td
                v-if="showImages"
                class="px-4 py-3"
              >
                <img
                  v-if="evento.imagemURL"
                  :src="evento.imagemURL"
                  alt=""
                  class="h-10 w-10 rounded object-cover"
                  @error="onImageError"
                />
              </td>
              <td class="px-4 py-3">
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
              <td class="px-4 py-3">
                <div class="flex flex-wrap gap-2">
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="paged.totalPages > 0"
        class="flex flex-wrap items-center justify-between gap-3"
      >
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="paged.page <= 1"
          @click="page = paged.page - 1"
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
          @click="page = paged.page + 1"
        >
          Próxima
        </button>
      </div>
    </template>

    <ConfirmDialog
      :open="pendingDelete !== null"
      title="Excluir evento"
      :message="deleteMessage"
      confirm-label="Excluir"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />
  </div>
</template>

<script setup lang="ts">
import { Evento } from "../../Models/Evento";
import { computed, onMounted, ref } from "vue";
import { useForm } from "vee-validate";
import {
  defaultEventoSearchValues,
  eventoSearchSchema,
} from "../../forms/schemas";
import { toTypedSchema } from "../../forms/toTyped";
import eventoService from "../../services/eventoService";
import { useRouter } from "vue-router";
import ConfirmDialog from "../../shared/ConfirmDialog.vue";
import { formatDateBr } from "../../utils/date";
import { PAGE_SIZES, paginate, type PageSize } from "../../utils/pagination";

const eventos = ref<Evento[]>([]);
const page = ref(1);
const pageSize = ref<PageSize>(10);
const showImages = ref(true);
const loading = ref(false);
const error = ref<string | null>(null);
const pendingDelete = ref<Evento | null>(null);
const router = useRouter();

const { defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(eventoSearchSchema),
  initialValues: defaultEventoSearchValues(),
});

const [tema, temaAttrs] = defineField("tema");

const paged = computed(() => paginate(eventos.value, page.value, pageSize.value));
const colSpan = computed(() => (showImages.value ? 6 : 5));

const deleteMessage = computed(() =>
  pendingDelete.value
    ? `Deseja deletar o evento "${pendingDelete.value.tema}"?`
    : "",
);

function onImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
}

function onPageSizeChange() {
  page.value = 1;
}

function pedirDeletarEvento(event: Event, evento: Evento) {
  event.stopPropagation();
  pendingDelete.value = evento;
}

async function confirmDelete() {
  const evento = pendingDelete.value;
  pendingDelete.value = null;
  if (!evento) return;
  const response = await deletar(evento);
  page.value = 1;
  getEventos(tema.value ?? "");
  if (response?.status === 200) {
    alert("Evento deletado com sucesso");
  } else {
    alert("Erro ao deletar o evento");
  }
}

function getEventos(searchTema?: string): void {
  loading.value = true;
  error.value = null;
  page.value = 1;
  const request =
    searchTema?.trim()
      ? eventoService.getByTema(searchTema.trim())
      : eventoService.list();

  request
    .then((response) => {
      eventos.value = response.data;
    })
    .catch(() => {
      error.value = "Erro ao carregar os eventos";
    })
    .finally(() => {
      loading.value = false;
    });
}

function buscar() {
  getEventos(tema.value ?? "");
}

function limpar() {
  resetForm({ values: defaultEventoSearchValues() });
  getEventos();
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
</script>
