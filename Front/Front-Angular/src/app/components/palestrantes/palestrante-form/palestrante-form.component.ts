import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../common/loading-spinner/loading-spinner.component';
import {
  createPalestranteForm,
  createRedeGroup,
  patchPalestranteForm,
} from '../../../forms';
import { RedeSocial } from '../../../models';
import { AuthTokenService } from '../../../services/auth-token.service';
import { PalestranteService } from '../../../services/palestrante.service';
import { RedeSocialService } from '../../../services/rede-social.service';
import { isRemoteImageUrl } from '../../../shared/image-url';

@Component({
  selector: 'app-palestrante-form',
  imports: [ReactiveFormsModule, ConfirmDialogComponent, RouterLink, LoadingSpinnerComponent],
  templateUrl: './palestrante-form.component.html',
  styleUrl: './palestrante-form.component.scss',
})
export class PalestranteFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly palestranteService = inject(PalestranteService);
  private readonly redeSocialService = inject(RedeSocialService);
  private readonly authToken = inject(AuthTokenService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);

  isNew = true;
  editingId: number | null = null;
  loading = true;
  redesLoading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  form: FormGroup = createPalestranteForm(this.fb);
  pendingRedeDelete: number | null = null;
  previewImageFailed = false;

  get canWrite(): boolean {
    return this.authToken.canWrite();
  }

  get isAuthenticated(): boolean {
    return this.authToken.isAuthenticated();
  }

  get redes(): FormArray<FormGroup> {
    return this.form.get('redes') as FormArray<FormGroup>;
  }

  get previewImagemURL(): string {
    return this.form.get('imagemURL')?.value ?? '';
  }

  get showPreviewImage(): boolean {
    return isRemoteImageUrl(this.previewImagemURL) && !this.previewImageFailed;
  }

  get deleteRedeMessage(): string {
    if (this.pendingRedeDelete === null) return '';
    const nome = this.redes.at(this.pendingRedeDelete)?.get('nome')?.value || 'esta rede';
    return `Deseja excluir a rede "${nome}"?`;
  }

  ngOnInit(): void {
    this.form.get('imagemURL')?.valueChanges.subscribe(() => {
      this.previewImageFailed = false;
    });

    if (!this.canWrite) {
      this.form.disable({ emitEvent: false });
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    const isCreate = !idParam || idParam === 'new';
    this.isNew = isCreate;

    if (isCreate) {
      this.loading = false;
      return;
    }

    const id = Number(idParam);
    if (!Number.isFinite(id) || id <= 0) {
      this.error = 'Palestrante não encontrado.';
      this.loading = false;
      return;
    }

    this.editingId = id;
    this.palestranteService.getById(id).subscribe({
      next: (palestrante) => {
        patchPalestranteForm(this.form, palestrante);
        this.loading = false;
        this.loadRedes(id);
      },
      error: () => {
        this.error = 'Não foi possível carregar o palestrante.';
        this.loading = false;
      },
    });
  }

  onPreviewError(): void {
    queueMicrotask(() => {
      this.previewImageFailed = true;
      this.cdr.markForCheck();
    });
  }

  addRede(): void {
    if (!this.canWrite) return;
    this.redes.push(createRedeGroup(this.fb, 0));
  }

  askDeleteRede(index: number): void {
    if (!this.canWrite) return;
    this.pendingRedeDelete = index;
  }

  cancelDeleteRede(): void {
    this.pendingRedeDelete = null;
  }

  confirmDeleteRede(): void {
    const index = this.pendingRedeDelete;
    this.pendingRedeDelete = null;
    if (index === null) return;
    this.deleteRedeAt(index);
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
    const { redes, ...payload } = raw;
    const request = this.editingId
      ? this.palestranteService.update(this.editingId, { id: this.editingId, ...payload })
      : this.palestranteService.create(payload);

    request.subscribe({
      next: (saved) => {
        const redesList = (redes as RedeSocial[]) ?? [];
        const palestranteId = saved.id;
        const finish = () => {
          this.saving = false;
          this.success = 'Palestrante salvo.';
          void this.router.navigate(['/palestrantes']);
        };

        if (redesList.length > 0 || this.editingId) {
          this.redeSocialService
            .saveByPalestranteId(
              palestranteId,
              redesList.map((r) => ({ ...r, palestranteId })),
            )
            .subscribe({
              next: () => finish(),
              error: () => {
                this.error = 'Palestrante salvo, mas houve erro ao salvar redes.';
                this.saving = false;
              },
            });
        } else {
          finish();
        }
      },
      error: () => {
        this.error = 'Erro ao salvar palestrante.';
        this.saving = false;
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/palestrantes']);
  }

  private loadRedes(palestranteId: number): void {
    this.redesLoading = true;
    this.redeSocialService.getByPalestranteId(palestranteId).subscribe({
      next: (redes) => {
        this.setRedes(redes);
        this.redesLoading = false;
      },
      error: () => {
        this.error = 'Não foi possível carregar redes sociais.';
        this.redesLoading = false;
      },
    });
  }

  private deleteRedeAt(index: number): void {
    const group = this.redes.at(index);
    if (!group) return;

    const redeId = Number(group.get('id')?.value ?? 0);
    const palestranteId = this.editingId ?? 0;

    if (redeId > 0 && palestranteId > 0) {
      this.redeSocialService.deleteByPalestranteId(palestranteId, redeId).subscribe({
        next: () => {
          this.redes.removeAt(index);
          this.success = 'Rede social excluída.';
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

  private setRedes(redes: RedeSocial[]): void {
    const array = this.fb.array(
      redes.map((rede) => {
        const group = createRedeGroup(this.fb, 0);
        group.patchValue({
          id: rede.id,
          nome: rede.nome,
          url: rede.url,
          eventoId: 0,
        });
        return group;
      }),
    );
    this.form.setControl('redes', array);
  }
}
