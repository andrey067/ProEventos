import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { z } from "zod";
import { FieldError } from "@/forms/components/FieldError";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import { redeSocialSchema } from "@/forms/schemas/eventoSchema";
import {
  FUNCAO_OPTIONS,
  TITULO_OPTIONS,
  type Funcao,
  type RedeSocial,
  type Titulo,
  type UserProfile,
} from "@/models";
import { accountService } from "@/services/accountService";
import { redeSocialService } from "@/services/redeSocialService";
import { HttpError } from "@/services/http";

const inputClass =
  "w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface";
const btnSmAccent =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60";
const btnSmDanger =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-danger-border bg-panel px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft";

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#e5e7eb" width="120" height="120"/><circle cx="60" cy="46" r="22" fill="#9ca3af"/><ellipse cx="60" cy="100" rx="36" ry="28" fill="#9ca3af"/></svg>`,
  );

const profileSchema = z
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

function emptyRedeDraft(): RedeSocial {
  return { id: 0, nome: "", url: "" };
}

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

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<UserProfile | null>(null);
  const [imgBroken, setImgBroken] = useState(false);
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      titulo: "NaoInformado",
      primeiroNome: "",
      ultimoNome: "",
      email: "",
      telefone: "",
      funcao: "Participante",
      descricao: "",
      password: "",
      confirmePassword: "",
    },
  });

  const funcaoValue = watch("funcao");
  const isPalestrante = useMemo(
    () => (funcaoValue ?? snapshot?.funcao ?? "Participante") === "Palestrante",
    [funcaoValue, snapshot?.funcao],
  );

  async function loadRedes() {
    setRedesLoading(true);
    setRedesError(null);
    try {
      const loaded = await redeSocialService.getMine();
      setRedes(loaded);
    } catch {
      setRedesError("Não foi possível carregar redes sociais.");
    } finally {
      setRedesLoading(false);
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const profile = await accountService.getProfile();
        setSnapshot(profile);
        reset(toFormValues(profile));
        setImgBroken(false);
        if (profile.funcao === "Palestrante") {
          await loadRedes();
        } else {
          setRedes([]);
        }
      } catch {
        setError("Não foi possível carregar o perfil.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [reset]);

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

  async function onSubmit(values: ProfileFormValues) {
    if (!snapshot) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await accountService.updateProfile({
        userName: snapshot.userName,
        email: values.email,
        primeiroNome: values.primeiroNome,
        ultimoNome: values.ultimoNome,
        titulo: values.titulo as Titulo,
        funcao: values.funcao as Funcao,
        telefone: values.telefone,
        descricao: values.descricao,
        ...(values.password ? { password: values.password } : {}),
      });
      setSnapshot(updated);
      reset(toFormValues(updated));
      setImgBroken(false);
      if (updated.funcao === "Palestrante") {
        await loadRedes();
      } else {
        setRedes([]);
      }
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

  function cancelEdit() {
    if (snapshot) {
      reset(toFormValues(snapshot));
      if (snapshot.funcao === "Palestrante") {
        void loadRedes();
      } else {
        setRedes([]);
      }
    }
    setError(null);
    setSuccess(null);
    setRedesError(null);
    setRedesSuccess(null);
  }

  if (loading) {
    return <LoadingSpinner loading variant="page" />;
  }

  const photoSrc =
    imgBroken || !snapshot?.imagemURL ? PLACEHOLDER : snapshot.imagemURL;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="mt-1 text-sm text-muted">Atualize seus dados de conta.</p>
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

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col overflow-hidden rounded-[length:var(--radius-control)] border border-line bg-panel">
          <div className="flex flex-col items-center gap-3 px-4 pt-6">
            <img
              src={photoSrc}
              alt="Foto de perfil"
              className="h-28 w-28 rounded-full object-cover ring-1 ring-line"
              onError={() => setImgBroken(true)}
            />
            <p className="text-lg font-medium text-muted">@{snapshot?.userName}</p>
          </div>
          <div className="flex flex-col gap-2 px-4 py-4 text-sm">
            <p>
              <span className="font-semibold">Nome:</span>{" "}
              {snapshot?.nome ||
                `${snapshot?.primeiroNome ?? ""} ${snapshot?.ultimoNome ?? ""}`}
            </p>
            <p className="text-muted">{snapshot?.descricao}</p>
          </div>
          <ul className="mt-auto grid grid-cols-2 border-t border-line text-center text-sm">
            <li className="border-r border-line px-2 py-3">
              <div className="text-lg font-semibold">
                {snapshot?.eventosMinistrados ?? 0}
              </div>
              <div className="text-xs text-muted">Eventos Ministrados</div>
            </li>
            <li className="px-2 py-3">
              <div className="text-lg font-semibold">
                {snapshot?.eventosParticipados ?? 0}
              </div>
              <div className="text-xs text-muted">Eventos Participados</div>
            </li>
          </ul>
        </aside>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 rounded-[length:var(--radius-control)] border border-line bg-panel p-6"
          noValidate
        >
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

          {isPalestrante && (
            <div className="border-t border-line pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Redes sociais</h3>
                <button
                  type="button"
                  className={btnSmAccent}
                  onClick={() => setRedes((prev) => [...prev, emptyRedeDraft()])}
                >
                  + Rede
                </button>
              </div>

              {redesError && (
                <p className="mb-3 rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger">
                  {redesError}
                </p>
              )}
              {redesSuccess && (
                <p className="mb-3 rounded-[length:var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm text-accent-dark">
                  {redesSuccess}
                </p>
              )}

              <LoadingSpinner loading={redesLoading} variant="inline" label="Carregando redes..." />

              <div className="flex flex-col gap-2">
                {redes.map((rede, index) => (
                  <div
                    key={`${rede.id}-${index}`}
                    className="grid gap-2 rounded-[length:var(--radius-control)] border border-line bg-surface p-3 md:grid-cols-[1fr_1fr_auto]"
                  >
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
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  disabled={savingRedes || redesLoading}
                  className={`${btnPrimary} gap-2`}
                  onClick={() => void saveRedes()}
                >
                  <LoadingSpinner loading={savingRedes} variant="button" />
                  {savingRedes ? "Salvando..." : "Salvar Redes"}
                </button>
              </div>
            </div>
          )}

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
              className={`${btnPrimary} ml-auto gap-2`}
            >
              <LoadingSpinner loading={saving} variant="button" />
              {saving ? "Salvando..." : "Salvar Alteração"}
            </button>
          </div>
        </form>
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

/** Dedicated change-password route redirects to profile (inline Mudar Senha). */
export function ChangePasswordRedirect() {
  return <Navigate to="/perfil" replace />;
}
