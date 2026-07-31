<template>
  <form class="flex flex-col gap-4" @submit.prevent="submitForm">
    <AlertMotion
      :show="!!error"
      class="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </AlertMotion>

    <AlertMotion
      :show="success"
      class="rounded-[length:var(--radius-control)] border border-line bg-accent-soft px-4 py-3 text-sm text-accent-dark"
    >
      Perfil atualizado com sucesso.
    </AlertMotion>

    <h2 class="border-b border-line pb-2 text-lg font-semibold">Detalhe Perfil</h2>

    <div class="grid gap-4 sm:grid-cols-3">
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Título</span>
        <select
          v-model="titulo"
          v-bind="tituloAttrs"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          <option v-for="opt in TITULO_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>
      <label class="flex flex-col gap-2 text-sm sm:col-span-1">
        <span class="font-medium">Primeiro Nome</span>
        <input
          v-model="primeiroNome"
          v-bind="primeiroNomeAttrs"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.primeiroNome" class="text-xs text-danger">{{
          errors.primeiroNome
        }}</span>
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Último nome</span>
        <input
          v-model="ultimoNome"
          v-bind="ultimoNomeAttrs"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.ultimoNome" class="text-xs text-danger">{{
          errors.ultimoNome
        }}</span>
      </label>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">E-mail</span>
        <input
          v-model="email"
          v-bind="emailAttrs"
          type="email"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.email" class="text-xs text-danger">{{ errors.email }}</span>
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Telefone</span>
        <input
          v-model="telefone"
          v-bind="telefoneAttrs"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.telefone" class="text-xs text-danger">{{
          errors.telefone
        }}</span>
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Função</span>
        <select
          v-model="funcao"
          v-bind="funcaoAttrs"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          <option v-for="opt in FUNCAO_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </label>
    </div>

    <label class="flex flex-col gap-2 text-sm">
      <span class="font-medium">Descrição</span>
      <textarea
        v-model="descricao"
        v-bind="descricaoAttrs"
        rows="3"
        class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      <span v-if="errors.descricao" class="text-xs text-danger">{{
        errors.descricao
      }}</span>
    </label>

    <div>
      <h3 class="border-b border-line pb-2 pt-2 text-lg font-semibold">Mudar Senha</h3>
      <p class="mt-2 text-sm text-muted">
        Caso mude de senha, preencha os campos abaixo:
      </p>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Senha</span>
        <input
          v-model="password"
          v-bind="passwordAttrs"
          type="password"
          autocomplete="new-password"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Confirmar Senha</span>
        <input
          v-model="confirmePassword"
          v-bind="confirmePasswordAttrs"
          type="password"
          autocomplete="new-password"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.confirmePassword" class="text-xs text-danger">{{
          errors.confirmePassword
        }}</span>
      </label>
    </div>

    <div class="flex flex-wrap gap-3 border-t border-line pt-4">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium"
        @click="cancelEdit"
      >
        Cancelar Alteração
      </button>
      <button
        type="submit"
        :disabled="submitting"
        class="motion-press ml-auto inline-flex items-center justify-center gap-2 rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LoadingSpinner :active="submitting" variant="button" />
        {{ submitting ? "Salvando..." : "Salvar Alteração" }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import accountService from "../../../services/accountService";
import LoadingSpinner from "../../common/LoadingSpinner.vue";
import AlertMotion from "../../../shared/motion/AlertMotion.vue";
import { apiErrorMessage } from "../../../utils/apiErrorMessage";
import {
  FUNCAO_OPTIONS,
  TITULO_OPTIONS,
  type Funcao,
  type Titulo,
  type UserProfile,
} from "../../../Models/identity/User";

export type ProfileFormPreview = {
  primeiroNome: string;
  ultimoNome: string;
  descricao: string;
  funcao: Funcao;
};

const props = defineProps<{ profile: UserProfile }>();

const emit = defineEmits<{
  formPreview: [ProfileFormPreview];
  saved: [UserProfile];
  cancelled: [];
}>();

const profileSchema = z
  .object({
    titulo: z.string().min(1),
    primeiroNome: z.string().trim().min(1, "Primeiro nome é obrigatório"),
    ultimoNome: z.string().trim().min(1, "Último nome é obrigatório"),
    email: z.string().trim().email("E-mail inválido"),
    telefone: z.string().trim().min(1, "Telefone é obrigatório"),
    funcao: z.string().min(1),
    descricao: z.string().trim().min(1, "Descrição é obrigatória"),
    password: z.string().optional(),
    confirmePassword: z.string().optional(),
  })
  .refine(
    (v) => (!v.password && !v.confirmePassword) || v.password === v.confirmePassword,
    { message: "As senhas não coincidem", path: ["confirmePassword"] },
  );

const submitting = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

function profileToFormValues(p: UserProfile) {
  return {
    titulo: p.titulo ?? "NaoInformado",
    primeiroNome: p.primeiroNome ?? "",
    ultimoNome: p.ultimoNome ?? "",
    email: p.email,
    telefone: p.telefone ?? "",
    funcao: p.funcao ?? "Participante",
    descricao: p.descricao ?? "",
    password: "",
    confirmePassword: "",
  };
}

const { defineField, handleSubmit, errors, resetForm, values } = useForm({
  validationSchema: toTypedSchema(profileSchema),
  initialValues: profileToFormValues(props.profile),
});

const [titulo, tituloAttrs] = defineField("titulo");
const [primeiroNome, primeiroNomeAttrs] = defineField("primeiroNome");
const [ultimoNome, ultimoNomeAttrs] = defineField("ultimoNome");
const [email, emailAttrs] = defineField("email");
const [telefone, telefoneAttrs] = defineField("telefone");
const [funcao, funcaoAttrs] = defineField("funcao");
const [descricao, descricaoAttrs] = defineField("descricao");
const [password, passwordAttrs] = defineField("password");
const [confirmePassword, confirmePasswordAttrs] = defineField("confirmePassword");

function emitFormPreview() {
  emit("formPreview", {
    primeiroNome: values.primeiroNome ?? "",
    ultimoNome: values.ultimoNome ?? "",
    descricao: values.descricao ?? "",
    funcao: (values.funcao ?? "Participante") as Funcao,
  });
}

watch(
  () => props.profile,
  (p) => {
    resetForm({ values: profileToFormValues(p) });
    error.value = null;
    emitFormPreview();
  },
  { immediate: true },
);

watch(
  () => [values.primeiroNome, values.ultimoNome, values.descricao, values.funcao],
  () => emitFormPreview(),
);

function cancelEdit() {
  resetForm({ values: profileToFormValues(props.profile) });
  error.value = null;
  success.value = false;
  emit("cancelled");
}

const submitForm = handleSubmit(async (formValues) => {
  submitting.value = true;
  error.value = null;
  success.value = false;

  try {
    const payload: Parameters<typeof accountService.updateProfile>[0] = {
      primeiroNome: formValues.primeiroNome,
      ultimoNome: formValues.ultimoNome,
      email: formValues.email,
      telefone: formValues.telefone,
      descricao: formValues.descricao,
      titulo: formValues.titulo as Titulo,
      funcao: formValues.funcao as Funcao,
      userName: props.profile.userName,
    };
    if (formValues.password) payload.password = formValues.password;

    const profile = await accountService.updateProfile(payload);
    success.value = true;
    emit("saved", profile);
  } catch (err) {
    if (isAxiosError(err)) {
      error.value = apiErrorMessage(
        err.response?.data,
        "Não foi possível atualizar o perfil.",
      );
    } else {
      error.value = "Não foi possível atualizar o perfil.";
    }
  } finally {
    submitting.value = false;
  }
});

defineExpose({
  primeiroNome,
  ultimoNome,
  telefone,
  descricao,
  password,
  confirmePassword,
  submitForm,
  cancelEdit,
});
</script>
