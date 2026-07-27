import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import {
  emptyEventoSearchFormValues,
  eventoSearchSchema,
  type EventoSearchFormValues,
} from "@/forms/schemas";
import type { Evento } from "@/models";
import { eventoService } from "@/services/eventoService";
import { isAuthenticated } from "@/services/authToken";
import { formatDateBr } from "@/utils/date";
import { PAGE_SIZES, paginate, type PageSize } from "@/utils/pagination";

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

export function EventosPage() {
  const loggedIn = isAuthenticated();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [showImages, setShowImages] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    tema: string;
  } | null>(null);

  const { register, handleSubmit, reset, getValues } =
    useForm<EventoSearchFormValues>({
      resolver: zodResolver(eventoSearchSchema),
      defaultValues: emptyEventoSearchFormValues(),
    });

  const { items: displayedEventos, totalPages } = paginate(
    eventos,
    page,
    pageSize,
  );
  const colSpan = showImages ? 6 : 5;

  const loadEventos = useCallback(async (searchTema?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data =
        searchTema?.trim()
          ? await eventoService.getByTema(searchTema.trim())
          : await eventoService.getAll();
      setEventos(data);
    } catch {
      setError("Não foi possível carregar os eventos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEventos();
  }, [loadEventos]);

  async function onSearch(values: EventoSearchFormValues) {
    setPage(1);
    await loadEventos(values.tema);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    try {
      await eventoService.delete(id);
      setPage(1);
      await loadEventos(getValues("tema"));
    } catch {
      alert("Erro ao deletar evento.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
          <p className="mt-1 text-sm text-muted">
            Lista, busca por tema e gerenciamento básico.
          </p>
        </div>
        {loggedIn ? (
          <Link to="/eventos/new" className={btnPrimary}>
            Novo evento
          </Link>
        ) : (
          <Link to="/login" className={btnPrimary}>
            Entrar para criar
          </Link>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onSearch)}
        className="flex flex-wrap items-end gap-3 rounded-[length:var(--radius-control)] border border-line bg-panel p-4"
      >
        <label className="flex min-w-60 flex-1 flex-col gap-2 text-sm">
          <span className="font-medium text-ink">Buscar por tema</span>
          <input
            className={inputClass}
            {...register("tema")}
            placeholder="Digite parte do tema"
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
            void loadEventos();
          }}
        >
          Limpar
        </button>
      </form>

      {loading && (
        <div className="space-y-2" aria-busy="true">
          <div className="h-10 animate-pulse rounded bg-line/60" />
          <div className="h-10 animate-pulse rounded bg-line/40" />
          <div className="h-10 animate-pulse rounded bg-line/60" />
        </div>
      )}
      {error && (
        <p className="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              className={btnOutline}
              onClick={() => setShowImages((current) => !current)}
            >
              {showImages ? "Ocultar imagens" : "Mostrar imagens"}
            </button>
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
          </div>

          <div className="overflow-hidden rounded-[length:var(--radius-control)] border border-line bg-panel">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left text-muted">
                  {showImages && (
                    <th className="px-4 py-3 font-medium">Imagem</th>
                  )}
                  <th className="px-4 py-3 font-medium">Tema</th>
                  <th className="px-4 py-3 font-medium">Local</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Qtd</th>
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
                  displayedEventos.map((evento) => (
                    <tr key={evento.id} className="hover:bg-surface">
                      {showImages && (
                        <td className="px-4 py-3">
                          {evento.imagemURL ? (
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
                      )}
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
                      <td className="px-4 py-3">
                        {loggedIn ? (
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
