import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { LoadingSpinnerComponent } from '../../common/loading-spinner/loading-spinner.component';
import { apiErrorMessage } from '../../../shared/api-error-message';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);

  form = this.fb.group({
    nome: ['', Validators.required],
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    asPalestrante: [false],
    miniCurriculo: [''],
    telefone: [''],
    imagemURL: [''],
  });

  saving = false;
  error: string | null = null;

  get asPalestrante(): boolean {
    return !!this.form.get('asPalestrante')?.value;
  }

  submit(): void {
    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const raw = this.form.getRawValue();
    const base = {
      nome: raw.nome!,
      userName: raw.userName!,
      email: raw.email!,
      password: raw.password!,
    };

    const request = raw.asPalestrante
      ? this.accountService.registerPalestrante({
          ...base,
          miniCurriculo: raw.miniCurriculo || undefined,
          telefone: raw.telefone || undefined,
          imagemURL: raw.imagemURL || undefined,
        })
      : this.accountService.register(base);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/eventos']);
      },
      error: (err) => {
        this.error = apiErrorMessage(err.error, 'Não foi possível criar a conta.');
        this.saving = false;
      },
    });
  }
}
