<template>
  <div class="flex flex-col gap-4">
    <AlertMotion
      :show="!!error"
      class="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </AlertMotion>

    <AlertMotion
      :show="!!success"
      class="rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-accent-dark"
    >
      {{ success }}
    </AlertMotion>

    <p v-if="loading" class="text-sm text-muted">Carregando detalhe palestrante…</p>

    <form v-else class="flex flex-col gap-4" @submit.prevent="submitForm">
      <h2 class="border-b border-line pb-2 text-lg font-semibold">Detalhe Palestrante</h2>

      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Nome</span>
        <input
          v-model="nome"
          v-bind="nomeAttrs"
          name="nome"
          type="text"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.nome" class="text-xs text-danger">{{ errors.nome }}</span>
      </label>

      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">E-mail</span>
        <input
          v-model="email"
          v-bind="emailAttrs"
          name="email"
          type="email"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Telefone</span>
        <input
          v-model="telefone"
          v-bind="telefoneAttrs"
          name="telefone"
          type="text"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">URL da imagem</span>
        <input
          v-model="imagemURL"
          v-bind="imagemURLAttrs"
          name="imagemURL"
          type="url"
          placeholder="https://..."
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Mini currículo</span>
        <textarea
          v-model="miniCurriculo"
          v-bind="miniCurriculoAttrs"
          name="miniCurriculo"
          rows="3"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <div class="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:flex-wrap">
        <button
          type="submit"
          class="motion-press inline-flex w-full items-center justify-center gap-2 rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto"
          :disabled="missingProfile || palestranteId == null || saving"
        >
          {{ saving ? "Salvando..." : "Salvar Alteração" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useForm } from "vee-validate";
import { isAxiosError } from "axios";
import palestranteService from "../../../services/palestranteService";
import {
  defaultPalestranteFormValues,
  palestranteSchema,
} from "../../../forms/schemas";
import { toTypedSchema } from "../../../forms/toTyped";
import AlertMotion from "../../../shared/motion/AlertMotion.vue";
import { apiErrorMessage } from "../../../utils/apiErrorMessage";

const palestranteId = ref<number | null>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const missingProfile = ref(false);

const { defineField, errors, setValues } = useForm({
  validationSchema: toTypedSchema(palestranteSchema),
  initialValues: defaultPalestranteFormValues(),
});

const [nome, nomeAttrs] = defineField("nome");
const [email, emailAttrs] = defineField("email");
const [telefone, telefoneAttrs] = defineField("telefone");
const [imagemURL, imagemURLAttrs] = defineField("imagemURL");
const [miniCurriculo, miniCurriculoAttrs] = defineField("miniCurriculo");

async function load() {
  loading.value = true;
  error.value = null;
  missingProfile.value = false;
  try {
    const { data } = await palestranteService.getMe();
    palestranteId.value = data.id;
    setValues({
      nome: data.nome ?? "",
      email: data.email ?? "",
      telefone: data.telefone ?? "",
      imagemURL: data.imagemURL ?? "",
      miniCurriculo: data.miniCurriculo ?? "",
    });
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) {
      missingProfile.value = true;
      error.value = "Salve o perfil com função Palestrante primeiro";
      palestranteId.value = null;
    } else if (isAxiosError(err)) {
      error.value = apiErrorMessage(err.response?.data, "Erro ao carregar palestrante.");
    } else {
      error.value = "Erro ao carregar palestrante.";
    }
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  const formValues = {
    nome: nome.value ?? "",
    email: email.value ?? "",
    telefone: telefone.value ?? "",
    imagemURL: imagemURL.value ?? "",
    miniCurriculo: miniCurriculo.value ?? "",
  };
  const parsed = palestranteSchema.safeParse(formValues);
  if (!parsed.success) return;
  if (palestranteId.value == null) return;

  saving.value = true;
  error.value = null;
  success.value = null;
  try {
    await palestranteService.update(palestranteId.value, parsed.data);
    success.value = "Palestrante atualizado.";
  } catch (err) {
    if (isAxiosError(err)) {
      error.value = apiErrorMessage(err.response?.data, "Erro ao salvar palestrante.");
    } else {
      error.value = "Erro ao salvar palestrante.";
    }
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void load();
});
</script>
