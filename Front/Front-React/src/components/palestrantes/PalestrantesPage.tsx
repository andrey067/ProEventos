import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Palestrante } from "@/models";
import { PAGE_SIZES, type PageSize } from "@/models/pagination";
import { canWrite, isAuthenticated } from "@/services/authToken";
import { palestranteService } from "@/services/palestranteService";
import { isRemoteImageUrl } from "@/utils/imageUrl";

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
  const writeAllowed = canWrite();
  const [palestrantes, setPalestrantes] = useState<Palestrante[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [qInput, setQInput] = useState("");
  const [qFilter, setQFilter] = useState("");
  const debouncedQ = useDebouncedValue(qInput, 350);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [totalPages, setTotalPages] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    nome: string;
  } | null>(null);

  useEffect(() => {
    // Only commit when debounce has caught up to the live input (avoids
    // overwriting immediate submit/clear with a stale pending term).
    if (debouncedQ !== qInput) return;
    const next = debouncedQ.trim();
    if (next === qFilter) return;
    setPage(1);
    setQFilter(next);
  }, [debouncedQ, qInput, qFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void palestranteService
      .getAll({
        page,
        pageSize,
        q: qFilter.trim() || undefined,
      })
      .then((data) => {
        if (cancelled) return;
        setPalestrantes(data?.items ?? []);
        setTotalPages(data?.totalPages ?? 0);
        if (data?.page != null && data.page !== page) setPage(data.page);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar palestrantes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, qFilter, reloadToken]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    setSuccess(null);
    try {
      await palestranteService.delete(id);
      setSuccess("Palestrante excluído com sucesso.");
      setPage(1);
      setReloadToken((t) => t + 1);
    } catch {
      alert("Erro ao deletar palestrante.");
    }
  }

  function onFilter() {
    setPage(1);
    setQFilter(qInput.trim());
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Palestrantes</h1>
          <p className="mt-1 text-sm text-muted">
            Lista, busca e gerenciamento básico.
          </p>
        </div>
        {writeAllowed ? (
          <Link to="/palestrantes/new" className={btnPrimary}>
            Novo palestrante
          </Link>
        ) : loggedIn ? null : (
          <Link to="/login" className={btnPrimary}>
            Entrar para criar
          </Link>
        )}
      </div>

      {loggedIn && !writeAllowed && (
        <p className="rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted">
          Acesso somente leitura. É necessária a role User para cadastrar ou
          editar palestrantes.
        </p>
      )}

      {success && (
        <p className="rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-accent-dark">
          {success}
        </p>
      )}

      <form
        className="flex flex-wrap items-end gap-3 rounded-[length:var(--radius-control)] border border-line bg-panel p-4"
        onSubmit={(e) => {
          e.preventDefault();
          onFilter();
        }}
      >
        <label className="flex w-full min-w-0 flex-1 flex-col gap-2 text-sm">
          <span className="font-medium text-ink">Buscar</span>
          <input
            className={inputClass}
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Digite para buscar"
          />
        </label>
        <button type="submit" className={btnPrimary}>
          Buscar
        </button>
        <button
          type="button"
          className={btnOutline}
          onClick={() => {
            setQInput("");
            setPage(1);
            setQFilter("");
          }}
        >
          Limpar
        </button>
      </form>

      <LoadingSpinner loading={loading} variant="page" />
      {error && (
        <p className="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto rounded-[length:var(--radius-control)] border border-line bg-panel">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left text-muted">
                  <th className="px-4 py-3 font-medium">Imagem</th>
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
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted"
                    >
                      Nenhum palestrante encontrado.
                    </td>
                  </tr>
                ) : (
                  palestrantes.map((palestrante) => (
                    <tr key={palestrante.id} className="hover:bg-surface">
                      <td className="px-4 py-3">
                        {isRemoteImageUrl(palestrante.imagemURL) ? (
                          <img
                            src={palestrante.imagemURL}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {writeAllowed ? (
                          <Link
                            to={`/palestrantes/${palestrante.id}`}
                            className="font-medium text-accent-dark hover:underline"
                          >
                            {palestrante.nome}
                          </Link>
                        ) : (
                          palestrante.nome
                        )}
                      </td>
                      <td className="px-4 py-3">{palestrante.email}</td>
                      <td className="px-4 py-3">{palestrante.telefone}</td>
                      <td className="px-4 py-3">
                        {writeAllowed ? (
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/palestrantes/${palestrante.id}`}
                              className={btnSmAccent}
                            >
                              Editar
                            </Link>
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
                        ) : loggedIn ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <Link to="/login" className={btnSmAccent}>
                            Entrar para editar
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="font-medium text-muted">Itens por página</span>
                <select
                  className={inputClass}
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value) as PageSize);
                    setPage(1);
                  }}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={btnOutline}
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Anterior
                </button>
                <span className="text-sm text-muted">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  className={btnOutline}
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
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
