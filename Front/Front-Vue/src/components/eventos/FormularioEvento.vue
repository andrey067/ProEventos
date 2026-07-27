<template>
  <form
    class="flex flex-col gap-6"
    @submit.prevent="submitForm"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ isNew ? "Novo evento" : "Editar evento" }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          Formulário simples com lotes e redes sociais.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink hover:bg-surface"
        @click="router.push({ name: 'lista' })"
      >
        Voltar
      </button>
    </div>

    <p
      v-if="error"
      class="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </p>

    <div class="grid gap-6 md:grid-cols-[1fr_minmax(260px,320px)] md:items-start">
      <section
        class="rounded-[length:var(--radius-control)] border border-line bg-panel p-6"
      >
        <h2 class="mb-4 text-lg font-medium text-accent-dark">Dados do evento</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="flex flex-col gap-2 text-sm md:col-span-2">
            <span class="font-medium">Tema</span>
            <input
              v-model="tema"
              v-bind="temaAttrs"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <span
              v-if="errors.tema"
              class="text-xs text-danger"
            >{{ errors.tema }}</span>
          </label>
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-medium">Local</span>
            <input
              v-model="local"
              v-bind="localAttrs"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <span
              v-if="errors.local"
              class="text-xs text-danger"
            >{{ errors.local }}</span>
          </label>
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-medium">Data do evento</span>
            <DatePickerField
              :model-value="dataEvento"
              @update:model-value="onDataEventoChange"
            />
            <span
              v-if="errors.dataEvento"
              class="text-xs text-danger"
            >{{ errors.dataEvento }}</span>
          </label>
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-medium">Qtd pessoas</span>
            <input
              v-model.number="qtdPessoas"
              v-bind="qtdPessoasAttrs"
              type="number"
              min="1"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <span
              v-if="errors.qtdPessoas"
              class="text-xs text-danger"
            >{{ errors.qtdPessoas }}</span>
          </label>
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-medium">Telefone</span>
            <input
              v-model="telefone"
              v-bind="telefoneAttrs"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="(000) 90000-0000"
            />
            <span
              v-if="errors.telefone"
              class="text-xs text-danger"
            >{{ errors.telefone }}</span>
          </label>
          <label class="flex flex-col gap-2 text-sm md:col-span-2">
            <span class="font-medium">E-mail</span>
            <input
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <span
              v-if="errors.email"
              class="text-xs text-danger"
            >{{ errors.email }}</span>
          </label>
        </div>
      </section>

      <aside
        class="self-start rounded-[length:var(--radius-control)] border border-line bg-panel p-4 md:sticky md:top-4"
        data-testid="evento-preview-card"
      >
        <button
          type="button"
          class="mb-4 block w-full overflow-hidden rounded-[length:var(--radius-control)] border border-line bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
          @click="openUrlEditor"
        >
          <img
            v-if="showPreviewImage"
            :src="imagemURL"
            alt="Imagem do evento"
            class="h-48 w-full object-cover"
            @error="onImageError"
          />
          <div
            v-else
            class="flex h-48 w-full items-center justify-center px-4 text-center text-sm text-muted"
          >
            Clique para informar URL da imagem
          </div>
        </button>

        <div
          v-if="showUrlEditor"
          class="mb-4 flex flex-col gap-2"
        >
          <label class="flex flex-col gap-1 text-sm">
            <span class="font-medium">URL da imagem</span>
            <input
              ref="urlInputRef"
              v-model="urlDraft"
              type="url"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="https://..."
              @keydown.enter.prevent="commitUrl"
              @blur="commitUrl"
            />
          </label>
          <span
            v-if="urlError"
            class="text-xs text-danger"
          >{{ urlError }}</span>
        </div>

        <dl class="grid gap-3 text-sm">
          <div>
            <dt class="font-medium text-muted">Local</dt>
            <dd>{{ local || "—" }}</dd>
          </div>
          <div>
            <dt class="font-medium text-muted">Data</dt>
            <dd>{{ formatDateBr(dataEvento) || "—" }}</dd>
          </div>
          <div>
            <dt class="font-medium text-muted">Telefone</dt>
            <dd>{{ telefone || "—" }}</dd>
          </div>
          <div>
            <dt class="font-medium text-muted">E-mail</dt>
            <dd>{{ email || "—" }}</dd>
          </div>
        </dl>
      </aside>
    </div>

    <section
      class="rounded-[length:var(--radius-control)] border border-line bg-panel p-6"
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-medium text-accent-dark">Lotes</h2>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft"
          @click="addLote"
        >
          + Lote
        </button>
      </div>
      <div class="flex flex-col gap-3">
        <div
          v-for="(field, index) in lotesFields"
          :key="field.key"
          class="grid gap-4 rounded-[length:var(--radius-control)] border border-line bg-surface p-4 md:grid-cols-2"
        >
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-medium">Nome</span>
            <input
              v-model="field.value.nome"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <span
              v-if="loteFieldError(index, 'nome')"
              class="text-xs text-danger"
            >{{ loteFieldError(index, "nome") }}</span>
          </label>
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-medium">Preço</span>
            <CurrencyInputField
              :model-value="field.value.preco"
              @update:model-value="(value) => onLotePrecoChange(index, value)"
            />
            <span
              v-if="loteFieldError(index, 'preco')"
              class="text-xs text-danger"
            >{{ loteFieldError(index, "preco") }}</span>
          </label>
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-medium">Quantidade</span>
            <input
              v-model.number="field.value.quantidade"
              type="number"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <span
              v-if="loteFieldError(index, 'quantidade')"
              class="text-xs text-danger"
            >{{ loteFieldError(index, "quantidade") }}</span>
          </label>
          <div class="grid gap-4 md:col-span-2 md:grid-cols-2">
            <label class="flex flex-col gap-2 text-sm">
              <span class="font-medium">Data início</span>
              <DatePickerField
                :model-value="field.value.dataInicio"
                @update:model-value="(value) => onLoteDateChange(index, 'dataInicio', value)"
              />
              <span
                v-if="loteFieldError(index, 'dataInicio')"
                class="text-xs text-danger"
              >{{ loteFieldError(index, "dataInicio") }}</span>
            </label>
            <label class="flex flex-col gap-2 text-sm">
              <span class="font-medium">Data fim</span>
              <DatePickerField
                :model-value="field.value.dataFim"
                @update:model-value="(value) => onLoteDateChange(index, 'dataFim', value)"
              />
              <span
                v-if="loteFieldError(index, 'dataFim')"
                class="text-xs text-danger"
              >{{ loteFieldError(index, "dataFim") }}</span>
            </label>
          </div>
        </div>
      </div>
    </section>

    <button
      type="submit"
      class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="saving"
    >
      {{ saving ? "Salvando..." : "Salvar" }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useForm, useFieldArray } from "vee-validate";
