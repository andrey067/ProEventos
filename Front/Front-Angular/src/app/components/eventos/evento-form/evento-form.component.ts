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
import { Evento, Lote, RedeSocial } from '../../../models';
import { EventoService } from '../../../services/evento.service';
import { LoteService } from '../../../services/lote.service';
import { RedeSocialService } from '../../../services/rede-social.service';
import { formatDateBr, toApiDate } from '../../../shared/date';
import { isRemoteImageUrl } from '../../../shared/image-url';
import { DatePickerComponent } from '../../../shared/date-picker/date-picker.component';
import { NgxCurrencyDirective } from 'ngx-currency';

@Component({
  selector: 'app-evento-form',
  imports: [RouterLink, ReactiveFormsModule, DatePickerComponent, NgxCurrencyDirective],
  templateUrl: './evento-form.component.html',
  styleUrl: './evento-form.component.scss',
})
export class EventoFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly eventoService = inject(EventoService);
  private readonly loteService = inject(LoteService);
  private readonly redeSocialService = inject(RedeSocialService);

  isNew = true;
  loading = true;
  saving = false;
  error: string | null = null;
  form = createEventoForm(this.fb);

  showUrlEditor = false;
  urlDraft = '';
  urlError: string | null = null;
  imageLoadFailed = false;

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

  ngOnInit(): void {
    this.form.get('imagemURL')?.valueChanges.subscribe(() => {
      this.imageLoadFailed = false;
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    this.isNew = idParam === 'new';

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
    }).subscribe({
      next: ({ evento, lotes, redes }) => {
        this.populateForm(evento, lotes, redes);
        this.loading = false;
      },
      error: () => {
        this.error = 'Evento não encontrado.';
        this.loading = false;
      },
    });
  }

  openUrlEditor(): void {
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
    const eventoId = this.form.get('id')?.value ?? 0;
    this.lotes.push(createLoteGroup(this.fb, eventoId));
  }

  addRede(): void {
    const eventoId = this.form.get('id')?.value ?? 0;
    this.redes.push(createRedeGroup(this.fb, eventoId));
  }

  save(): void {
    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

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

  private populateForm(evento: Evento, lotes: Lote[], redes: RedeSocial[]): void {
    patchEventoForm(this.form, evento);
    setLotesFormArray(this.fb, this.form, lotes, evento.id);
    setRedesFormArray(this.fb, this.form, redes, evento.id);
  }
}
