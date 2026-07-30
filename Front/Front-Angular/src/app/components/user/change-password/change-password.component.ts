import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { passwordMatchValidator } from '../../../forms';
import { AccountService } from '../../../services/account.service';
import { LoadingSpinnerComponent } from '../../common/loading-spinner/loading-spinner.component';
import { apiErrorMessage } from '../../../shared/api-error-message';
import {
  alertAnimation,
  pageEnterAnimation,
  panelEnterAnimation,
} from '../../../shared/motion';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
  animations: [pageEnterAnimation, alertAnimation, panelEnterAnimation],
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);

  form = this.fb.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    },
    { validators: [passwordMatchValidator('newPassword', 'confirmPassword')] },
  );

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

    const { currentPassword, newPassword } = this.form.getRawValue();
    this.accountService
      .changePassword({
        currentPassword: currentPassword!,
        newPassword: newPassword!,
      })
      .subscribe({
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
