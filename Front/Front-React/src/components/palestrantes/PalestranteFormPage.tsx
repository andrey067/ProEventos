import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { FieldError } from "@/forms/components/FieldError";
import {
  emptyPalestranteFormValues,
  palestranteSchema,
  type PalestranteFormValues,
} from "@/forms/schemas";
import type { RedeSocial } from "@/models";
import { canWrite } from "@/services/authToken";
import { palestranteService } from "@/services/palestranteService";
import { redeSocialService } from "@/services/redeSocialService";
import { isRemoteImageUrl } from "@/utils/imageUrl";

const inputClass =
  "w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface";
const btnSmAccent =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60";
const btnSmDanger =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-danger-border bg-panel px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60";
const panelClass =
  "min-w-0 rounded-[length:var(--radius-control)] border border-line bg-panel p-4 sm:p-6";

function emptyRedeDraft(palestranteId = 0): RedeSocial {
  return { id: 0, nome: "", url: "", palestranteId };
}

export function PalestranteFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new" || Number(id) === 0;
  const writeAllowed = canWrite();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [redes, setRedes] = useState<RedeSocial[]>([]);
  const [redesLoading, setRedesLoading] = useState(false);
  const [pendingRedeDelete, setPendingRedeDelete] = useState<{
    index: number;
    id: number;
    nome: string;
  } | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [palestranteId, setPalestranteId] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PalestranteFormValues>({
    resolver: zodResolver(palestranteSchema) as Resolver<PalestranteFormValues>,
    defaultValues: emptyPalestranteFormValues(),
  });

  const imagemURL = watch("imagemURL");
  const showPreview = isRemoteImageUrl(imagemURL) && !imageLoadFailed;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [imagemURL]);

  useEffect(() => {
    if (isNew) {
      reset(emptyPalestranteFormValues());
      setRedes([]);
      setPalestranteId(0);
      setLoading(false);
      return;
    }

    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) {
      setError("ID inválido.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const palestrante = await palestranteService.getById(parsedId);
        setPalestranteId(palestrante.id);
        reset({
          nome: palestrante.nome,
          miniCurriculo: palestrante.miniCurriculo,
          imagemURL: palestrante.imagemURL,
          telefone: palestrante.telefone,
          email: palestrante.email,
        });
        try {
          setRedesLoading(true);
          const loaded = await redeSocialService.getByPalestranteId(
            palestrante.id,
          );
          setRedes(loaded);
        } catch {
          setRedes(palestrante.redesSociais ?? []);
        } finally {
          setRedesLoading(false);
        }
      } catch {
        setError("Palestrante não encontrado.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [isNew, id, reset]);

  async function onSubmit(values: PalestranteFormValues) {
    if (!writeAllowed) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const saved = isNew
        ? await palestranteService.create(values)
        : await palestranteService.update(palestranteId, {
            id: palestranteId,
            ...values,
          });

      if (redes.length > 0) {
        await redeSocialService.saveByPalestranteId(
          saved.id,
          redes.map((r) => ({ ...r, palestranteId: saved.id })),
        );
      }

      void navigate("/palestrantes");
    } catch {
      setError("Erro ao salvar palestrante.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteRede() {
    if (!pendingRedeDelete) return;
    const { index, id: redeId } = pendingRedeDelete;
    setPendingRedeDelete(null);
    setError(null);
    setSuccess(null);
    try {
      if (redeId > 0 && palestranteId > 0) {
        await redeSocialService.deleteByPalestranteId(palestranteId, redeId);
      }
      setRedes((prev) => prev.filter((_, i) => i !== index));
      setSuccess("Rede social excluída com sucesso.");
    } catch {
      setError("Erro ao excluir rede social.");
    }
  }

  if (loading) {
    return <LoadingSpinner loading variant="page" />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isNew ? "Novo palestrante" : "Editar palestrante"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Formulário com dados e redes sociais.
          </p>
        </div>
        <Link to="/palestrantes" className={btnOutline}>
          Voltar
        </Link>
      </div>

      {!writeAllowed && (
        <p className="rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted">
          Acesso somente leitura. É necessária a role User para cadastrar ou
          editar palestrantes.
        </p>
      )}

      {error && (
        <p className="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-accent-dark">
          {success}
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
        noValidate
      >
        <section className={`${panelClass} grid gap-4 md:grid-cols-2`}>
          <h2 className="text-lg font-medium text-accent-dark md:col-span-2">
            Dados do palestrante
          </h2>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="font-medium">Nome</span>
            <input
              className={inputClass}
              disabled={!writeAllowed}
              {...register("nome")}
            />
            <FieldError error={errors.nome} />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="font-medium">Mini currículo</span>
            <textarea
              className={inputClass}
              disabled={!writeAllowed}
              {...register("miniCurriculo")}
              rows={3}
            />
            <FieldError error={errors.miniCurriculo} />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Telefone</span>
            <input
              className={inputClass}
              disabled={!writeAllowed}
              {...register("telefone")}
            />
            <FieldError error={errors.telefone} />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium">E-mail</span>
            <input
              className={inputClass}
              type="email"
              disabled={!writeAllowed}
              {...register("email")}
            />
            <FieldError error={errors.email} />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="font-medium">URL da imagem</span>
            <input
              className={inputClass}
              type="url"
              placeholder="https://..."
              disabled={!writeAllowed}
              {...register("imagemURL")}
            />
            <FieldError error={errors.imagemURL} />
          </label>
          <div className="md:col-span-2">
            {showPreview ? (
              <img
                src={imagemURL}
                alt="Preview do palestrante"
                className="h-32 w-32 rounded object-cover"
                onError={() => setImageLoadFailed(true)}
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded border border-line bg-surface text-center text-xs text-muted">
                Sem imagem
              </div>
            )}
          </div>
        </section>

        <section className={panelClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-accent-dark">
              Redes sociais
            </h2>
            {writeAllowed && (
              <button
                type="button"
                className={btnSmAccent}
                onClick={() =>
                  setRedes((prev) => [
                    ...prev,
                    emptyRedeDraft(palestranteId),
                  ])
                }
              >
                + Rede
              </button>
            )}
          </div>
          <LoadingSpinner
            loading={redesLoading}
            variant="inline"
            label="Carregando redes..."
          />
          {redes.length === 0 ? (
            <p className="text-sm text-muted">Nenhuma rede cadastrada.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {redes.map((rede, index) => (
                <div
                  key={`${rede.id}-${index}`}
                  className="grid gap-3 rounded-[length:var(--radius-control)] border border-line bg-surface p-3 md:grid-cols-[1fr_1fr_auto]"
                >
                  <input
                    className={inputClass}
                    placeholder="Nome"
                    disabled={!writeAllowed}
                    value={rede.nome}
                    onChange={(e) => {
                      const nome = e.target.value;
                      setRedes((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, nome } : r,
                        ),
                      );
                    }}
                  />
                  <input
                    className={inputClass}
                    placeholder="URL"
                    disabled={!writeAllowed}
                    value={rede.url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setRedes((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, url } : r,
                        ),
                      );
                    }}
                  />
                  {writeAllowed && (
                    <button
                      type="button"
                      className={btnSmDanger}
                      onClick={() =>
                        setPendingRedeDelete({
                          index,
                          id: rede.id,
                          nome: rede.nome || "rede",
                        })
                      }
                    >
                      Excluir
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {writeAllowed && (
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
            <button
              type="button"
              className={btnOutline}
              onClick={() => void navigate("/palestrantes")}
            >
              Cancelar
            </button>
          </div>
        )}
      </form>

      <ConfirmDialog
        open={pendingRedeDelete !== null}
        title="Excluir rede social"
        message={
          pendingRedeDelete
            ? `Deseja excluir a rede "${pendingRedeDelete.nome}"?`
            : ""
        }
        confirmLabel="Excluir"
        onConfirm={() => void confirmDeleteRede()}
        onCancel={() => setPendingRedeDelete(null)}
      />
    </div>
  );
}
