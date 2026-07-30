import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type Resolver,
} from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CurrencyInput } from "@/components/CurrencyInput";
import { DatePicker } from "@/components/DatePicker";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { FieldError } from "@/forms/components/FieldError";
import {
  emptyEventoFormValues,
  emptyLote,
  emptyRede,
  eventoSchema,
  type EventoFormValues,
} from "@/forms/schemas";
import type { Evento, Lote, Palestrante, RedeSocial } from "@/models";
import { canWrite } from "@/services/authToken";
import { eventoService } from "@/services/eventoService";
import { loteService } from "@/services/loteService";
import { palestranteService } from "@/services/palestranteService";
import { redeSocialService } from "@/services/redeSocialService";
import { ConfirmDialog } from "@/shared/ConfirmDialog";
import { formatDateBr, toApiDate, toDateInputValue } from "@/utils/date";
import { isRemoteImageUrl } from "@/utils/imageUrl";

const inputClass =
  "w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface";
const btnSmAccent =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60";
const btnSmDanger =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-danger-border bg-panel px-2 py-1 text-xs font-medium text-danger hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60";
const panelClass =
  "min-w-0 rounded-[length:var(--radius-control)] border border-line bg-panel p-4 sm:p-6";

type PendingLoteDelete = { index: number; id: number; nome: string };
type PendingRedeDelete = { index: number; id: number; nome: string };

