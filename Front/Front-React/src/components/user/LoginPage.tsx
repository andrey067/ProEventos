import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FieldError } from "@/forms/components/FieldError";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { accountService } from "@/services/accountService";
import { HttpError } from "@/services/http";

const inputClass =
  "w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary =
  "inline-flex w-full items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const btnLink =
  "text-sm font-medium text-accent-dark hover:underline";

const loginSchema = z.object({
  userName: z.string().trim().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? "/eventos";

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userName: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setSubmitting(true);
    setError(null);

    try {
      await accountService.login(values);
      void navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        setError(err.message || "Usuário ou senha inválidos.");
      } else {
        setError("Não foi possível entrar. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <p className="mt-1 text-sm text-muted">
          Entre com seu usuário para editar eventos e palestrantes.
        </p>
      </div>

      {error && (
        <p className="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 rounded-[length:var(--radius-control)] border border-line bg-panel p-6"
        noValidate
      >
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Usuário</span>
          <input
            className={inputClass}
            autoComplete="username"
            {...register("userName")}
          />
          <FieldError error={errors.userName} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Senha</span>
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          <FieldError error={errors.password} />
        </label>
        <button type="submit" disabled={submitting} className={`${btnPrimary} gap-2`}>
          <LoadingSpinner loading={submitting} variant="button" />
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Não tem conta?{" "}
        <Link to="/register" className={btnLink}>
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
