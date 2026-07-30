import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  createEventoForm,
  createLoteGroup,
  createRedeGroup,
  patchEventoForm,
  setLotesFormArray,
  setRedesFormArray,
} from '../../../forms';
import { Evento, Lote, Palestrante, RedeSocial } from '../../../models';
import { AuthTokenService } from '../../../services/auth-token.service';
import { EventoService } from '../../../services/evento.service';
import { LoteService } from '../../../services/lote.service';
import { PalestranteService } from '../../../services/palestrante.service';
import { RedeSocialService } from '../../../services/rede-social.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../common/loading-spinner/loading-spinner.component';
import { formatDateBr, toApiDate } from '../../../shared/date';
import { isRemoteImageUrl } from '../../../shared/image-url';
import { DatePickerComponent } from '../../../shared/date-picker/date-picker.component';
import { NgxCurrencyDirective } from 'ngx-currency';
import {
  alertAnimation,
  pageEnterAnimation,
  panelEnterAnimation,
  SkeletonShimmerComponent,
} from '../../../shared/motion';

type PendingDelete =
  | { kind: 'lote'; index: number }
  | { kind: 'rede'; index: number }
  | { kind: 'palestrante'; palestrante: Palestrante }
  | null;

@Component({
  selector: 'app-evento-form',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePickerComponent,
    NgxCurrencyDirective,
    ConfirmDialogComponent,
    LoadingSpinnerComponent,
    SkeletonShimmerComponent,
  ],
  templateUrl: './evento-form.component.html',
  styleUrl: './evento-form.component.scss',
  animations: [pageEnterAnimation, alertAnimation, panelEnterAnimation],
})
export class EventoFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly authToken = inject(AuthTokenService);
  private readonly eventoService = inject(EventoService);
  private readonly loteService = inject(LoteService);
  private readonly redeSocialService = inject(RedeSocialService);
  private readonly palestranteService = inject(PalestranteService);

  isNew = true;
  loading = true;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  form = createEventoForm(this.fb);

  showUrlEditor = false;
  urlDraft = '';
  urlError: string | null = null;
  imageLoadFailed = false;

  linkedPalestrantes: Palestrante[] = [];
  allPalestrantes: Palestrante[] = [];
  associateId: number | null = null;
  associating = false;

  pendingDelete: PendingDelete = null;

  get canWrite(): boolean {
    return this.authToken.canWrite();
  }

  get isAuthenticated(): boolean {
    return this.authToken.isAuthenticated();
  }

  get lotes(): FormArray<FormGroup> {
    return this.form.get('lotes') as FormArray<FormGroup>;
  }

  get redes(): FormArray<FormGroup> {
    return this.form.get('redes') as FormArray<FormGroup>;
  }

  get previewLocal(): string {
    return this.form.get('local')?.value ?? '';
  }

  get previewData(): string {
    return formatDateBr(this.form.get('dataEvento')?.value) || '';
  }

  get previewTelefone(): string {
    return this.form.get('telefone')?.value ?? '';
  }

  get previewEmail(): string {
    return this.form.get('email')?.value ?? '';
  }

  get previewImagemURL(): string {
    return this.form.get('imagemURL')?.value ?? '';
  }

  get showPreviewImage(): boolean {
    return isRemoteImageUrl(this.previewImagemURL) && !this.imageLoadFailed;
  }

  get availablePalestrantes(): Palestrante[] {
    const linkedIds = new Set(this.linkedPalestrantes.map((p) => p.id));
    return this.allPalestrantes.filter((p) => !linkedIds.has(p.id));
  }

  get confirmLabel(): string {
    if (this.pendingDelete?.kind === 'palestrante') return 'Desassociar';
    return 'Excluir';
  }

  get confirmTitle(): string {
    if (!this.pendingDelete) return 'Confirmar';
    if (this.pendingDelete.kind === 'lote') return 'Excluir lote';
    if (this.pendingDelete.kind === 'rede') return 'Excluir rede social';
    return 'Desassociar palestrante';
  }

  get confirmMessage(): string {
    if (!this.pendingDelete) return '';
    if (this.pendingDelete.kind === 'lote') {
      const nome = this.lotes.at(this.pendingDelete.index)?.get('nome')?.value || 'este lote';
      return `Deseja excluir o lote "${nome}"?`;
    }
    if (this.pendingDelete.kind === 'rede') {
      const nome = this.redes.at(this.pendingDelete.index)?.get('nome')?.value || 'esta rede';
      return `Deseja excluir a rede "${nome}"?`;
    }
    return `Deseja desassociar "${this.pendingDelete.palestrante.nome}" deste evento?`;
  }

  ngOnInit(): void {
    // Keep preview projection in sync with form (two-way: inputs ↔ preview).
    this.form.valueChanges.subscribe(() => {
      this.cdr.markForCheck();
    });

    this.form.get('imagemURL')?.valueChanges.subscribe(() => {
      this.imageLoadFailed = false;
    });

    if (!this.canWrite) {
      this.form.disable({ emitEvent: false });
    }

    // Route `eventos/new` has no `:id` param (null). Treat missing/new/0 as create.
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isNew = !idParam || idParam === 'new' || Number(idParam) === 0;

    if (this.isNew) {
      this.loading = false;
      return;
    }

    const eventoId = Number(idParam);
    if (Number.isNaN(eventoId)) {
      this.error = 'ID inválido.';
      this.loading = false;
      return;
    }

    forkJoin({
      evento: this.eventoService.getById(eventoId),
      lotes: this.loteService.getByEventoId(eventoId),
      redes: this.redeSocialService.getByEventoId(eventoId),
      palestrantes: this.palestranteService.listAll(),
    }).subscribe({
      next: ({ evento, lotes, redes, palestrantes }) => {
        this.populateForm(evento, lotes, redes);
        this.linkedPalestrantes = evento.palestrantes ?? [];
        this.allPalestrantes = palestrantes;
        if (!this.canWrite) {
          this.form.disable({ emitEvent: false });
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Evento não encontrado.';
        this.loading = false;
      },
    });
  }

  openUrlEditor(): void {
    if (!this.canWrite) return;
    this.urlDraft = this.previewImagemURL;
    this.urlError = null;
    this.showUrlEditor = true;
  }

  commitUrl(): void {
    if (!this.showUrlEditor) return;
    const trimmed = this.urlDraft.trim();
    if (!trimmed) {
      this.form.get('imagemURL')?.setValue('');
      this.urlError = null;
      this.showUrlEditor = false;
      return;
    }
    if (!isRemoteImageUrl(trimmed)) {
      this.urlError = 'Use um link http:// ou https:// (path local não carrega).';
      return;
    }
    this.form.get('imagemURL')?.setValue(trimmed);
    this.urlError = null;
    this.showUrlEditor = false;
  }

  onImageError(): void {
    queueMicrotask(() => {
      this.imageLoadFailed = true;
      this.cdr.markForCheck();
    });
  }

  addLote(): void {
    if (!this.canWrite) return;
    const eventoId = this.form.get('id')?.value ?? 0;
    this.lotes.push(createLoteGroup(this.fb, eventoId));
  }

  addRede(): void {
    if (!this.canWrite) return;
    const eventoId = this.form.get('id')?.value ?? 0;
    this.redes.push(createRedeGroup(this.fb, eventoId));
  }

  askDeleteLote(index: number): void {
    if (!this.canWrite) return;
    this.pendingDelete = { kind: 'lote', index };
  }

  askDeleteRede(index: number): void {
    if (!this.canWrite) return;
    this.pendingDelete = { kind: 'rede', index };
  }

  askDisassociate(palestrante: Palestrante): void {
    if (!this.canWrite || this.isNew) return;
    this.pendingDelete = { kind: 'palestrante', palestrante };
  }

  cancelDelete(): void {
    this.pendingDelete = null;
  }

  confirmDelete(): void {
    const pending = this.pendingDelete;
    this.pendingDelete = null;
    if (!pending) return;

    if (pending.kind === 'lote') {
      this.deleteLoteAt(pending.index);
      return;
    }
    if (pending.kind === 'rede') {
      this.deleteRedeAt(pending.index);
      return;
    }
    this.disassociatePalestrante(pending.palestrante);
  }

  associateSelected(): void {
    if (!this.canWrite || this.isNew || this.associateId == null) return;
    const eventoId = Number(this.form.get('id')?.value);
    const palestranteId = this.associateId;
    const palestrante = this.allPalestrantes.find((p) => p.id === palestranteId);
    if (!palestrante) return;

    this.associating = true;
    this.error = null;
    this.palestranteService.associate(eventoId, palestranteId).subscribe({
      next: () => {
        this.linkedPalestrantes = [...this.linkedPalestrantes, palestrante];
        this.associateId = null;
        this.success = 'Palestrante associado.';
        this.associating = false;
      },
      error: () => {
        this.error = 'Erro ao associar palestrante.';
        this.associating = false;
      },
    });
  }

  temaErrorMessage(): string {
    const control = this.form.get('tema');
    if (!control?.invalid || !control.touched) return '';
    if (control.hasError('trimmedMinLength') || control.hasError('required')) {
      return 'Tema deve ter entre 4 e 50 caracteres.';
    }
    if (control.hasError('maxlength')) {
      return 'Tema deve ter no máximo 50 caracteres.';
    }
    return 'Tema inválido.';
  }

  qtdErrorMessage(): string {
    const control = this.form.get('qtdPessoas');
    if (!control?.invalid || !control.touched) return '';
    if (control.hasError('max')) {
      return 'Máximo de 120000 pessoas.';
    }
    return 'Mínimo de 1 pessoa.';
  }

  save(): void {
    if (!this.canWrite) return;

    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;
    this.success = null;

    const raw = this.form.getRawValue();
    const { lotes, redes, ...eventoFields } = raw;

    const payload = {
      ...eventoFields,
      dataEvento: toApiDate(eventoFields.dataEvento),
      lotes: (lotes as Lote[]).map((lote) => ({
        ...lote,
        dataIncio: toApiDate(lote.dataIncio),
        dataFim: toApiDate(lote.dataFim),
      })),
      redesSociais: redes as RedeSocial[],
    };

    const request = this.isNew
      ? this.eventoService.create(payload)
      : this.eventoService.update(eventoFields.id, payload);

    request.subscribe({
      next: (saved) => {
        const lotesList = payload.lotes;
        const redesList = payload.redesSociais;
        const lotesRequest =
          lotesList.length > 0
            ? this.loteService.save(
                saved.id,
                lotesList.map((l: Lote) => ({ ...l, eventoId: saved.id })),
              )
            : null;
        const redesRequest =
          redesList.length > 0
            ? this.redeSocialService.saveByEventoId(
                saved.id,
                redesList.map((r: RedeSocial) => ({ ...r, eventoId: saved.id })),
              )
            : null;

        if (lotesRequest || redesRequest) {
          forkJoin({
            lotes: lotesRequest ?? this.loteService.getByEventoId(saved.id),
            redes: redesRequest ?? this.redeSocialService.getByEventoId(saved.id),
          }).subscribe({
            next: () => {
              this.saving = false;
              this.router.navigate(['/eventos', saved.id]);
            },
            error: () => {
              this.error = 'Evento salvo, mas houve erro ao salvar lotes/redes.';
              this.saving = false;
            },
          });
        } else {
          this.saving = false;
          this.router.navigate(['/eventos', saved.id]);
        }
      },
      error: () => {
        this.error = 'Erro ao salvar evento.';
        this.saving = false;
      },
    });
  }

  private deleteLoteAt(index: number): void {
    const group = this.lotes.at(index);
    if (!group) return;

    const loteId = Number(group.get('id')?.value ?? 0);
    const eventoId = Number(this.form.get('id')?.value ?? 0);

    if (loteId > 0 && eventoId > 0) {
      this.loteService.delete(eventoId, loteId).subscribe({
        next: () => {
          this.lotes.removeAt(index);
          this.success = 'Lote excluído.';
          this.error = null;
        },
        error: () => {
          this.error = 'Erro ao excluir lote.';
        },
      });
      return;
    }

    this.lotes.removeAt(index);
    this.success = 'Lote removido.';
  }

  private deleteRedeAt(index: number): void {
    const group = this.redes.at(index);
    if (!group) return;

    const redeId = Number(group.get('id')?.value ?? 0);
    const eventoId = Number(this.form.get('id')?.value ?? 0);

    if (redeId > 0 && eventoId > 0) {
      this.redeSocialService.deleteByEventoId(eventoId, redeId).subscribe({
        next: () => {
          this.redes.removeAt(index);
          this.success = 'Rede social excluída.';
          this.error = null;
        },
        error: () => {
          this.error = 'Erro ao excluir rede social.';
        },
      });
      return;
    }

    this.redes.removeAt(index);
    this.success = 'Rede social removida.';
  }

  private disassociatePalestrante(palestrante: Palestrante): void {
    const eventoId = Number(this.form.get('id')?.value);
    this.palestranteService.disassociate(eventoId, palestrante.id).subscribe({
      next: () => {
        this.linkedPalestrantes = this.linkedPalestrantes.filter((p) => p.id !== palestrante.id);
        this.success = 'Palestrante desassociado.';
        this.error = null;
      },
      error: () => {
        this.error = 'Erro ao desassociar palestrante.';
      },
    });
  }

  private populateForm(evento: Evento, lotes: Lote[], redes: RedeSocial[]): void {
    patchEventoForm(this.form, evento);
    setLotesFormArray(this.fb, this.form, lotes, evento.id);
    setRedesFormArray(this.fb, this.form, redes, evento.id);
  }
}
