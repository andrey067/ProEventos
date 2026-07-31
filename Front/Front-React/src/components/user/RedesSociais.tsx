import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { redeSocialSchema } from "@/forms/schemas/eventoSchema";
import type { RedeSocial } from "@/models";
import { redeSocialService } from "@/services/redeSocialService";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import {
  AlertMotion,
  ListStagger,
  ListStaggerItem,
  SkeletonShimmer,
} from "@/shared/motion";

const inputClass =
  "w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const btnSmAccent =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60";
const btnSmDanger =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-danger-border bg-panel px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft";
const alertDangerSmClass =
  "mb-3 rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger";
const alertSuccessSmClass =
  "mb-3 rounded-[length:var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm text-accent-dark";

function emptyRedeDraft(): RedeSocial {
  return { id: 0, nome: "", url: "" };
}

export function RedesSociais() {
  const [redes, setRedes] = useState<RedeSocial[]>([]);
  const [redesLoading, setRedesLoading] = useState(false);
  const [savingRedes, setSavingRedes] = useState(false);
  const [redesError, setRedesError] = useState<string | null>(null);
  const [redesSuccess, setRedesSuccess] = useState<string | null>(null);
  const [pendingRedeDelete, setPendingRedeDelete] = useState<{
    index: number;
    id: number;
    nome: string;
  } | null>(null);

  async function loadRedes() {
    setRedesLoading(true);
    setRedesError(null);
    try {
      const loaded = await redeSocialService.getMine();
      setRedes(loaded ?? []);
    } catch {
      setRedesError("Não foi possível carregar redes sociais.");
    } finally {
      setRedesLoading(false);
    }
  }

  useEffect(() => {
    void loadRedes();
  }, []);

  function validateRedes(items: RedeSocial[]): boolean {
    for (const rede of items) {
      const result = redeSocialSchema.safeParse(rede);
      if (!result.success) {
        setRedesError("Preencha nome e URL de todas as redes.");
        return false;
      }
    }
    return true;
  }

  async function saveRedes() {
    if (!validateRedes(redes)) return;

    setSavingRedes(true);
    setRedesError(null);
    setRedesSuccess(null);

    try {
      const saved = await redeSocialService.saveMine(redes);
      setRedes(saved);
      setRedesSuccess("Redes sociais salvas com sucesso.");
    } catch {
      setRedesError("Erro ao salvar redes sociais.");
    } finally {
      setSavingRedes(false);
    }
  }

  async function confirmDeleteRede() {
    if (!pendingRedeDelete) return;
    const { index, id: redeId } = pendingRedeDelete;
    setPendingRedeDelete(null);
    setRedesError(null);
    setRedesSuccess(null);

    try {
      if (redeId > 0) {
        await redeSocialService.deleteMine(redeId);
      }
      setRedes((prev) => prev.filter((_, i) => i !== index));
      setRedesSuccess("Rede social excluída.");
    } catch {
      setRedesError("Erro ao excluir rede social.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Redes sociais</h3>
        <button
          type="button"
          className={btnSmAccent}
          onClick={() => setRedes((prev) => [...prev, emptyRedeDraft()])}
        >
          + Rede
        </button>
      </div>

      <AlertMotion show={!!redesError} className={alertDangerSmClass}>
        {redesError}
      </AlertMotion>
      <AlertMotion show={!!redesSuccess} className={alertSuccessSmClass}>
        {redesSuccess}
      </AlertMotion>

      <LoadingSpinner loading={redesLoading} variant="inline" label="Carregando redes..." />

      {redesLoading ? (
        <SkeletonShimmer rows={3} />
      ) : redes.length > 0 ? (
        <ListStagger>
          <div className="flex flex-col gap-2">
            {redes.map((rede, index) => (
              <ListStaggerItem key={`${rede.id}-${index}`} index={index}>
                <div className="grid gap-2 rounded-[length:var(--radius-control)] border border-line bg-surface p-3 md:grid-cols-[1fr_1fr_auto]">
                  <input
                    className={inputClass}
                    value={rede.nome}
                    placeholder="Nome"
                    onChange={(e) =>
                      setRedes((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, nome: e.target.value } : item,
                        ),
                      )
                    }
                  />
                  <input
                    className={inputClass}
                    value={rede.url}
                    placeholder="URL"
                    onChange={(e) =>
                      setRedes((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, url: e.target.value } : item,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className={btnSmDanger}
                    onClick={() =>
                      setPendingRedeDelete({
                        index,
                        id: rede.id,
                        nome: rede.nome,
                      })
                    }
                  >
                    Excluir
                  </button>
                </div>
              </ListStaggerItem>
            ))}
          </div>
        </ListStagger>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          disabled={savingRedes || redesLoading}
          className={`${btnPrimary} motion-press gap-2`}
          onClick={() => void saveRedes()}
        >
          <LoadingSpinner loading={savingRedes} variant="button" />
          {savingRedes ? "Salvando..." : "Salvar Redes"}
        </button>
      </div>

      <ConfirmDialog
        open={pendingRedeDelete !== null}
        title="Excluir rede social"
        message={
          pendingRedeDelete
            ? `Deseja excluir a rede "${pendingRedeDelete.nome || "esta rede"}"?`
            : ""
        }
        confirmLabel="Excluir"
        onConfirm={() => void confirmDeleteRede()}
        onCancel={() => setPendingRedeDelete(null)}
      />
    </div>
  );
}
