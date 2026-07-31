<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Redes sociais</h3>
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft"
        @click="addRede"
      >
        + Rede
      </button>
    </div>

    <AlertMotion
      :show="!!redesError"
      class="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      {{ redesError }}
    </AlertMotion>
    <AlertMotion
      :show="!!redesSuccess"
      class="rounded-[length:var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm text-accent-dark"
    >
      {{ redesSuccess }}
    </AlertMotion>

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

    <div class="flex justify-end">
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
import { computed, onMounted, ref } from "vue";
import { isAxiosError } from "axios";
import redeSocialService, {
  type RedeSocialPayload,
} from "../../../services/redeSocialService";
import LoadingSpinner from "../../common/LoadingSpinner.vue";
import ConfirmDialog from "../../../shared/ConfirmDialog.vue";
import AlertMotion from "../../../shared/motion/AlertMotion.vue";
import { redeSocialFormSchema } from "../../../forms/schemas/eventoSchema";
import { apiErrorMessage } from "../../../utils/apiErrorMessage";

const redesLoading = ref(false);
const savingRedes = ref(false);
const redesError = ref<string | null>(null);
const redesSuccess = ref<string | null>(null);
const redes = ref<RedeSocialPayload[]>([]);
const pendingRedeDelete = ref<number | null>(null);

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
    redes.value = data.map((rede: RedeSocialPayload) => ({
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

onMounted(() => {
  void loadRedes();
});
</script>
