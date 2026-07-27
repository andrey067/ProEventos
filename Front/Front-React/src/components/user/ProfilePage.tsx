import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { FieldError } from "@/forms/components/FieldError";
import { accountService } from "@/services/accountService";
import { HttpError } from "@/services/http";

const inputClass =
  "w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface";

const profileSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  userName: z.string().trim().min(1, "Usuário é obrigatório"),
  email: z.string().trim().min(1, "E-mail é obrigatório").email("E-mail inválido"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nome: "", userName: "", email: "" },
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const profile = await accountService.getProfile();
        reset(profile);
      } catch {
        setError("Não foi possível carregar o perfil.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [reset]);

  async function onSubmit(values: ProfileFormValues) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await accountService.updateProfile(values);
      reset(updated);
      setSuccess("Perfil atualizado com sucesso.");
    } catch (err) {
      if (err instanceof HttpError && (err.status === 400 || err.status === 409)) {
        setError(err.message);
      } else {
        setError("Erro ao salvar perfil.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-line/60" />
        <div className="h-40 animate-pulse rounded bg-line/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meu perfil</h1>
          <p className="mt-1 text-sm text-muted">
            Atualize seus dados de acesso.
          </p>
        </div>
        <Link to="/perfil/senha" className={btnOutline}>
          Alterar senha
        </Link>
      </div>

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
        className="flex flex-col gap-4 rounded-[length:var(--radius-control)] border border-line bg-panel p-6"
        noValidate
      >
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Nome</span>
          <input className={inputClass} {...register("nome")} />
          <FieldError error={errors.nome} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Usuário</span>
          <input className={inputClass} {...register("userName")} />
          <FieldError error={errors.userName} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">E-mail</span>
          <input
            className={inputClass}
            type="email"
            {...register("email")}
          />
          <FieldError error={errors.email} />
        </label>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
