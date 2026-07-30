import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { FieldError } from "@/forms/components/FieldError";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AlertMotion, PageEnter, PanelEnter } from "@/shared/motion";
import { accountService } from "@/services/accountService";
import { HttpError } from "@/services/http";

const inputClass =
  "w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2.5 text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary =
  "mt-1 inline-flex w-full items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2.5 text-sm font-medium text-white transition-[transform,background-color] hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const btnLink =
  "text-sm font-medium text-accent-dark hover:underline";

const registerSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  userName: z.string().trim().min(1, "Usuário é obrigatório"),
  email: z.string().trim().min(1, "E-mail é obrigatório").email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
  asPalestrante: z.boolean(),
  miniCurriculo: z.string().optional(),
  telefone: z.string().optional(),
  imagemURL: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nome: "",
      userName: "",
      email: "",
      password: "",
      asPalestrante: false,
      miniCurriculo: "",
      telefone: "",
      imagemURL: "",
    },
  });

  const asPalestrante = watch("asPalestrante");

  async function onSubmit(values: RegisterFormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const base = {
        nome: values.nome,
        userName: values.userName,
        email: values.email,
        password: values.password,
      };
      if (values.asPalestrante) {
        await accountService.registerPalestrante({
          ...base,
          miniCurriculo: values.miniCurriculo,
          telefone: values.telefone,
          imagemURL: values.imagemURL,
        });
      } else {
        await accountService.register(base);
      }
      void navigate("/eventos", { replace: true });
    } catch (err) {
      if (err instanceof HttpError && (err.status === 400 || err.status === 409)) {
        setError(err.message);
      } else {
        setError("Erro ao cadastrar. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const alertDangerClass =
    "rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger";

  return (
    <PageEnter>
      <section className="-mx-4 -my-6 grid min-h-[calc(100dvh-4.5rem)] grid-cols-1 overflow-hidden md:-my-8 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]">
      <aside
        className="hidden min-h-full items-center justify-center bg-surface px-3 py-8 sm:px-6 sm:py-10 md:flex lg:px-10 lg:py-12"
        aria-hidden="true"
      >
        <img
          src="/images/signup-illustration.png"
          alt=""
          className="h-auto w-full max-w-[10rem] object-contain sm:max-w-[18rem] md:max-w-[22rem] lg:max-w-[26rem]"
          width={450}
          height={450}
        />
      </aside>

      <div className="flex items-center justify-center bg-surface px-3 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="flex w-full max-w-md flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              Cadastro
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              Crie uma conta para gerenciar eventos e palestrantes.
            </p>
          </header>

          <AlertMotion show={!!error} className={alertDangerClass}>
            {error}
          </AlertMotion>

          <PanelEnter className="flex flex-col gap-5">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
              noValidate
            >
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink">Nome</span>
              <input className={inputClass} {...register("nome")} />
              <FieldError error={errors.nome} />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink">Usuário</span>
              <input
                className={inputClass}
                autoComplete="username"
                {...register("userName")}
              />
              <FieldError error={errors.userName} />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink">E-mail</span>
              <input
                className={inputClass}
                type="email"
                autoComplete="email"
                {...register("email")}
              />
              <FieldError error={errors.email} />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink">Senha</span>
              <input
                className={inputClass}
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
              <FieldError error={errors.password} />
            </label>

            <label className="flex items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-line text-accent focus:ring-accent/20"
                {...register("asPalestrante")}
              />
              <span className="font-medium text-ink">
                Registrar como palestrante
              </span>
            </label>

            {asPalestrante && (
              <>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-ink">Mini currículo</span>
                  <textarea
                    className={inputClass}
                    rows={3}
                    {...register("miniCurriculo")}
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-ink">Telefone</span>
                  <input className={inputClass} {...register("telefone")} />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-ink">
                    URL da imagem (opcional)
                  </span>
                  <input
                    className={inputClass}
                    type="url"
                    placeholder="https://..."
                    {...register("imagemURL")}
                  />
                </label>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`${btnPrimary} motion-press gap-2`}
            >
              <LoadingSpinner loading={submitting} variant="button" />
              {submitting ? "Cadastrando..." : "Cadastrar"}
            </button>
            </form>
          </PanelEnter>

          <p className="text-center text-sm text-muted">
            Já tem conta?{" "}
            <Link to="/login" className={btnLink}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
      </section>
    </PageEnter>
  );
}
