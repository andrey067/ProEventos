import { Component, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../common/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog/confirm-dialog.component';
import { apiErrorMessage } from '../../../../shared/api-error-message';
import { createRedeGroup } from '../../../../forms/schemas/evento-form.factory';
import { RedeSocial } from '../../../../models';
import { RedeSocialService } from '../../../../services/rede-social.service';
import { alertAnimation, SkeletonShimmerComponent } from '../../../../shared/motion';

@Component({
  selector: 'app-redes-sociais',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    SkeletonShimmerComponent,
  ],
  templateUrl: './redes-sociais.component.html',
  animations: [alertAnimation],
})
export class RedesSociaisComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly redeSocialService = inject(RedeSocialService);

  redesForm = this.fb.group({
    redes: this.fb.array<FormGroup>([]),
  });

  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  pendingRedeDelete: number | null = null;

  get redes(): FormArray<FormGroup> {
    return this.redesForm.get('redes') as FormArray<FormGroup>;
  }

  get deleteRedeMessage(): string {
    if (this.pendingRedeDelete === null) return '';
    const nome = this.redes.at(this.pendingRedeDelete)?.get('nome')?.value || 'esta rede';
    return `Deseja excluir a rede "${nome}"?`;
  }

  ngOnInit(): void {
    this.loadRedes();
  }

  addRede(): void {
    this.redes.push(createRedeGroup(this.fb, 0));
  }

  askDeleteRede(index: number): void {
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

  saveRedes(): void {
    this.redesForm.updateValueAndValidity();
    if (this.redesForm.invalid) {
      this.redes.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;
    this.success = null;

    const redes = this.redes.getRawValue() as RedeSocial[];
    this.redeSocialService.saveMine(redes).subscribe({
      next: (saved) => {
        this.setRedes(saved);
        this.success = 'Redes sociais salvas com sucesso.';
        this.saving = false;
      },
      error: (err) => {
        this.error = apiErrorMessage(err.error, 'Erro ao salvar redes sociais.');
        this.saving = false;
      },
    });
  }

  private loadRedes(): void {
    this.loading = true;
    this.error = null;
    this.redeSocialService.getMine().subscribe({
      next: (redes) => {
        this.setRedes(redes);
        this.loading = false;
      },
      error: () => {
        this.error = 'Não foi possível carregar redes sociais.';
        this.loading = false;
      },
    });
  }

  private deleteRedeAt(index: number): void {
    const group = this.redes.at(index);
    if (!group) return;

    const redeId = Number(group.get('id')?.value ?? 0);

    if (redeId > 0) {
      this.redeSocialService.deleteMine(redeId).subscribe({
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
    this.redesForm.setControl('redes', array);
  }
}
