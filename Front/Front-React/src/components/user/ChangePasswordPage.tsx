import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z.string().min(1, "Nova senha é obrigatória"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export function ChangePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await accountService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      setSuccess("Senha alterada com sucesso.");
    } catch (err) {
      if (err instanceof HttpError && (err.status === 400 || err.status === 409)) {
        setError(err.message);
      } else {
        setError("Erro ao alterar senha.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Alterar senha</h1>
          <p className="mt-1 text-sm text-muted">
            Informe a senha atual e escolha uma nova.
          </p>
        </div>
        <Link to="/perfil" className={btnOutline}>
          Voltar ao perfil
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
          <span className="font-medium">Senha atual</span>
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            {...register("currentPassword")}
          />
          <FieldError error={errors.currentPassword} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Nova senha</span>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            {...register("newPassword")}
          />
          <FieldError error={errors.newPassword} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Confirmar nova senha</span>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
          <FieldError error={errors.confirmPassword} />
        </label>
        <button type="submit" disabled={submitting} className={btnPrimary}>
          {submitting ? "Salvando..." : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
