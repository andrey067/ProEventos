import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import { FieldError } from "@/forms/components/FieldError";
import {
  emptyPalestranteFormValues,
  palestranteSchema,
  type PalestranteFormValues,
} from "@/forms/schemas";
import type { Palestrante } from "@/models";
import { palestranteService } from "@/services/palestranteService";
import { isAuthenticated } from "@/services/authToken";

const inputClass =
  "w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const btnPrimary =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface";
const btnSmAccent =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft";
const btnSmDanger =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-danger-border bg-panel px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft";

export function PalestrantesPage() {
  const loggedIn = isAuthenticated();
  const [palestrantes, setPalestrantes] = useState<Palestrante[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    nome: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PalestranteFormValues>({
    resolver: zodResolver(palestranteSchema) as Resolver<PalestranteFormValues>,
    defaultValues: emptyPalestranteFormValues(),
  });

  const loadPalestrantes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPalestrantes(await palestranteService.getAll());
    } catch {
      setError("Não foi possível carregar palestrantes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPalestrantes();
  }, [loadPalestrantes]);

  function resetForm() {
    reset(emptyPalestranteFormValues());
    setEditingId(null);
  }

  async function onSubmit(values: PalestranteFormValues) {
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await palestranteService.update(editingId, { id: editingId, ...values });
      } else {
        await palestranteService.create(values);
      }
      resetForm();
      await loadPalestrantes();
    } catch {
      setError("Erro ao salvar palestrante.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(palestrante: Palestrante) {
    setEditingId(palestrante.id);
    reset({
      nome: palestrante.nome,
      miniCurriculo: palestrante.miniCurriculo,
      imagemURL: palestrante.imagemURL,
      telefone: palestrante.telefone,
      email: palestrante.email,
    });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    try {
      await palestranteService.delete(id);
      if (editingId === id) resetForm();
      await loadPalestrantes();
    } catch {
      alert("Erro ao deletar palestrante.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Palestrantes</h1>
        <p className="mt-1 text-sm text-muted">
          Cadastro e edição inline simples.
        </p>
      </div>

      {loggedIn ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid gap-4 rounded-[length:var(--radius-control)] border border-line bg-panel p-6 md:grid-cols-2"
          noValidate
        >
          <h2 className="text-lg font-medium text-accent-dark md:col-span-2">
            {editingId ? "Editar palestrante" : "Novo palestrante"}
          </h2>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="font-medium">Nome</span>
            <input className={inputClass} {...register("nome")} />
            <FieldError error={errors.nome} />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="font-medium">Mini currículo</span>
            <textarea
              className={inputClass}
              {...register("miniCurriculo")}
              rows={3}
            />
            <FieldError error={errors.miniCurriculo} />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Telefone</span>
            <input className={inputClass} {...register("telefone")} />
            <FieldError error={errors.telefone} />
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
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? "Salvando..." : editingId ? "Atualizar" : "Cadastrar"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className={btnOutline}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="rounded-[length:var(--radius-control)] border border-line bg-panel p-6 text-sm text-muted">
          <p>Faça login para cadastrar ou editar palestrantes.</p>
          <Link to="/login" className={`${btnPrimary} mt-4 inline-flex w-auto`}>
            Entrar
          </Link>
        </div>
      )}

      {error && (
        <p className="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          <div className="h-10 animate-pulse rounded bg-line/60" />
          <div className="h-10 animate-pulse rounded bg-line/40" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-[length:var(--radius-control)] border border-line bg-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-muted">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {palestrantes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted"
                  >
                    Nenhum palestrante cadastrado.
                  </td>
                </tr>
              ) : (
                palestrantes.map((palestrante) => (
                  <tr key={palestrante.id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-medium">{palestrante.nome}</td>
                    <td className="px-4 py-3">{palestrante.email}</td>
                    <td className="px-4 py-3">{palestrante.telefone}</td>
                    <td className="px-4 py-3">
                      {loggedIn ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className={btnSmAccent}
                            onClick={() => startEdit(palestrante)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={btnSmDanger}
                            onClick={() =>
                              setPendingDelete({
                                id: palestrante.id,
                                nome: palestrante.nome,
                              })
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Excluir palestrante"
        message={
          pendingDelete ? `Deseja deletar "${pendingDelete.nome}"?` : ""
        }
        confirmLabel="Excluir"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
