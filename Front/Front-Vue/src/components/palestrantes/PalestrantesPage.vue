<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useForm } from "vee-validate";
import {
  defaultPalestranteFormValues,
  palestranteSchema,
  type PalestranteFormValues,
} from "../../forms/schemas";
import { toTypedSchema } from "../../forms/toTyped";
import type { Palestrante } from "../../Models/Palestrante";
import palestranteService from "../../services/palestranteService";
import ConfirmDialog from "../../shared/ConfirmDialog.vue";

const items = ref<Palestrante[]>([]);
const editingId = ref<number | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const pendingDelete = ref<Palestrante | null>(null);

const { defineField, handleSubmit, errors, resetForm, setValues } = useForm({
  validationSchema: toTypedSchema(palestranteSchema),
  initialValues: defaultPalestranteFormValues(),
});

const [nome, nomeAttrs] = defineField("nome");
const [email, emailAttrs] = defineField("email");
const [telefone, telefoneAttrs] = defineField("telefone");
defineField("miniCurriculo");

const deleteMessage = computed(() =>
  pendingDelete.value
    ? `Deseja deletar "${pendingDelete.value.nome}"?`
    : "",
);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    const { data } = await palestranteService.list();
    items.value = data;
  } catch {
    error.value = "Não foi possível carregar palestrantes.";
  } finally {
    loading.value = false;
  }
}

const save = handleSubmit(async (formValues: PalestranteFormValues) => {
  error.value = null;
  try {
    if (editingId.value) {
      await palestranteService.update(editingId.value, formValues);
    } else {
      await palestranteService.create(formValues);
    }
    resetFormValues();
    await load();
  } catch {
    error.value = "Erro ao salvar palestrante.";
  }
});

function edit(row: Palestrante) {
  editingId.value = row.id;
  setValues({
    nome: row.nome,
    email: row.email ?? "",
    telefone: row.telefone ?? "",
    miniCurriculo: row.miniCurriculo ?? "",
  });
}

function resetFormValues() {
  editingId.value = null;
  resetForm({ values: defaultPalestranteFormValues() });
}

function pedirRemover(row: Palestrante) {
  pendingDelete.value = row;
}

async function confirmRemove() {
  const row = pendingDelete.value;
  pendingDelete.value = null;
  if (!row) return;
  await palestranteService.remove(row.id);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Palestrantes</h1>
      <p class="mt-1 text-sm text-muted">Cadastro e edição inline simples.</p>
    </div>

    <form
      class="grid gap-4 rounded-[length:var(--radius-control)] border border-line bg-panel p-6 md:grid-cols-2"
      @submit.prevent="save"
    >
      <h2 class="text-lg font-medium text-accent-dark md:col-span-2">
        {{ editingId ? "Editar palestrante" : "Novo palestrante" }}
      </h2>
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
      <div class="flex flex-wrap gap-2 md:col-span-2">
        <button
          type="submit"
          class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark active:scale-[0.98]"
        >
          {{ editingId ? "Atualizar" : "Salvar" }}
        </button>
        <button
          v-if="editingId"
          type="button"
          class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink hover:bg-surface"
          @click="resetFormValues"
        >
          Cancelar
        </button>
      </div>
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
    </div>

    <div
      v-else
      class="overflow-hidden rounded-[length:var(--radius-control)] border border-line bg-panel"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-line bg-surface text-left text-muted">
            <th class="px-4 py-3 font-medium">Nome</th>
            <th class="px-4 py-3 font-medium">E-mail</th>
            <th class="px-4 py-3 font-medium">Telefone</th>
            <th class="px-4 py-3 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <tr v-if="items.length === 0">
            <td
              colspan="4"
              class="px-4 py-8 text-center text-muted"
            >
              Nenhum palestrante cadastrado.
            </td>
          </tr>
          <tr
            v-for="row in items"
            :key="row.id"
            class="hover:bg-surface"
          >
            <td class="px-4 py-3 font-medium">{{ row.nome }}</td>
            <td class="px-4 py-3">{{ row.email }}</td>
            <td class="px-4 py-3">{{ row.telefone }}</td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft"
                  @click="edit(row)"
                >
                  Editar
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-danger-border bg-panel px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft"
                  @click="pedirRemover(row)"
                >
                  Excluir
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ConfirmDialog
      :open="pendingDelete !== null"
      title="Excluir palestrante"
      :message="deleteMessage"
      confirm-label="Excluir"
      @confirm="confirmRemove"
      @cancel="pendingDelete = null"
    />
  </div>
</template>