import { useRoute, useRouter } from "vue-router";
import {
  defaultEventoFormValues,
  emptyLote,
  eventoSchema,
  type EventoFormValues,
  type LoteFormValues,
} from "../../forms/schemas";
import { toTypedSchema } from "../../forms/toTyped";
import type { Lote } from "../../Models/Lote";
import type { Evento } from "../../Models/Evento";
import eventoService from "../../services/eventoService";
import loteService from "../../services/loteService";
import redeSocialService, {
  type RedeSocialPayload,
} from "../../services/redeSocialService";
import DatePickerField from "../../shared/DatePickerField.vue";
import CurrencyInputField from "../../shared/CurrencyInputField.vue";
import { formatDateBr, toApiDate, toDateInputValue } from "../../utils/date";
import { isRemoteImageUrl } from "../../utils/imageUrl";

type ApiLote = Lote & { dataIncio?: string | Date };

const route = useRoute();
const router = useRouter();
const saving = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);

const { defineField, handleSubmit, errors, setValues, setFieldValue, validateField, values } =
  useForm({
    validationSchema: toTypedSchema(eventoSchema),
    initialValues: defaultEventoFormValues(),
  });

const [tema, temaAttrs] = defineField("tema");
const [local, localAttrs] = defineField("local");
const [dataEvento] = defineField("dataEvento");
const [qtdPessoas, qtdPessoasAttrs] = defineField("qtdPessoas");
const [telefone, telefoneAttrs] = defineField("telefone");
const [email, emailAttrs] = defineField("email");
const [imagemURL] = defineField("imagemURL");

const { fields: lotesFields, push: pushLote } = useFieldArray<LoteFormValues>("lotes");

const showUrlEditor = ref(false);
const urlDraft = ref("");
const urlError = ref<string | null>(null);
const imageLoadFailed = ref(false);
const urlInputRef = ref<HTMLInputElement | null>(null);

const showPreviewImage = computed(
  () => isRemoteImageUrl(imagemURL.value) && !imageLoadFailed.value,
);

watch(imagemURL, () => {
  imageLoadFailed.value = false;
});

async function openUrlEditor() {
  urlDraft.value = imagemURL.value ?? "";
  urlError.value = null;
  showUrlEditor.value = true;
  await nextTick();
  urlInputRef.value?.focus();
}

async function commitUrl() {
  if (!showUrlEditor.value) return;
  const trimmed = urlDraft.value.trim();
  if (!trimmed) {
    await setFieldValue("imagemURL", "");
    urlError.value = null;
    showUrlEditor.value = false;
    return;
  }
  if (!isRemoteImageUrl(trimmed)) {
    urlError.value = "Use um link http:// ou https:// (path local não carrega).";
    return;
  }
  await setFieldValue("imagemURL", trimmed);
  urlError.value = null;
  showUrlEditor.value = false;
}

