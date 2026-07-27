import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { apiErrorMessage } from '../../../shared/api-error-message';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
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

    this.accountService.register(this.form.getRawValue() as {
      nome: string;
      userName: string;
      email: string;
      password: string;
    }).subscribe({
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
