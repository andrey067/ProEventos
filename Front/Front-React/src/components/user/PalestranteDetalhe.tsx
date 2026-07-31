import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { FieldError } from "@/forms/components/FieldError";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  emptyPalestranteFormValues,
  palestranteSchema,
  type PalestranteFormValues,
} from "@/forms/schemas";
import type { Palestrante } from "@/models";
import { HttpError } from "@/services/http";
import { palestranteService } from "@/services/palestranteService";
import { AlertMotion } from "@/shared/motion";
import { apiErrorMessage } from "@/utils/apiErrorMessage";

const inputClass =
  "w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

export function PalestranteDetalhe() {
  const [palestranteId, setPalestranteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [missingProfile, setMissingProfile] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PalestranteFormValues>({
    resolver: zodResolver(palestranteSchema) as Resolver<PalestranteFormValues>,
    defaultValues: emptyPalestranteFormValues(),
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setMissingProfile(false);

      try {
        const me = await palestranteService.getMe();
        if (cancelled) return;

        setPalestranteId(me.id);
        reset({
          nome: me.nome ?? "",
          email: me.email ?? "",
          telefone: me.telefone ?? "",
          imagemURL: me.imagemURL ?? "",
          miniCurriculo: me.miniCurriculo ?? "",
        });
      } catch (err) {
        if (cancelled) return;

        if (err instanceof HttpError && err.status === 404) {
          setMissingProfile(true);
          setPalestranteId(null);
          setError("Salve o perfil com função Palestrante primeiro");
          return;
        }

        if (err instanceof HttpError) {
          setError(apiErrorMessage(err.message, "Erro ao carregar palestrante."));
        } else {
          setError("Erro ao carregar palestrante.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [reset]);

  async function onSubmit(values: PalestranteFormValues) {
    if (palestranteId == null) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const payload: Palestrante = {
      id: palestranteId,
      nome: values.nome,
      email: values.email,
      telefone: values.telefone,
      imagemURL: values.imagemURL,
      miniCurriculo: values.miniCurriculo,
    };

    try {
      await palestranteService.update(palestranteId, payload);
      setSuccess("Palestrante atualizado.");
    } catch (err) {
      if (err instanceof HttpError) {
        setError(apiErrorMessage(err.message, "Erro ao salvar palestrante."));
      } else {
        setError("Erro ao salvar palestrante.");
      }
    } finally {
      setSaving(false);
    }
  }

  const alertDangerClass =
    "rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger";
  const alertSuccessClass =
    "rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-accent-dark";

  if (loading) {
    return <p className="text-sm text-muted">Carregando detalhe palestrante…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <AlertMotion show={!!error} className={alertDangerClass}>
        {error}
      </AlertMotion>
      <AlertMotion show={!!success} className={alertSuccessClass}>
        {success}
      </AlertMotion>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <h2 className="border-b border-line pb-2 text-lg font-semibold">
          Detalhe Palestrante
        </h2>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Nome</span>
          <input className={inputClass} {...register("nome")} />
          <FieldError error={errors.nome} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">E-mail</span>
          <input className={inputClass} type="email" {...register("email")} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Telefone</span>
          <input className={inputClass} {...register("telefone")} />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">URL da imagem</span>
          <input
            className={inputClass}
            type="url"
            placeholder="https://..."
            {...register("imagemURL")}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Mini currículo</span>
          <textarea className={inputClass} rows={3} {...register("miniCurriculo")} />
        </label>

        <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:flex-wrap">
          <button
            type="submit"
            disabled={missingProfile || palestranteId == null || saving}
            className={`${btnPrimary} motion-press ml-auto w-full gap-2 sm:w-auto`}
          >
            <LoadingSpinner loading={saving} variant="button" />
            {saving ? "Salvando..." : "Salvar Alteração"}
          </button>
        </div>
      </form>
    </div>
  );
}
