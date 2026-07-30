<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useForm } from "vee-validate";
import { useRoute, useRouter } from "vue-router";
import {
  defaultPalestranteFormValues,
  palestranteSchema,
  type PalestranteFormValues,
} from "../../forms/schemas";
import { toTypedSchema } from "../../forms/toTyped";
import { canWrite, isAuthenticated } from "../../services/authToken";
import palestranteService from "../../services/palestranteService";
import redeSocialService, {
  type RedeSocialPayload,
} from "../../services/redeSocialService";
import LoadingSpinner from "../common/LoadingSpinner.vue";
import { isRemoteImageUrl } from "../../utils/imageUrl";

interface RedeDraft {
  id: number;
  nome: string;
  url: string;
}

const route = useRoute();
const router = useRouter();

const editingId = ref<number | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const writeAllowed = computed(() => canWrite());
const isLoggedIn = computed(() => isAuthenticated());
const isNew = computed(() => editingId.value === null);

const redes = ref<RedeDraft[]>([]);
const redesLoading = ref(false);

const { defineField, handleSubmit, errors, resetForm, setValues } = useForm({
  validationSchema: toTypedSchema(palestranteSchema),
  initialValues: defaultPalestranteFormValues(),
});

const [nome, nomeAttrs] = defineField("nome");
const [email, emailAttrs] = defineField("email");
const [telefone, telefoneAttrs] = defineField("telefone");
const [miniCurriculo, miniCurriculoAttrs] = defineField("miniCurriculo");
const [imagemURL, imagemURLAttrs] = defineField("imagemURL");

const showImagePreview = computed(() => isRemoteImageUrl(imagemURL.value));

async function loadRedes(palestranteId: number) {
  redesLoading.value = true;
  try {
    const { data } = await redeSocialService.listByPalestrante(palestranteId);
    redes.value = data.map((r) => ({
      id: r.id ?? 0,
      nome: r.nome ?? "",
      url: r.url ?? "",
    }));
  } catch {
    redes.value = [];
  } finally {
    redesLoading.value = false;
  }
}

function addRede() {
  redes.value.push({ id: 0, nome: "", url: "" });
}

async function removeRedeAt(index: number) {
  const rede = redes.value[index];
  if (!rede) return;
  if (!window.confirm(`Excluir rede "${rede.nome || "sem nome"}"?`)) return;

  if (rede.id > 0 && editingId.value) {
    try {
      await redeSocialService.removeByPalestrante(editingId.value, rede.id);
      redes.value.splice(index, 1);
      success.value = "Rede social excluída.";
      error.value = null;
    } catch {
      error.value = "Falha ao excluir rede social.";
    }
    return;
  }
  redes.value.splice(index, 1);
}

async function saveRedes(palestranteId: number) {
  const payload: RedeSocialPayload[] = redes.value
    .filter((r) => (r.nome ?? "").trim() || (r.url ?? "").trim())
    .map((r) => ({
      id: r.id || undefined,
      nome: r.nome ?? "",
      url: r.url ?? "",
    }));
  if (payload.length === 0) return;
  await redeSocialService.saveByPalestrante(palestranteId, payload);
}

function goToList() {
  void router.push({ name: "palestrantes-lista" });
}

const save = handleSubmit(async (formValues: PalestranteFormValues) => {
  if (!writeAllowed.value) return;
  error.value = null;
  success.value = null;
  try {
    let savedId = editingId.value;
    if (editingId.value) {
      await palestranteService.update(editingId.value, formValues);
    } else {
      const { data } = await palestranteService.create(formValues);
      savedId = data.id;
    }
    if (savedId) {
      await saveRedes(savedId);
    }
    success.value = "Palestrante salvo com sucesso.";
    goToList();
  } catch {
    error.value = "Erro ao salvar palestrante.";
  }
});

function resetFormValues() {
  editingId.value = null;
  redes.value = [];
  resetForm({ values: defaultPalestranteFormValues() });
}

function onThumbError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = "none";
}

