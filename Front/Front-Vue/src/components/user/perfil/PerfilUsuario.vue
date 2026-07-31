<template>
  <PageEnter>
  <div class="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Perfil</h1>
      <p class="mt-1 text-sm text-muted">Atualize seus dados de conta.</p>
    </div>

    <AlertMotion
      :show="!!error"
      class="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger"
    >
      {{ error }}
    </AlertMotion>

    <LoadingSpinner :active="loading" variant="page" />

    <div v-if="!loading && profile" class="grid gap-6 lg:grid-cols-[280px_1fr]">
      <PanelEnter
        class-name="flex flex-col overflow-hidden rounded-[length:var(--radius-control)] border border-line bg-panel"
      >
      <aside class="contents">
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
            {{ cardView.nome || `${cardView.primeiroNome} ${cardView.ultimoNome}` }}
          </p>
          <p class="text-muted">{{ cardView.descricao }}</p>
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
      </PanelEnter>

      <PanelEnter
        class-name="flex flex-col rounded-[length:var(--radius-control)] border border-line bg-panel"
      >
        <div role="tablist" aria-label="Seções do perfil" class="flex gap-1 border-b border-line px-2 pt-2">
          <button
            type="button"
            id="tab-perfil"
            role="tab"
            data-tab="perfil"
            aria-controls="panel-perfil"
            :aria-selected="activeTab === 'perfil'"
            class="px-4 py-2 text-sm font-medium"
            :class="{
              'border-b-2 border-accent text-accent': activeTab === 'perfil',
              'text-muted': activeTab !== 'perfil',
            }"
            @click="selectTab('perfil')"
          >
            Perfil
          </button>
          <template v-if="ehPalestrante">
            <button
              type="button"
              id="tab-palestrante"
              role="tab"
              data-tab="palestrante"
              aria-controls="panel-palestrante"
              :aria-selected="activeTab === 'palestrante'"
              class="px-4 py-2 text-sm font-medium"
              :class="{
                'border-b-2 border-accent text-accent': activeTab === 'palestrante',
                'text-muted': activeTab !== 'palestrante',
              }"
              @click="selectTab('palestrante')"
            >
              Palestrante
            </button>
            <button
              type="button"
              id="tab-rede-social"
              role="tab"
              data-tab="rede-social"
              aria-controls="panel-rede-social"
              :aria-selected="activeTab === 'rede-social'"
              class="px-4 py-2 text-sm font-medium"
              :class="{
                'border-b-2 border-accent text-accent': activeTab === 'rede-social',
                'text-muted': activeTab !== 'rede-social',
              }"
              @click="selectTab('rede-social')"
            >
              Rede Social
            </button>
          </template>
        </div>

        <div class="border border-t-0 border-transparent p-6">
          <div
            id="panel-perfil"
            role="tabpanel"
            aria-labelledby="tab-perfil"
            v-show="activeTab === 'perfil'"
          >
            <PerfilDetalhe
              :profile="profile"
              @form-preview="onFormPreview"
              @saved="onPerfilSaved"
              @cancelled="onPerfilCancelled"
            />
          </div>
          <div
            v-if="ehPalestrante"
            id="panel-palestrante"
            role="tabpanel"
            aria-labelledby="tab-palestrante"
            v-show="activeTab === 'palestrante'"
          >
            <PalestranteDetalhe />
          </div>
          <div
            v-if="ehPalestrante"
            id="panel-rede-social"
            role="tabpanel"
            aria-labelledby="tab-rede-social"
            v-show="activeTab === 'rede-social'"
          >
            <RedesSociais />
          </div>
        </div>
      </PanelEnter>
    </div>
  </div>
  </PageEnter>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import accountService from "../../../services/accountService";
import LoadingSpinner from "../../common/LoadingSpinner.vue";
import PageEnter from "../../../shared/motion/PageEnter.vue";
import AlertMotion from "../../../shared/motion/AlertMotion.vue";
import PanelEnter from "../../../shared/motion/PanelEnter.vue";
import type { Funcao, UserProfile } from "../../../Models/identity/User";
import PerfilDetalhe, { type ProfileFormPreview } from "./PerfilDetalhe.vue";
import PalestranteDetalhe from "./PalestranteDetalhe.vue";
import RedesSociais from "./RedesSociais.vue";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#e5e7eb" width="120" height="120"/><circle cx="60" cy="46" r="22" fill="#9ca3af"/><ellipse cx="60" cy="100" rx="36" ry="28" fill="#9ca3af"/></svg>`,
  );

type ProfileTab = "perfil" | "palestrante" | "rede-social";

const loading = ref(true);
const error = ref<string | null>(null);
const imgBroken = ref(false);
const profile = ref<UserProfile | null>(null);
const ehPalestrante = ref(false);
const activeTab = ref<ProfileTab>("perfil");

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

const cardView = reactive({
  nome: "",
  primeiroNome: "",
  ultimoNome: "",
  descricao: "",
});

const photoSrc = computed(() => {
  if (imgBroken.value || !snapshot.imagemURL) return PLACEHOLDER;
  return snapshot.imagemURL;
});

function onImgError() {
  imgBroken.value = true;
}

function applySnapshot(p: UserProfile) {
  profile.value = p;
  snapshot.userName = p.userName;
  snapshot.nome = p.nome;
  snapshot.primeiroNome = p.primeiroNome;
  snapshot.ultimoNome = p.ultimoNome;
  snapshot.descricao = p.descricao ?? "";
  snapshot.funcao = p.funcao ?? "Participante";
  snapshot.imagemURL = p.imagemURL ?? null;
  snapshot.eventosMinistrados = p.eventosMinistrados ?? 0;
  snapshot.eventosParticipados = p.eventosParticipados ?? 0;
  cardView.nome = p.nome;
  cardView.primeiroNome = p.primeiroNome;
  cardView.ultimoNome = p.ultimoNome;
  cardView.descricao = p.descricao ?? "";
  ehPalestrante.value = p.funcao === "Palestrante";
  imgBroken.value = false;
  if (!ehPalestrante.value && activeTab.value !== "perfil") {
    activeTab.value = "perfil";
  }
}

function onFormPreview(preview: ProfileFormPreview) {
  cardView.nome = "";
  cardView.primeiroNome = preview.primeiroNome;
  cardView.ultimoNome = preview.ultimoNome;
  cardView.descricao = preview.descricao;
  const was = ehPalestrante.value;
  ehPalestrante.value = preview.funcao === "Palestrante";
  if (was && !ehPalestrante.value && activeTab.value !== "perfil") {
    activeTab.value = "perfil";
  }
}

function onPerfilSaved(p: UserProfile) {
  applySnapshot(p);
}

function onPerfilCancelled() {
  if (profile.value) applySnapshot(profile.value);
}

function selectTab(tab: ProfileTab) {
  if (tab !== "perfil" && !ehPalestrante.value) return;
  activeTab.value = tab;
}

onMounted(async () => {
  try {
    const p = await accountService.getProfile();
    applySnapshot(p);
  } catch {
    error.value = "Não foi possível carregar o perfil.";
  } finally {
    loading.value = false;
  }
});

defineExpose({
  onFormPreview,
  activeTab,
  ehPalestrante,
  cardView,
  onImgError,
});
</script>
