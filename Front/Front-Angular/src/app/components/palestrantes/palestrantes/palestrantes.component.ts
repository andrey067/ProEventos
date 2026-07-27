import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import {
  createPalestranteForm,
  patchPalestranteForm,
  resetPalestranteForm,
} from '../../../forms';
import { Palestrante } from '../../../models';
import { AuthTokenService } from '../../../services/auth-token.service';
import { PalestranteService } from '../../../services/palestrante.service';

@Component({
  selector: 'app-palestrantes',
  imports: [ReactiveFormsModule, ConfirmDialogComponent, RouterLink],
  templateUrl: './palestrantes.component.html',
  styleUrl: './palestrantes.component.scss',
})
export class PalestrantesComponent implements OnInit {
  private readonly palestranteService = inject(PalestranteService);
  private readonly authToken = inject(AuthTokenService);
  private readonly fb = inject(FormBuilder);

  palestrantes: Palestrante[] = [];
  form: FormGroup = createPalestranteForm(this.fb);
  editingId: number | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  pendingDelete: Palestrante | null = null;

  get canWrite(): boolean {
    return this.authToken.isAuthenticated();
  }

  get deleteMessage(): string {
    return this.pendingDelete
      ? `Deseja deletar "${this.pendingDelete.nome}"?`
      : '';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.palestranteService.getAll().subscribe({
      next: (data) => {
        this.palestrantes = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Não foi possível carregar palestrantes.';
        this.loading = false;
      },
    });
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

    const payload = this.form.getRawValue();
    const request = this.editingId
      ? this.palestranteService.update(this.editingId, { id: this.editingId, ...payload })
      : this.palestranteService.create(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        setTimeout(() => {
          this.resetForm();
          this.reloadPalestrantes();
        });
      },
      error: () => {
        this.error = 'Erro ao salvar palestrante.';
        this.saving = false;
      },
    });
  }

  edit(palestrante: Palestrante): void {
    if (!this.canWrite) return;

    this.editingId = palestrante.id;
    patchPalestranteForm(this.form, palestrante);
  }

  askDelete(palestrante: Palestrante): void {
    if (!this.canWrite) return;

    this.pendingDelete = palestrante;
  }

  cancelDelete(): void {
    this.pendingDelete = null;
  }

  confirmDelete(): void {
    const palestrante = this.pendingDelete;
    this.pendingDelete = null;
    if (!palestrante) return;

    this.palestranteService.delete(palestrante.id).subscribe({
      next: () => {
        if (this.editingId === palestrante.id) this.resetForm();
        this.reloadPalestrantes();
      },
      error: () => alert('Erro ao deletar palestrante.'),
    });
  }

  resetForm(): void {
    resetPalestranteForm(this.form);
    this.editingId = null;
  }

  private reloadPalestrantes(): void {
    this.palestranteService.getAll().subscribe({
      next: (data) => {
        this.palestrantes = data;
      },
      error: () => {
        this.error = 'Não foi possível carregar palestrantes.';
      },
    });
  }
}
