<template>
  <div class="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Perfil</h1>
      <p class="mt-1 text-sm text-muted">Atualize seus dados de conta.</p>
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

    <LoadingSpinner :active="loading" variant="page" />

    <div v-if="!loading" class="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside
        class="flex flex-col overflow-hidden rounded-[length:var(--radius-control)] border border-line bg-panel"
      >
        <div class="flex flex-col items-center gap-3 px-4 pt-6">
          <img
            :src="photoSrc"
            alt="Foto de perfil"
            class="h-28 w-28 rounded-full object-cover ring-1 ring-line"
            @error="onImgError"
          />
          <p class="text-lg font-medium text-muted">@{{ snapshot.userName }}</p>
        </div>
        <div class="flex flex-col gap-2 px-4 py-4 text-sm">
          <p>
            <span class="font-semibold">Nome:</span>
            {{ snapshot.nome || `${snapshot.primeiroNome} ${snapshot.ultimoNome}` }}
          </p>
          <p class="text-muted">{{ snapshot.descricao }}</p>
        </div>
        <ul class="mt-auto grid grid-cols-2 border-t border-line text-center text-sm">
          <li class="border-r border-line px-2 py-3">
            <div class="text-lg font-semibold">{{ snapshot.eventosMinistrados }}</div>
            <div class="text-xs text-muted">Eventos Ministrados</div>
          </li>
          <li class="px-2 py-3">
            <div class="text-lg font-semibold">{{ snapshot.eventosParticipados }}</div>
            <div class="text-xs text-muted">Eventos Participados</div>
          </li>
        </ul>
      </aside>

      <form
        class="flex flex-col gap-4 rounded-[length:var(--radius-control)] border border-line bg-panel p-6"
        @submit.prevent="submitForm"
      >
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

        <div v-if="isPalestrante" class="border-t border-line pt-4">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-lg font-semibold">Redes sociais</h3>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft"
              @click="addRede"
            >
              + Rede
            </button>
          </div>

          <p
            v-if="redesError"
            class="mb-3 rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger"
          >
            {{ redesError }}
          </p>
          <p
            v-if="redesSuccess"
            class="mb-3 rounded-[length:var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm text-accent-dark"
          >
            {{ redesSuccess }}
          </p>

          <LoadingSpinner :active="redesLoading" variant="inline" label="Carregando redes..." />

          <div class="flex flex-col gap-2">
            <div
              v-for="(rede, index) in redes"
              :key="index"
              class="grid gap-2 rounded-[length:var(--radius-control)] border border-line bg-surface p-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <input
                v-model="rede.nome"
                class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Nome"
              />
              <input
                v-model="rede.url"
                class="w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="URL"
              />
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-danger-border bg-panel px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft"
                @click="askDeleteRede(index)"
              >
                Excluir
              </button>
            </div>
          </div>

          <div class="mt-4 flex justify-end">
            <button
              type="button"
              :disabled="savingRedes || redesLoading"
              class="inline-flex items-center justify-center gap-2 rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              @click="saveRedes"
            >
              <LoadingSpinner :active="savingRedes" variant="button" />
              {{ savingRedes ? "Salvando..." : "Salvar Redes" }}
            </button>
          </div>
        </div>

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
            class="ml-auto inline-flex items-center justify-center gap-2 rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LoadingSpinner :active="submitting" variant="button" />
            {{ submitting ? "Salvando..." : "Salvar Alteração" }}
          </button>
        </div>
      </form>
    </div>

    <ConfirmDialog
      :open="pendingRedeDelete !== null"
      title="Excluir rede social"
      :message="deleteRedeMessage"
      confirm-label="Excluir"
      @confirm="confirmDeleteRede"
      @cancel="pendingRedeDelete = null"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import accountService from "../../../services/accountService";
import redeSocialService, {
  type RedeSocialPayload,
} from "../../../services/redeSocialService";
import LoadingSpinner from "../../common/LoadingSpinner.vue";
import ConfirmDialog from "../../../shared/ConfirmDialog.vue";
import { redeSocialFormSchema } from "../../../forms/schemas/eventoSchema";
import { isAxiosError } from "axios";
import { apiErrorMessage } from "../../../utils/apiErrorMessage";
import {
  FUNCAO_OPTIONS,
  TITULO_OPTIONS,
  type Funcao,
  type Titulo,
  type UserProfile,
} from "../../../Models/identity/User";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#e5e7eb" width="120" height="120"/><circle cx="60" cy="46" r="22" fill="#9ca3af"/><ellipse cx="60" cy="100" rx="36" ry="28" fill="#9ca3af"/></svg>`,
  );

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

const loading = ref(true);
const submitting = ref(false);
const redesLoading = ref(false);
const savingRedes = ref(false);
const error = ref<string | null>(null);
const success = ref(false);
const redesError = ref<string | null>(null);
const redesSuccess = ref<string | null>(null);
const imgBroken = ref(false);
const redes = ref<RedeSocialPayload[]>([]);
const pendingRedeDelete = ref<number | null>(null);
const snapshot = reactive({
  userName: "",
  nome: "",
  primeiroNome: "",
  ultimoNome: "",
  descricao: "",
  funcao: "Participante" as Funcao,
  imagemURL: "" as string | null,
  eventosMinistrados: 0,
  eventosParticipados: 0,
});

