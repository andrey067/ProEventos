import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { apiErrorMessage } from '../../../shared/api-error-message';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);

  form = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', Validators.required],
  });

  saving = false;
  error: string | null = null;
  success: string | null = null;

  submit(): void {
    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;
    this.success = null;

    this.accountService.changePassword(this.form.getRawValue() as {
      currentPassword: string;
      newPassword: string;
    }).subscribe({
      next: () => {
        this.success = 'Senha alterada com sucesso.';
        this.form.reset();
        this.saving = false;
      },
      error: (err) => {
        this.error = apiErrorMessage(err.error, 'Não foi possível alterar a senha.');
        this.saving = false;
      },
    });
  }
}