function onImageError() {
  imageLoadFailed.value = true;
}

const isNew = computed(() => {
  const idParam = route.params.id;
  return !idParam || idParam === "new" || Number(idParam) === 0;
});

function loteFieldError(index: number, field: string): string | undefined {
  const path = `lotes[${index}].${field}`;
  return (errors.value as Record<string, string | undefined>)[path];
}

async function onDataEventoChange(value: string) {
  await setFieldValue("dataEvento", value);
  await validateField("dataEvento");
}

async function onLoteDateChange(
  index: number,
  field: "dataInicio" | "dataFim",
  value: string,
) {
  // Dynamic field-array paths are not inferred by vee-validate generics.
  await setFieldValue(`lotes[${index}].${field}` as never, value as never);
  await Promise.all([
    validateField(`lotes[${index}].dataInicio`),
    validateField(`lotes[${index}].dataFim`),
  ]);
}

async function onLotePrecoChange(index: number, value: number | null) {
  await setFieldValue(`lotes[${index}].preco` as never, (value ?? 0) as never);
  await validateField(`lotes[${index}].preco`);
}

function addLote() {
  pushLote(emptyLote(values.id ?? 0));
}

function mapLoteFromApi(lote: ApiLote): LoteFormValues {
  const inicio = lote.dataInicio ?? lote.dataIncio;
  return {
    id: lote.id ?? 0,
    nome: lote.nome ?? "",
    preco: lote.preco ?? 0,
    quantidade: lote.quantidade ?? 0,
    dataInicio: toDateInputValue(inicio),
    dataFim: toDateInputValue(lote.dataFim),
    eventoId: lote.eventoId ?? 0,
  };
}

function toLotePayload(lotes: LoteFormValues[]): Partial<Lote>[] {
  return lotes.map((lote) => {
    const dataIncio = toApiDate(lote.dataInicio);
    const dataFim = toApiDate(lote.dataFim);
    return {
      id: lote.id ?? 0,
      nome: lote.nome ?? "",
      preco: lote.preco ?? 0,
      quantidade: lote.quantidade ?? 0,
      dataInicio: dataIncio,
      dataIncio,
      dataFim,
      eventoId: lote.eventoId ?? values.id ?? 0,
    } as unknown as Partial<Lote> & { dataIncio?: string };
  });
}

function toEventoPayload(formValues: EventoFormValues): Partial<Evento> {
  return {
    id: formValues.id ?? 0,
    tema: formValues.tema,
    local: formValues.local,
    dataEvento: toApiDate(formValues.dataEvento),
    qtdPessoas: formValues.qtdPessoas,
    telefone: formValues.telefone,
    email: formValues.email,
    imagemURL: formValues.imagemURL ?? "",
    lotes: toLotePayload(formValues.lotes ?? []) as unknown as Lote[],
    redesSociais: [],
    palestrantesEventos: [],
  };
}

function toRedeSocialPayload(
  redes: EventoFormValues["redesSociais"],
): RedeSocialPayload[] {
  return (redes ?? []).map((rede) => ({
    id: rede.id,
    nome: rede.nome ?? "",
    url: rede.url ?? rede.URL ?? "",
  }));
}

const submitForm = handleSubmit(async (formValues: EventoFormValues) => {
  saving.value = true;
  error.value = null;
  try {
    const payload = toEventoPayload(formValues);
    const idParam = route.params.id;
    const saved = isNew.value
      ? (await eventoService.create(payload)).data
      : (await eventoService.update(Number(idParam), payload)).data;
    const eventoId = saved.id;
    if (formValues.lotes?.length) {
      await loteService.save(eventoId, toLotePayload(formValues.lotes));
    }
    if (formValues.redesSociais?.length) {
      await redeSocialService.saveByEvento(
        eventoId,
        toRedeSocialPayload(formValues.redesSociais),
      );
    }
    router.push({ name: "lista" });
  } catch {
    error.value = "Falha ao salvar evento";
  } finally {
    saving.value = false;
  }
});

function getEvento(id: string | string[]): void {
  loading.value = true;
  eventoService
    .getById(Number(id))
    .then((response) => {
      const data = response.data;
      setValues({
        ...defaultEventoFormValues(),
        ...data,
        dataEvento: toDateInputValue(data.dataEvento),
        lotes: (data.lotes ?? []).map((lote) => mapLoteFromApi(lote as ApiLote)),
        redesSociais: data.redesSociais ?? [],
        palestrantesEventos: data.palestrantesEventos ?? [],
      });
    })
    .catch(() => {
      error.value = `Erro ao carregar o evento: ${id}`;
    })
    .finally(() => {
      loading.value = false;
    });
}

onMounted(() => {
  const id = route.params.id;
  if (id && id !== "new" && !Number.isNaN(Number(id))) {
    getEvento(id);
  }
});
</script>