const { defineField, handleSubmit, errors, setValues } = useForm({
  validationSchema: toTypedSchema(profileSchema),
  initialValues: {
    titulo: "NaoInformado",
    primeiroNome: "",
    ultimoNome: "",
    email: "",
    telefone: "",
    funcao: "Participante",
    descricao: "",
    password: "",
    confirmePassword: "",
  },
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

const photoSrc = computed(() => {
  if (imgBroken.value || !snapshot.imagemURL) return PLACEHOLDER;
  return snapshot.imagemURL;
});

const isPalestrante = computed(
  () => (funcao.value ?? snapshot.funcao ?? "Participante") === "Palestrante",
);

const deleteRedeMessage = computed(() => {
  if (pendingRedeDelete.value === null) return "";
  const rede = redes.value[pendingRedeDelete.value];
  return `Deseja excluir a rede "${rede?.nome || "esta rede"}"?`;
});

function emptyRede(): RedeSocialPayload {
  return { id: 0, nome: "", url: "" };
}

function addRede() {
  redes.value.push(emptyRede());
}

function askDeleteRede(index: number) {
  pendingRedeDelete.value = index;
}

async function confirmDeleteRede() {
  const index = pendingRedeDelete.value;
  pendingRedeDelete.value = null;
  if (index === null) return;

  const rede = redes.value[index];
  if (!rede) return;

  redesError.value = null;
  redesSuccess.value = null;

  try {
    if (rede.id && rede.id > 0) {
      await redeSocialService.removeMine(rede.id);
    }
    redes.value.splice(index, 1);
    redesSuccess.value = "Rede social excluída.";
  } catch {
    redesError.value = "Erro ao excluir rede social.";
  }
}

function validateRedes(): boolean {
  for (const rede of redes.value) {
    const result = redeSocialFormSchema.safeParse(rede);
    if (!result.success) {
      redesError.value = "Preencha nome e URL de todas as redes.";
      return false;
    }
  }
  return true;
}

async function loadRedes() {
  redesLoading.value = true;
  redesError.value = null;
  try {
    const { data } = await redeSocialService.listMine();
    redes.value = data.map((rede) => ({
      id: rede.id ?? 0,
      nome: rede.nome,
      url: rede.url,
    }));
  } catch {
    redesError.value = "Não foi possível carregar redes sociais.";
  } finally {
    redesLoading.value = false;
  }
}

async function saveRedes() {
  if (!validateRedes()) return;

  savingRedes.value = true;
  redesError.value = null;
  redesSuccess.value = null;

  try {
    const { data } = await redeSocialService.saveMine(redes.value);
    redes.value = data.map((rede) => ({
      id: rede.id ?? 0,
      nome: rede.nome,
      url: rede.url,
    }));
    redesSuccess.value = "Redes sociais salvas com sucesso.";
  } catch (err) {
    if (isAxiosError(err)) {
      redesError.value = apiErrorMessage(
        err.response?.data,
        "Erro ao salvar redes sociais.",
      );
    } else {
      redesError.value = "Erro ao salvar redes sociais.";
    }
  } finally {
    savingRedes.value = false;
  }
}

function onImgError() {
  imgBroken.value = true;
}

function applySnapshot(profile: UserProfile) {
  snapshot.userName = profile.userName;
  snapshot.nome = profile.nome;
  snapshot.primeiroNome = profile.primeiroNome;
  snapshot.ultimoNome = profile.ultimoNome;
  snapshot.descricao = profile.descricao ?? "";
  snapshot.funcao = profile.funcao ?? "Participante";
  snapshot.imagemURL = profile.imagemURL ?? null;
  snapshot.eventosMinistrados = profile.eventosMinistrados ?? 0;
  snapshot.eventosParticipados = profile.eventosParticipados ?? 0;
  imgBroken.value = false;
  setValues({
    titulo: profile.titulo ?? "NaoInformado",
    primeiroNome: profile.primeiroNome ?? "",
    ultimoNome: profile.ultimoNome ?? "",
    email: profile.email,
    telefone: profile.telefone ?? "",
    funcao: profile.funcao ?? "Participante",
    descricao: profile.descricao ?? "",
    password: "",
    confirmePassword: "",
  });

  if (profile.funcao === "Palestrante") {
    void loadRedes();
  } else {
    redes.value = [];
  }
}

function cancelEdit() {
  if (lastProfile) applySnapshot(lastProfile);
  error.value = null;
  success.value = false;
  redesError.value = null;
  redesSuccess.value = null;
}

let lastProfile: UserProfile | null = null;

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
      userName: snapshot.userName,
    };
    if (formValues.password) payload.password = formValues.password;

    const profile = await accountService.updateProfile(payload);
    lastProfile = profile;
    applySnapshot(profile);
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
    lastProfile = profile;
    applySnapshot(profile);
  } catch {
    error.value = "Não foi possível carregar o perfil.";
  } finally {
    loading.value = false;
  }
});
</script>
