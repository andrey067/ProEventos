<template>
  <div class="mx-auto flex max-w-lg flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-accent-dark">
        Cadastro de Usuário
      </h1>
      <p class="mt-2 text-sm text-muted">
        Crie sua conta para editar eventos e gerenciar seu perfil.
      </p>
    </div>

    <p
      v-if="error"
      class="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </p>

    <form
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
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Senha</span>
        <input
          v-model="password"
          v-bind="passwordAttrs"
          type="password"
          autocomplete="new-password"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.password" class="text-xs text-danger">{{ errors.password }}</span>
      </label>
      <button
        type="submit"
        :disabled="submitting"
        class="inline-flex w-full items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ submitting ? "Cadastrando..." : "Cadastrar" }}
      </button>
    </form>

    <router-link
      to="/user/login"
      class="text-center text-sm font-medium text-accent-dark hover:underline"
    >
      Já sou cadastrado
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import accountService from "../../../services/accountService";
import { isAxiosError } from "axios";
import { apiErrorMessage } from "../../../utils/apiErrorMessage";

const registerSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  userName: z.string().trim().min(1, "Usuário é obrigatório"),
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const router = useRouter();
const error = ref<string | null>(null);
const submitting = ref(false);

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(registerSchema),
  initialValues: { nome: "", userName: "", email: "", password: "" },
});

const [nome, nomeAttrs] = defineField("nome");
const [userName, userNameAttrs] = defineField("userName");
const [email, emailAttrs] = defineField("email");
const [password, passwordAttrs] = defineField("password");

const submitForm = handleSubmit(async (values) => {
  submitting.value = true;
  error.value = null;

  try {
    await accountService.register(values);
    await router.push("/eventos/lista");
  } catch (err) {
    if (isAxiosError(err)) {
      error.value = apiErrorMessage(
        err.response?.data,
        "Não foi possível cadastrar. Tente novamente.",
      );
    } else {
      error.value = "Não foi possível cadastrar. Tente novamente.";
    }
  } finally {
    submitting.value = false;
  }
});
</script>
