<template>
  <div class="mx-auto flex max-w-md flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Login</h1>
      <p class="mt-1 text-sm text-muted">
        Entre com seu usuário para editar eventos e gerenciar seu perfil.
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
        <span class="font-medium">Senha</span>
        <input
          v-model="password"
          v-bind="passwordAttrs"
          type="password"
          autocomplete="current-password"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.password" class="text-xs text-danger">{{ errors.password }}</span>
      </label>
      <button
        type="submit"
        :disabled="submitting"
        class="inline-flex w-full items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ submitting ? "Entrando..." : "Entrar" }}
      </button>
    </form>

    <p class="text-center text-sm text-muted">
      Não tem conta?
      <router-link to="/user/registro" class="font-medium text-accent-dark hover:underline">
        Cadastre-se
      </router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import accountService from "../../../services/accountService";
import { isAxiosError } from "axios";
import { apiErrorMessage } from "../../../utils/apiErrorMessage";

const loginSchema = z.object({
  userName: z.string().trim().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const router = useRouter();
const route = useRoute();
const error = ref<string | null>(null);
const submitting = ref(false);

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: { userName: "", password: "" },
});

const [userName, userNameAttrs] = defineField("userName");
const [password, passwordAttrs] = defineField("password");

const submitForm = handleSubmit(async (values) => {
  submitting.value = true;
  error.value = null;

  try {
    await accountService.login(values);
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/eventos/lista";
    await router.push(redirect);
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 401) {
      error.value = apiErrorMessage(
        err.response?.data,
        "Usuário ou senha inválidos.",
      );
    } else {
      error.value = "Não foi possível entrar. Tente novamente.";
    }
  } finally {
    submitting.value = false;
  }
});
</script>
