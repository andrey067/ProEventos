import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FieldError } from "@/forms/components/FieldError";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AlertMotion } from "@/shared/motion";
import {
  FUNCAO_OPTIONS,
  TITULO_OPTIONS,
  type Funcao,
  type Titulo,
  type UserProfile,
} from "@/models";
import { accountService } from "@/services/accountService";
import { HttpError } from "@/services/http";

const inputClass =
  "w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface";

export const profileSchema = z
  .object({
    titulo: z.string().min(1),
    primeiroNome: z.string().trim().min(1, "Primeiro nome é obrigatório"),
    ultimoNome: z.string().trim().min(1, "Último nome é obrigatório"),
    email: z.string().trim().min(1, "E-mail é obrigatório").email("E-mail inválido"),
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

type ProfileFormValues = z.infer<typeof profileSchema>;

export type ProfileFormPreview = {
  primeiroNome: string;
  ultimoNome: string;
  descricao: string;
  funcao: Funcao;
};

function toFormValues(profile: UserProfile): ProfileFormValues {
  return {
    titulo: profile.titulo ?? "NaoInformado",
    primeiroNome: profile.primeiroNome ?? "",
    ultimoNome: profile.ultimoNome ?? "",
    email: profile.email,
    telefone: profile.telefone ?? "",
    funcao: profile.funcao ?? "Participante",
    descricao: profile.descricao ?? "",
    password: "",
    confirmePassword: "",
  };
}

type Props = {
  profile: UserProfile;
  onPreview: (p: ProfileFormPreview) => void;
  onSaved: (p: UserProfile) => void;
  onCancelled: () => void;
};

export function PerfilDetalhe({ profile, onPreview, onSaved, onCancelled }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(profile),
  });

  const onPreviewRef = useRef(onPreview);
  onPreviewRef.current = onPreview;

  const primeiroNome = watch("primeiroNome");
  const ultimoNome = watch("ultimoNome");
  const descricao = watch("descricao");
  const funcao = watch("funcao");

  useEffect(() => {
    onPreviewRef.current({
      primeiroNome: primeiroNome ?? "",
      ultimoNome: ultimoNome ?? "",
      descricao: descricao ?? "",
      funcao: (funcao ?? "Participante") as Funcao,
    });
  }, [primeiroNome, ultimoNome, descricao, funcao]);

  useEffect(() => {
    reset(toFormValues(profile));
    setError(null);
    setSuccess(false);
  }, [profile, reset]);

  async function onSubmit(values: ProfileFormValues) {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await accountService.updateProfile({
        userName: profile.userName,
        email: values.email,
        primeiroNome: values.primeiroNome,
        ultimoNome: values.ultimoNome,
        titulo: values.titulo as Titulo,
        funcao: values.funcao as Funcao,
        telefone: values.telefone,
        descricao: values.descricao,
        ...(values.password ? { password: values.password } : {}),
      });
      setSuccess(true);
      onSaved(updated);
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

  function cancelEdit() {
    reset(toFormValues(profile));
    setError(null);
    setSuccess(false);
    onCancelled();
  }

  const alertDangerClass =
    "rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger";
  const alertSuccessClass =
    "rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-accent-dark";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
    >
      <AlertMotion show={!!error} className={alertDangerClass}>
        {error}
      </AlertMotion>
      <AlertMotion show={success} className={alertSuccessClass}>
        Perfil atualizado com sucesso.
      </AlertMotion>

      <h2 className="border-b border-line pb-2 text-lg font-semibold">
        Detalhe Perfil
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Título</span>
          <select className={inputClass} {...register("titulo")}>
            {TITULO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Primeiro Nome</span>
          <input className={inputClass} {...register("primeiroNome")} />
          <FieldError error={errors.primeiroNome} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Último nome</span>
          <input className={inputClass} {...register("ultimoNome")} />
          <FieldError error={errors.ultimoNome} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">E-mail</span>
          <input className={inputClass} type="email" {...register("email")} />
          <FieldError error={errors.email} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Telefone</span>
          <input className={inputClass} {...register("telefone")} />
          <FieldError error={errors.telefone} />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Função</span>
          <select className={inputClass} {...register("funcao")}>
            {FUNCAO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">Descrição</span>
        <textarea className={inputClass} rows={3} {...register("descricao")} />
        <FieldError error={errors.descricao} />
      </label>

      <div>
        <h3 className="border-b border-line pb-2 pt-2 text-lg font-semibold">
          Mudar Senha
        </h3>
        <p className="mt-2 text-sm text-muted">
          Caso mude de senha, preencha os campos abaixo:
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Senha</span>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Confirmar Senha</span>
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            {...register("confirmePassword")}
          />
          <FieldError error={errors.confirmePassword} />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-line pt-4">
        <button type="button" className={btnOutline} onClick={cancelEdit}>
          Cancelar Alteração
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`${btnPrimary} motion-press ml-auto gap-2`}
        >
          <LoadingSpinner loading={saving} variant="button" />
          {saving ? "Salvando..." : "Salvar Alteração"}
        </button>
      </div>
    </form>
  );
}
