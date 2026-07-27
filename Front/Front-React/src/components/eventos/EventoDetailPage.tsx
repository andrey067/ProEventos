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
import { FieldError } from "@/forms/components/FieldError";
import {
  emptyEventoFormValues,
  emptyLote,
  emptyRede,
  eventoSchema,
  type EventoFormValues,
} from "@/forms/schemas";
import type { Evento, Lote, RedeSocial } from "@/models";
import { eventoService } from "@/services/eventoService";
import { loteService } from "@/services/loteService";
import { redeSocialService } from "@/services/redeSocialService";
import { formatDateBr, toApiDate, toDateInputValue } from "@/utils/date";
import { isRemoteImageUrl } from "@/utils/imageUrl";

const inputClass =
  "w-full rounded-[length:var(--radius-control)] border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const btnPrimary =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] bg-accent px-4 py-2 text-sm font-medium text-white transition-transform hover:bg-accent-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-line bg-panel px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface";
const btnSmAccent =
  "inline-flex items-center justify-center rounded-[length:var(--radius-control)] border border-accent/30 bg-panel px-2 py-1 text-xs font-medium text-accent-dark hover:bg-accent-soft";
const panelClass =
  "rounded-[length:var(--radius-control)] border border-line bg-panel p-6";

export function EventoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlEditor, setShowUrlEditor] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<EventoFormValues>({
    resolver: zodResolver(eventoSchema) as Resolver<EventoFormValues>,
    defaultValues: emptyEventoFormValues(),
  });

  const {
    fields: loteFields,
    append: appendLote,
  } = useFieldArray({
    control,
    name: "lotes",
  });

  const {
    fields: redeFields,
    append: appendRede,
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
      } catch {
        setError("Evento não encontrado.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [isNew, id, reset]);

  async function onSubmit(values: EventoFormValues) {
    setSaving(true);
    setError(null);

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

  if (loading) {
    return (
      <div className="space-y-2" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-line/60" />
        <div className="h-40 animate-pulse rounded bg-line/40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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

      {error && (
        <p className="rounded-[length:var(--radius-control)] border border-danger-border bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
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
                <input className={inputClass} {...register("tema")} />
                <FieldError error={errors.tema} />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">Local</span>
                <input className={inputClass} {...register("local")} />
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
                      onChange={(value) => {
                        field.onChange(value);
                        void trigger("dataEvento");
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
                  {...register("qtdPessoas")}
                />
                <FieldError error={errors.qtdPessoas} />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">Telefone</span>
                <input className={inputClass} {...register("telefone")} />
                <FieldError error={errors.telefone} />
              </label>
              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                <span className="font-medium">E-mail</span>
                <input
                  className={inputClass}
                  type="email"
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
              className="mb-4 block w-full overflow-hidden rounded-[length:var(--radius-control)] border border-line bg-surface focus:outline-none focus:ring-2 focus:ring-accent/30"
              onClick={openUrlEditor}
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
                  Clique para informar URL da imagem
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
            <button
              type="button"
              className={btnSmAccent}
              onClick={() => appendLote(emptyLote(eventoId))}
            >
              + Lote
            </button>
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
              </div>
            ))}
          </div>
        </section>

        <section className={panelClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-accent-dark">
              Redes sociais
            </h2>
            <button
              type="button"
              className={btnSmAccent}
              onClick={() => appendRede(emptyRede(eventoId))}
            >
              + Rede
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {redeFields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-[length:var(--radius-control)] border border-line bg-surface p-3 md:grid-cols-2"
              >
                <input
                  className={inputClass}
                  placeholder="Nome"
                  {...register(`redesSociais.${index}.nome`)}
                />
                <input
                  className={inputClass}
                  placeholder="URL"
                  {...register(`redesSociais.${index}.url`)}
                />
              </div>
            ))}
          </div>
        </section>

        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
