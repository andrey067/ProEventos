<template>
  <div class="mx-auto flex max-w-lg flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Alterar senha</h1>
      <p class="mt-1 text-sm text-muted">
        Informe a senha atual e a nova senha.
      </p>
    </div>

    <p
      v-if="success"
      class="rounded-[length:var(--radius-control)] border border-line bg-accent-soft px-4 py-3 text-sm text-accent-dark"
    >
      Senha alterada com sucesso.
    </p>

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
        <span class="font-medium">Senha atual</span>
        <input
          v-model="currentPassword"
          v-bind="currentPasswordAttrs"
          type="password"
          autocomplete="current-password"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.currentPassword" class="text-xs text-danger">{{ errors.currentPassword }}</span>
      </label>
      <label class="flex flex-col gap-2 text-sm">
        <span class="font-medium">Nova senha</span>
        <input
          v-model="newPassword"
          v-bind="newPasswordAttrs"
          type="password"
          autocomplete="new-password"
          class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <span v-if="errors.newPassword" class="text-xs text-danger">{{ errors.newPassword }}</span>
      </label>
      <button
        type="submit"
        :disabled="submitting"
        class="inline-flex w-full items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ submitting ? "Salvando..." : "Alterar senha" }}
      </button>
    </form>

    <router-link
      to="/user/perfil"
      class="text-sm font-medium text-accent-dark hover:underline"
    >
      Voltar ao perfil
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import accountService from "../../../services/accountService";
import { isAxiosError } from "axios";
import { apiErrorMessage } from "../../../utils/apiErrorMessage";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(1, "Nova senha é obrigatória"),
});

const submitting = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

const { defineField, handleSubmit, errors, resetForm } = useForm({
  validationSchema: toTypedSchema(changePasswordSchema),
  initialValues: { currentPassword: "", newPassword: "" },
});

const [currentPassword, currentPasswordAttrs] = defineField("currentPassword");
const [newPassword, newPasswordAttrs] = defineField("newPassword");

const submitForm = handleSubmit(async (values) => {
  submitting.value = true;
  error.value = null;
  success.value = false;

  try {
    await accountService.changePassword(values);
    resetForm();
    success.value = true;
  } catch (err) {
    if (isAxiosError(err)) {
      error.value = apiErrorMessage(
        err.response?.data,
        "Não foi possível alterar a senha.",
      );
    } else {
      error.value = "Não foi possível alterar a senha.";
    }
  } finally {
    submitting.value = false;
  }
});
</script>
