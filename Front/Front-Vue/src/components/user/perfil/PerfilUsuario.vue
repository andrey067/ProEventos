<template>
  <div class="mx-auto flex max-w-lg flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Meu perfil</h1>
      <p class="mt-1 text-sm text-muted">
        Atualize seus dados de conta.
      </p>
    </div>

    <p
      v-if="success"
      class="rounded-[length:var(--radius-control)] border border-line bg-accent-soft px-4 py-3 text-sm text-accent-dark"
    >
      Perfil atualizado com sucesso.
    </p>

    <p
      v-if="error"
      class="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </p>

    <p v-if="loading" class="text-sm text-muted">Carregando perfil...</p>

    <form
      v-else
      class="flex flex-col gap-4 rounded-[length:var(--radius-control)] border border-line bg-panel p-6"
      @submit.prevent="submitForm"
    >
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Nome</span>
        <input
          v-model="nome"
          v-bind="nomeAttrs"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.nome" class="text-xs text-danger">{{ errors.nome }}</span>
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Usuário</span>
        <input
          v-model="userName"
          v-bind="userNameAttrs"
          autocomplete="username"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.userName" class="text-xs text-danger">{{ errors.userName }}</span>
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">E-mail</span>
        <input
          v-model="email"
          v-bind="emailAttrs"
          type="email"
          autocomplete="email"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.email" class="text-xs text-danger">{{ errors.email }}</span>
      </label>
      <button
        type="submit"
        :disabled="submitting"
        class="inline-flex w-full items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ submitting ? "Salvando..." : "Salvar perfil" }}
      </button>
    </form>

    <router-link
      to="/user/senha"
      class="text-sm font-medium text-accent-dark hover:underline"
    >
      Alterar senha
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import accountService from "../../../services/accountService";
import { isAxiosError } from "axios";
import { apiErrorMessage } from "../../../utils/apiErrorMessage";

const profileSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  userName: z.string().trim().min(1, "Usuário é obrigatório"),
  email: z.string().trim().email("E-mail inválido"),
});

const loading = ref(true);
const submitting = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const { defineField, handleSubmit, errors, setValues } = useForm({
  validationSchema: toTypedSchema(profileSchema),
  initialValues: { nome: "", userName: "", email: "" },
});

const [nome, nomeAttrs] = defineField("nome");
const [userName, userNameAttrs] = defineField("userName");
const [email, emailAttrs] = defineField("email");

const submitForm = handleSubmit(async (values) => {
  submitting.value = true;
  error.value = null;
  success.value = false;

  try {
    const profile = await accountService.updateProfile(values);
    setValues(profile);
    success.value = true;
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

onMounted(async () => {
  try {
    const profile = await accountService.getProfile();
    setValues(profile);
  } catch {
    error.value = "Não foi possível carregar o perfil.";
  } finally {
    loading.value = false;
  }
});
</script>
