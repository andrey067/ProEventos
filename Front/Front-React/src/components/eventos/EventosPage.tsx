import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  emptyEventoSearchFormValues,
  eventoSearchSchema,
  type EventoSearchFormValues,
} from "@/forms/schemas";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Evento } from "@/models";
import { PAGE_SIZES, type PageSize } from "@/models/pagination";
import { canWrite, isAuthenticated } from "@/services/authToken";
import { eventoService } from "@/services/eventoService";
import { formatDateBr } from "@/utils/date";

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

function primeiroLoteLabel(evento: Evento): string {
  const lote = evento.lotes?.[0];
  if (!lote) return "—";
  return lote.nome || "—";
}

export function EventosPage() {
  const loggedIn = isAuthenticated();
  const writeAllowed = canWrite();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [totalPages, setTotalPages] = useState(0);
  const [qFilter, setQFilter] = useState("");
  const [showImages, setShowImages] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    tema: string;
  } | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const { register, handleSubmit, reset, watch } = useForm<EventoSearchFormValues>({
    resolver: zodResolver(eventoSearchSchema),
    defaultValues: emptyEventoSearchFormValues(),
  });
  const qInput = watch("q") ?? "";
  const debouncedQ = useDebouncedValue(qInput, 350);

  const colSpan = 7;

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
    void eventoService
      .getAll({
        page,
        pageSize,
        q: qFilter.trim() || undefined,
      })
      .then((data) => {
        if (cancelled) return;
        setEventos(data.items);
        setTotalPages(data.totalPages);
        if (data.page !== page) setPage(data.page);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar os eventos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, qFilter, reloadToken]);

  function onSearch(values: EventoSearchFormValues) {
    const next = values.q?.trim() ?? "";
    setPage(1);
    setQFilter(next);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    setSuccess(null);
    try {
      await eventoService.delete(id);
      setSuccess("Evento excluído com sucesso.");
      setPage(1);
      setReloadToken((t) => t + 1);
    } catch {
      alert("Erro ao deletar evento.");
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
          <p className="mt-1 text-sm text-muted">
            Lista, busca e gerenciamento básico.
          </p>
        </div>
        {writeAllowed ? (
          <Link to="/eventos/new" className={btnPrimary}>
            Novo evento
          </Link>
        ) : loggedIn ? null : (
          <Link to="/login" className={btnPrimary}>
            Entrar para criar
          </Link>
        )}
      </div>

      {loggedIn && !writeAllowed && (
        <p className="rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted">
          Acesso somente leitura. É necessária a role User para criar ou editar
          eventos.
        </p>
      )}

      {success && (
        <p className="rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-accent-dark">
          {success}
        </p>
      )}

      <form
        onSubmit={handleSubmit(onSearch)}
        className="flex flex-wrap items-end gap-3 rounded-[length:var(--radius-control)] border border-line bg-panel p-4"
      >
        <label className="flex w-full min-w-0 flex-1 flex-col gap-2 text-sm">
          <span className="font-medium text-ink">Buscar</span>
          <input
            className={inputClass}
            {...register("q")}
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
            reset(emptyEventoSearchFormValues());
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
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left text-muted">
                  <th className="w-12 px-4 py-3">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded p-1 text-muted hover:bg-surface hover:text-ink"
                      title={showImages ? "Ocultar" : "Mostrar"}
                      aria-label={showImages ? "Ocultar" : "Mostrar"}
                      onClick={() => setShowImages((current) => !current)}
                    >
                      {showImages ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          aria-hidden="true"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                          <path d="m3 3 18 18" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">Tema</th>
                  <th className="px-4 py-3 font-medium">Local</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Qtd</th>
                  <th className="px-4 py-3 font-medium">1º lote</th>
                  <th className="px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {eventos.length === 0 ? (
                  <tr>
                    <td
                      colSpan={colSpan}
                      className="px-4 py-8 text-center text-muted"
                    >
                      Nenhum evento encontrado.
                    </td>
                  </tr>
                ) : (
                  eventos.map((evento) => (
                    <tr key={evento.id} className="hover:bg-surface">
                      <td className="px-4 py-3">
                        {showImages && evento.imagemURL ? (
                          <img
                            src={evento.imagemURL}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/eventos/${evento.id}`}
                          className="font-medium text-accent-dark hover:underline"
                        >
                          {evento.tema}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{evento.local}</td>
                      <td className="px-4 py-3">
                        {formatDateBr(evento.dataEvento)}
                      </td>
                      <td className="px-4 py-3">{evento.qtdPessoas}</td>
                      <td className="px-4 py-3">{primeiroLoteLabel(evento)}</td>
                      <td className="px-4 py-3">
                        {writeAllowed ? (
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/eventos/${evento.id}`}
                              className={btnSmAccent}
                            >
                              Editar
                            </Link>
                            <button
                              type="button"
                              className={btnSmDanger}
                              onClick={() =>
                                setPendingDelete({
                                  id: evento.id,
                                  tema: evento.tema,
                                })
                              }
                            >
                              Excluir
                            </button>
                          </div>
                        ) : loggedIn ? (
                          <Link to={`/eventos/${evento.id}`} className={btnSmAccent}>
                            Ver
                          </Link>
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
        title="Excluir evento"
        message={
          pendingDelete
            ? `Deseja deletar o evento "${pendingDelete.tema}"?`
            : ""
        }
        confirmLabel="Excluir"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
