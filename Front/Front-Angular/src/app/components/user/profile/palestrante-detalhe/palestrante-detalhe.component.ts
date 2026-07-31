import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PalestranteService } from '../../../../services/palestrante.service';
import {
  createPalestranteForm,
  patchPalestranteForm,
} from '../../../../forms/schemas/palestrante-form.factory';
import { apiErrorMessage } from '../../../../shared/api-error-message';
import { Palestrante } from '../../../../models';

@Component({
  selector: 'app-palestrante-detalhe',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './palestrante-detalhe.component.html',
})
export class PalestranteDetalheComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly palestranteService = inject(PalestranteService);

  form = createPalestranteForm(this.fb);
  palestranteId: number | null = null;
  loading = true;
  saving = false;
  error: string | null = null;
  success: string | null = null;
  missingProfile = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.missingProfile = false;
    this.palestranteService.getMe().subscribe({
      next: (p) => {
        this.palestranteId = p.id;
        patchPalestranteForm(this.form, p);
        this.loading = false;
      },
      error: (err: unknown) => {
        this.loading = false;
        if (err instanceof HttpErrorResponse && err.status === 404) {
          this.missingProfile = true;
          this.error = 'Salve o perfil com função Palestrante primeiro';
          this.palestranteId = null;
          return;
        }
        const httpErr = err as HttpErrorResponse;
        this.error = apiErrorMessage(httpErr.error, 'Erro ao carregar palestrante.');
      },
    });
  }

  submit(): void {
    if (this.palestranteId == null || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: Palestrante = {
      id: this.palestranteId,
      nome: v.nome ?? '',
      email: v.email ?? '',
      telefone: v.telefone ?? '',
      imagemURL: v.imagemURL ?? '',
      miniCurriculo: v.miniCurriculo ?? '',
    };
    this.saving = true;
    this.error = null;
    this.success = null;
    this.palestranteService.update(this.palestranteId, payload).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Palestrante atualizado.';
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.error = apiErrorMessage(err.error, 'Erro ao salvar palestrante.');
      },
    });
  }
}
