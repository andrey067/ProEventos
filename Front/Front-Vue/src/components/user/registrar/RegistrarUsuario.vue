<template>
  <section
    class="-mx-4 -my-8 grid min-h-[calc(100dvh-4.5rem)] grid-cols-1 overflow-hidden md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]"
  >
    <aside
      class="hidden min-h-full items-center justify-center bg-surface px-3 py-8 sm:px-6 sm:py-10 md:flex lg:px-10 lg:py-12"
      aria-hidden="true"
    >
      <img
        src="/images/signup-illustration.png"
        alt=""
        class="h-auto w-full max-w-[10rem] object-contain sm:max-w-[18rem] md:max-w-[22rem] lg:max-w-[26rem]"
        width="450"
        height="450"
      />
    </aside>

    <div
      class="flex items-center justify-center bg-surface px-3 py-8 sm:px-8 lg:px-12 lg:py-12"
    >
      <div class="flex w-full max-w-md flex-col gap-6">
        <header class="flex flex-col gap-2">
          <h1 class="text-3xl font-semibold tracking-tight text-ink">
            Cadastro de Usuário
          </h1>
          <p class="text-sm leading-relaxed text-muted">
            Crie sua conta para editar eventos e gerenciar seu perfil.
          </p>
        </header>

        <p
          v-if="error"
          class="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {{ error }}
        </p>

        <form class="flex flex-col gap-5" @submit.prevent="submitForm">
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-medium text-ink">Nome</span>
            <input
              v-model="nome"
              v-bind="nomeAttrs"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <span v-if="errors.nome" class="text-xs text-danger">{{ errors.nome }}</span>
          </label>
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-medium text-ink">Usuário</span>
            <input
              v-model="userName"
              v-bind="userNameAttrs"
              autocomplete="username"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <span v-if="errors.userName" class="text-xs text-danger">{{
              errors.userName
            }}</span>
          </label>
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-medium text-ink">E-mail</span>
            <input
              v-model="email"
              v-bind="emailAttrs"
              type="email"
              autocomplete="email"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <span v-if="errors.email" class="text-xs text-danger">{{ errors.email }}</span>
          </label>
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-medium text-ink">Senha</span>
            <input
              v-model="password"
              v-bind="passwordAttrs"
              type="password"
              autocomplete="new-password"
              class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <span v-if="errors.password" class="text-xs text-danger">{{
              errors.password
            }}</span>
          </label>

          <label class="flex items-center gap-2.5 text-sm">
            <input
              v-model="asPalestrante"
              type="checkbox"
              class="size-4 rounded border-line text-accent focus:ring-accent/20"
            />
            <span class="font-medium text-ink">Registrar como palestrante</span>
          </label>

          <template v-if="asPalestrante">
            <label class="flex flex-col gap-2 text-sm">
              <span class="font-medium text-ink">Mini currículo (opcional)</span>
              <textarea
                v-model="miniCurriculo"
                rows="3"
                class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label class="flex flex-col gap-2 text-sm">
              <span class="font-medium text-ink">Telefone (opcional)</span>
              <input
                v-model="telefone"
                class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label class="flex flex-col gap-2 text-sm">
              <span class="font-medium text-ink">URL da imagem (opcional)</span>
              <input
                v-model="imagemURL"
                type="url"
                placeholder="https://..."
                class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </template>

          <button
            type="submit"
            :disabled="submitting"
            class="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-[length:var(--radius-control)] bg-accent px-4 py-2.5 text-sm font-medium text-white transition-[transform,background-color] hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LoadingSpinner :active="submitting" variant="button" />
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import accountService from "../../../services/accountService";
import LoadingSpinner from "../../common/LoadingSpinner.vue";
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
const asPalestrante = ref(false);
const miniCurriculo = ref("");
const telefone = ref("");
const imagemURL = ref("");

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
    if (asPalestrante.value) {
      await accountService.registerPalestrante({
        ...values,
        miniCurriculo: miniCurriculo.value.trim() || undefined,
        telefone: telefone.value.trim() || undefined,
        imagemURL: imagemURL.value.trim() || undefined,
      });
    } else {
      await accountService.register(values);
    }
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
