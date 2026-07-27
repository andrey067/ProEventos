import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { apiErrorMessage } from '../../../shared/api-error-message';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);

  form = this.fb.group({
    userName: ['', Validators.required],
    password: ['', Validators.required],
  });

  saving = false;
  error: string | null = null;

  submit(): void {
    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    this.accountService.login(this.form.getRawValue() as { userName: string; password: string }).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/eventos']);
      },
      error: (err) => {
        this.error = apiErrorMessage(err.error, 'Usuário ou senha inválidos.');
        this.saving = false;
      },
    });
  }
}