export function EventoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "new" || Number(id) === 0;
  const writeAllowed = canWrite();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUrlEditor, setShowUrlEditor] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  const [pendingLoteDelete, setPendingLoteDelete] =
    useState<PendingLoteDelete | null>(null);
  const [pendingRedeDelete, setPendingRedeDelete] =
    useState<PendingRedeDelete | null>(null);

  const [linkedPalestrantes, setLinkedPalestrantes] = useState<Palestrante[]>(
    [],
  );
  const [speakerQuery, setSpeakerQuery] = useState("");
  const [speakerResults, setSpeakerResults] = useState<Palestrante[]>([]);
  const [searchingSpeakers, setSearchingSpeakers] = useState(false);
  const [pendingDisassociate, setPendingDisassociate] =
    useState<Palestrante | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<EventoFormValues>({
    resolver: zodResolver(eventoSchema) as Resolver<EventoFormValues>,
    defaultValues: emptyEventoFormValues(),
    // Values update on change (preview); validate when focus leaves the field.
    mode: "onBlur",
    reValidateMode: "onBlur",
  });

  const {
    fields: loteFields,
    append: appendLote,
    remove: removeLote,
  } = useFieldArray({
    control,
    name: "lotes",
  });

  const {
    fields: redeFields,
    append: appendRede,
    remove: removeRede,
  } = useFieldArray({
    control,
    name: "redesSociais",
  });

  const eventoId = watch("id");
  const local = watch("local");
  const dataEvento = watch("dataEvento");
  const telefone = watch("telefone");
  const email = watch("email");
  const imagemURL = watch("imagemURL");

  useEffect(() => {
    setImageLoadFailed(false);
  }, [imagemURL]);

  useEffect(() => {
    if (showUrlEditor) {
      urlInputRef.current?.focus();
    }
  }, [showUrlEditor]);

  function openUrlEditor() {
    if (!writeAllowed) return;
    setUrlDraft(imagemURL ?? "");
    setUrlError(null);
    setShowUrlEditor(true);
  }

  function commitUrl() {
    if (!showUrlEditor) return;
    const trimmed = urlDraft.trim();
    if (!trimmed) {
      setValue("imagemURL", "");
      setUrlError(null);
      setShowUrlEditor(false);
      return;
    }
    if (!isRemoteImageUrl(trimmed)) {
      setUrlError("Use um link http:// ou https:// (path local não carrega).");
      return;
    }
    setValue("imagemURL", trimmed);
    setUrlError(null);
    setShowUrlEditor(false);
  }

  const showPreviewImage = isRemoteImageUrl(imagemURL) && !imageLoadFailed;

  useEffect(() => {
    if (isNew) return;

    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) {
      setError("ID inválido.");
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [eventoData, lotesData, redesData] = await Promise.all([
          eventoService.getById(parsedId),
          loteService.getByEventoId(parsedId),
          redeSocialService.getByEventoId(parsedId),
        ]);
        reset({
          ...eventoData,
          dataEvento: toDateInputValue(eventoData.dataEvento),
          lotes: lotesData.map((lote) => ({
            ...lote,
            dataIncio: toDateInputValue(lote.dataIncio),
            dataFim: toDateInputValue(lote.dataFim),
          })),
          redesSociais: redesData.map((rede) => ({
            id: rede.id,
            nome: rede.nome,
            url: rede.url,
            eventoId: rede.eventoId ?? undefined,
          })),
        });
        setLinkedPalestrantes(eventoData.palestrantes ?? []);
      } catch {
        setError("Evento não encontrado.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [isNew, id, reset]);

  async function onSubmit(values: EventoFormValues) {
    if (!writeAllowed) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Evento = {
        ...values,
        dataEvento: toApiDate(values.dataEvento),
        lotes: values.lotes.map((lote) => ({
          ...lote,
          dataIncio: toApiDate(lote.dataIncio),
          dataFim: toApiDate(lote.dataFim),
        })) as Lote[],
        redesSociais: values.redesSociais as RedeSocial[],
      };

      const saved = isNew
        ? await eventoService.create(payload)
        : await eventoService.update(values.id, payload);

      if (values.lotes.length > 0) {
        await loteService.save(
          saved.id,
          payload.lotes!.map((l) => ({ ...l, eventoId: saved.id })) as Lote[],
        );
      }

      if (values.redesSociais.length > 0) {
        await redeSocialService.saveByEventoId(
          saved.id,
          values.redesSociais.map((r) => ({
            ...r,
            eventoId: saved.id,
          })) as RedeSocial[],
        );
      }

      void navigate(`/eventos/${saved.id}`);
    } catch {
      setError("Erro ao salvar evento.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteLote() {
    if (!pendingLoteDelete) return;
    const { index, id: loteId } = pendingLoteDelete;
    setPendingLoteDelete(null);
    setError(null);
    setSuccess(null);
    try {
      if (loteId > 0 && eventoId > 0) {
        await loteService.delete(eventoId, loteId);
      }
      removeLote(index);
      setSuccess("Lote excluído com sucesso.");
    } catch {
      setError("Erro ao excluir lote.");
    }
  }

  async function confirmDeleteRede() {
    if (!pendingRedeDelete) return;
    const { index, id: redeId } = pendingRedeDelete;
    setPendingRedeDelete(null);
    setError(null);
    setSuccess(null);
    try {
      if (redeId > 0 && eventoId > 0) {
        await redeSocialService.deleteByEventoId(eventoId, redeId);
      }
      removeRede(index);
      setSuccess("Rede social excluída com sucesso.");
    } catch {
      setError("Erro ao excluir rede social.");
    }
  }

  async function searchSpeakers() {
    const q = speakerQuery.trim();
    setSearchingSpeakers(true);
    setError(null);
    try {
      const results = q
        ? (await palestranteService.getByNome(q)).items
        : await palestranteService.listAll();
      const linkedIds = new Set(linkedPalestrantes.map((p) => p.id));
      setSpeakerResults(results.filter((p) => !linkedIds.has(p.id)));
    } catch {
      setError("Erro ao buscar palestrantes.");
    } finally {
      setSearchingSpeakers(false);
    }
  }

  async function associateSpeaker(palestrante: Palestrante) {
    if (!writeAllowed || !eventoId || eventoId <= 0) return;
    setError(null);
    setSuccess(null);
    try {
      await palestranteService.associate(eventoId, palestrante.id);
      setLinkedPalestrantes((prev) => [...prev, palestrante]);
      setSpeakerResults((prev) => prev.filter((p) => p.id !== palestrante.id));
      setSuccess("Palestrante associado com sucesso.");
    } catch {
      setError("Erro ao associar palestrante.");
    }
  }

  async function confirmDisassociate() {
    if (!pendingDisassociate || !eventoId) return;
    const palestrante = pendingDisassociate;
    setPendingDisassociate(null);
    setError(null);
    setSuccess(null);
    try {
      await palestranteService.disassociate(eventoId, palestrante.id);
      setLinkedPalestrantes((prev) =>
        prev.filter((p) => p.id !== palestrante.id),
      );
      setSuccess("Palestrante desassociado com sucesso.");
    } catch {
      setError("Erro ao desassociar palestrante.");
    }
  }

  if (loading) {
    return <LoadingSpinner loading variant="page" />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isNew ? "Novo evento" : "Editar evento"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Formulário simples com lotes e redes sociais.
          </p>
        </div>
        <Link to="/eventos" className={btnOutline}>
          Voltar
        </Link>
      </div>

      {!writeAllowed && (
        <p className="rounded-[length:var(--radius-control)] border border-line bg-surface px-4 py-3 text-sm text-muted">
          Acesso somente leitura. É necessária a role User para criar ou editar
          eventos.
        </p>
      )}

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
        className="flex flex-col gap-6"
        noValidate
      >
        <div className="grid gap-6 md:grid-cols-[1fr_minmax(260px,320px)] md:items-start">
          <section className={panelClass}>
            <h2 className="mb-4 text-lg font-medium text-accent-dark">
              Dados do evento
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                <span className="font-medium">Tema</span>
                <input
                  className={inputClass}
                  disabled={!writeAllowed}
                  {...register("tema")}
                />
                <FieldError error={errors.tema} />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">Local</span>
                <input
                  className={inputClass}
                  disabled={!writeAllowed}
                  {...register("local")}
                />
                <FieldError error={errors.local} />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">Data do evento</span>
                <Controller
                  control={control}
                  name="dataEvento"
                  render={({ field }) => (
                    <DatePicker
                      id="dataEvento"
                      className={inputClass}
                      value={field.value}
                      disabled={!writeAllowed}
                      onChange={(value) => {
                        field.onChange(value);
                      }}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <FieldError error={errors.dataEvento} />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">Qtd pessoas</span>
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  max={120000}
                  disabled={!writeAllowed}
                  {...register("qtdPessoas")}
                />
                <FieldError error={errors.qtdPessoas} />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">Telefone</span>
                <input
                  className={inputClass}
                  disabled={!writeAllowed}
                  {...register("telefone")}
                />
                <FieldError error={errors.telefone} />
              </label>
              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                <span className="font-medium">E-mail</span>
                <input
                  className={inputClass}
                  type="email"
                  disabled={!writeAllowed}
                  {...register("email")}
                />
                <FieldError error={errors.email} />
              </label>
            </div>
          </section>

          <aside
            className="self-start rounded-[length:var(--radius-control)] border border-line bg-panel p-4 md:sticky md:top-4"
            data-testid="evento-preview-card"
          >
            <button
              type="button"
              className="mb-4 block w-full overflow-hidden rounded-[length:var(--radius-control)] border border-line bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-default"
              onClick={openUrlEditor}
              disabled={!writeAllowed}
            >
              {showPreviewImage ? (
                <img
                  src={imagemURL}
                  alt="Imagem do evento"
                  className="h-48 w-full object-cover"
                  onError={() => setImageLoadFailed(true)}
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center px-4 text-center text-sm text-muted">
                  {writeAllowed
                    ? "Clique para informar URL da imagem"
                    : "Sem imagem"}
                </div>
              )}
            </button>

            {showUrlEditor && (
              <div className="mb-4 flex flex-col gap-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">URL da imagem</span>
                  <input
                    ref={urlInputRef}
                    className={inputClass}
                    type="url"
                    value={urlDraft}
                    placeholder="https://..."
                    onChange={(e) => setUrlDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitUrl();
                      }
                    }}
                    onBlur={commitUrl}
                  />
                </label>
                {urlError && (
                  <span className="text-xs text-danger">{urlError}</span>
                )}
              </div>
            )}

            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="font-medium text-muted">Local</dt>
                <dd>{local || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted">Data</dt>
                <dd>{formatDateBr(dataEvento) || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted">Telefone</dt>
                <dd>{telefone || "—"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted">E-mail</dt>
                <dd>{email || "—"}</dd>
              </div>
            </dl>
          </aside>
        </div>

        <section className={panelClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-accent-dark">Lotes</h2>
            {writeAllowed && (
              <button
                type="button"
                className={btnSmAccent}
                onClick={() => appendLote(emptyLote(eventoId))}
              >
                + Lote
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {loteFields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-4 rounded-[length:var(--radius-control)] border border-line bg-surface p-4 md:grid-cols-2"
              >
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium">Nome</span>
                  <input
                    className={inputClass}
                    disabled={!writeAllowed}
                    {...register(`lotes.${index}.nome`)}
                  />
                  <FieldError error={errors.lotes?.[index]?.nome} />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium">Preço</span>
                  <Controller
                    control={control}
                    name={`lotes.${index}.preco`}
                    render={({ field }) => (
                      <CurrencyInput
                        className={inputClass}
                        value={field.value}
                        disabled={!writeAllowed}
                        onChange={(value) => {
                          field.onChange(value ?? 0);
                          void trigger(`lotes.${index}.preco`);
                        }}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                  <FieldError error={errors.lotes?.[index]?.preco} />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-medium">Quantidade</span>
                  <input
                    className={inputClass}
                    type="number"
                    disabled={!writeAllowed}
                    {...register(`lotes.${index}.quantidade`)}
                  />
                  <FieldError error={errors.lotes?.[index]?.quantidade} />
                </label>
                <div className="grid gap-4 md:col-span-2 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium">Data início</span>
                    <Controller
                      control={control}
                      name={`lotes.${index}.dataIncio`}
                      render={({ field }) => (
                        <DatePicker
                          className={inputClass}
                          value={field.value}
                          disabled={!writeAllowed}
                          onChange={(value) => {
                            field.onChange(value);
                            void trigger([
                              `lotes.${index}.dataIncio`,
                              `lotes.${index}.dataFim`,
                            ]);
                          }}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                    <FieldError error={errors.lotes?.[index]?.dataIncio} />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium">Data fim</span>
                    <Controller
                      control={control}
                      name={`lotes.${index}.dataFim`}
                      render={({ field }) => (
                        <DatePicker
                          className={inputClass}
                          value={field.value}
                          disabled={!writeAllowed}
                          onChange={(value) => {
                            field.onChange(value);
                            void trigger([
                              `lotes.${index}.dataIncio`,
                              `lotes.${index}.dataFim`,
                            ]);
                          }}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                    <FieldError error={errors.lotes?.[index]?.dataFim} />
                  </label>
                </div>
                {writeAllowed && (
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      className={btnSmDanger}
                      onClick={() => {
                        const lote = getValues(`lotes.${index}`);
                        setPendingLoteDelete({
                          index,
                          id: lote.id,
                          nome: lote.nome || "lote",
                        });
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className={panelClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-accent-dark">
              Redes sociais
            </h2>
            {writeAllowed && (
              <button
                type="button"
                className={btnSmAccent}
                onClick={() => appendRede(emptyRede(eventoId))}
              >
                + Rede
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            {redeFields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-[length:var(--radius-control)] border border-line bg-surface p-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  className={inputClass}
                  placeholder="Nome"
                  disabled={!writeAllowed}
                  {...register(`redesSociais.${index}.nome`)}
                />
                <input
                  className={inputClass}
                  placeholder="URL"
                  disabled={!writeAllowed}
                  {...register(`redesSociais.${index}.url`)}
                />
                {writeAllowed && (
                  <button
                    type="button"
                    className={btnSmDanger}
                    onClick={() => {
                      const rede = getValues(`redesSociais.${index}`);
                      setPendingRedeDelete({
                        index,
                        id: rede.id,
                        nome: rede.nome || "rede",
                      });
                    }}
                  >
                    Excluir
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {!isNew && (
          <section className={panelClass}>
            <h2 className="mb-4 text-lg font-medium text-accent-dark">
              Palestrantes
            </h2>
            <ul className="mb-4 flex flex-col gap-2">
              {linkedPalestrantes.length === 0 ? (
                <li className="text-sm text-muted">
                  Nenhum palestrante associado.
                </li>
              ) : (
                linkedPalestrantes.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-[length:var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{p.nome}</span>
                    {writeAllowed && (
                      <button
                        type="button"
                        className={btnSmDanger}
                        onClick={() => setPendingDisassociate(p)}
                      >
                        Desassociar
                      </button>
                    )}
                  </li>
                ))
              )}
            </ul>

            {writeAllowed && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex w-full min-w-0 flex-1 flex-col gap-2 text-sm sm:min-w-60">
                    <span className="font-medium">Buscar palestrante</span>
                    <input
                      className={inputClass}
                      value={speakerQuery}
                      onChange={(e) => setSpeakerQuery(e.target.value)}
                      placeholder="Nome"
                    />
                  </label>
                  <button
                    type="button"
                    className={btnOutline}
                    disabled={searchingSpeakers}
                    onClick={() => void searchSpeakers()}
                  >
                    {searchingSpeakers ? "Buscando..." : "Buscar"}
                  </button>
                </div>
                {speakerResults.length > 0 && (
                  <ul className="flex flex-col gap-2">
                    {speakerResults.map((p) => (
                      <li
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-[length:var(--radius-control)] border border-line bg-surface px-3 py-2 text-sm"
                      >
                        <span>{p.nome}</span>
                        <button
                          type="button"
                          className={btnSmAccent}
                          onClick={() => void associateSpeaker(p)}
                        >
                          Adicionar
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        )}

        {writeAllowed && (
          <button type="submit" disabled={saving} className={btnPrimary}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        )}
      </form>

      <ConfirmDialog
        open={pendingLoteDelete !== null}
        title="Excluir lote"
        message={
          pendingLoteDelete
            ? `Deseja excluir o lote "${pendingLoteDelete.nome}"?`
            : ""
        }
        confirmLabel="Excluir"
        onConfirm={() => void confirmDeleteLote()}
        onCancel={() => setPendingLoteDelete(null)}
      />
      <ConfirmDialog
        open={pendingRedeDelete !== null}
        title="Excluir rede social"
        message={
          pendingRedeDelete
            ? `Deseja excluir a rede "${pendingRedeDelete.nome}"?`
            : ""
        }
        confirmLabel="Excluir"
        onConfirm={() => void confirmDeleteRede()}
        onCancel={() => setPendingRedeDelete(null)}
      />
      <ConfirmDialog
        open={pendingDisassociate !== null}
        title="Desassociar palestrante"
        message={
          pendingDisassociate
            ? `Deseja desassociar "${pendingDisassociate.nome}" deste evento?`
            : ""
        }
        confirmLabel="Desassociar"
        onConfirm={() => void confirmDisassociate()}
        onCancel={() => setPendingDisassociate(null)}
      />
    </div>
  );
}