async function loadFromRoute() {
  const rawId = route.params.id;
  const idParam = Array.isArray(rawId) ? rawId[0] : rawId;
  loading.value = true;
  error.value = null;
  success.value = null;

  if (!idParam) {
    resetFormValues();
    loading.value = false;
    return;
  }

  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    error.value = "Palestrante não encontrado.";
    resetFormValues();
    loading.value = false;
    return;
  }

  try {
    const { data } = await palestranteService.getById(id);
    editingId.value = data.id;
    setValues({
      nome: data.nome,
      email: data.email ?? "",
      telefone: data.telefone ?? "",
      miniCurriculo: data.miniCurriculo ?? "",
      imagemURL: data.imagemURL ?? "",
    });
    await loadRedes(data.id);
  } catch {
    error.value = "Não foi possível carregar o palestrante.";
    resetFormValues();
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.id,
  () => {
    void loadFromRoute();
  },
);

onMounted(() => {
  void loadFromRoute();
});
</script>

<template>
  <div class="flex min-w-0 flex-col gap-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ isNew ? "Novo palestrante" : "Editar palestrante" }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          Formulário com redes sociais.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink hover:bg-surface"
        @click="goToList"
      >
        Voltar
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

    <p
      v-if="success"
      class="rounded-[length:var(--radius-control)] border border-line bg-accent-soft px-4 py-3 text-sm text-accent-dark"
    >
      {{ success }}
    </p>

    <p
      v-if="error"
      class="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </p>

    <LoadingSpinner :active="loading" variant="page" />

    <form
      v-if="!loading && writeAllowed"
      class="grid min-w-0 gap-4 rounded-[length:var(--radius-control)] border border-line bg-panel p-4 sm:p-6 md:grid-cols-2"
      @submit.prevent="save"
    >
      <label class="flex flex-col gap-2 text-sm md:col-span-2">
        <span class="font-medium">Nome</span>
        <input
          v-model="nome"
          v-bind="nomeAttrs"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span
          v-if="errors.nome"
          class="text-xs text-danger"
        >{{ errors.nome }}</span>
      </label>
      <label class="flex flex-col gap-2 text-sm md:col-span-2">
        <span class="font-medium">Mini currículo</span>
        <textarea
          v-model="miniCurriculo"
          v-bind="miniCurriculoAttrs"
          rows="3"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">E-mail</span>
        <input
          v-model="email"
          v-bind="emailAttrs"
          type="email"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Telefone</span>
        <input
          v-model="telefone"
          v-bind="telefoneAttrs"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <label class="flex flex-col gap-2 text-sm md:col-span-2">
        <span class="font-medium">URL da imagem</span>
        <input
          v-model="imagemURL"
          v-bind="imagemURLAttrs"
          type="url"
          placeholder="https://..."
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <div
        v-if="showImagePreview"
        class="md:col-span-2"
        data-testid="speaker-image-preview"
      >
        <img
          :src="imagemURL"
          alt="Prévia"
          class="h-32 w-32 rounded object-cover"
          @error="onThumbError"
        />
      </div>

      <div
        class="md:col-span-2"
        data-testid="speaker-redes-section"
      >
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-sm font-medium text-accent-dark">Redes sociais</h3>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft"
            @click="addRede"
          >
            + Rede
          </button>
        </div>
        <LoadingSpinner :active="redesLoading" variant="inline" label="Carregando redes..." />
        <div class="flex flex-col gap-2">
          <div
            v-for="(rede, index) in redes"
            :key="`${rede.id}-${index}`"
            class="grid gap-2 md:grid-cols-[1fr_1fr_auto]"
          >
            <input
              v-model="rede.nome"
              placeholder="Nome"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <input
              v-model="rede.url"
              placeholder="URL"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-danger-border bg-panel px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft"
              @click="removeRedeAt(index)"
            >
              Excluir
            </button>
          </div>
          <p
            v-if="!redesLoading && redes.length === 0 && !isNew"
            class="text-sm text-muted"
          >
            Nenhuma rede social.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 md:col-span-2">
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark active:scale-[0.98]"
        >
          {{ isNew ? "Salvar" : "Atualizar" }}
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink hover:bg-surface"
          @click="goToList"
        >
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>
