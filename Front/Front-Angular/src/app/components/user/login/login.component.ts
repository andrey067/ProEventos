import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { LoadingSpinnerComponent } from '../../common/loading-spinner/loading-spinner.component';
import { apiErrorMessage } from '../../../shared/api-error-message';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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
        this.router.navigateByUrl(this.resolveReturnUrl());
      },
      error: (err) => {
        this.error = apiErrorMessage(err.error, 'Usuário ou senha inválidos.');
        this.saving = false;
      },
    });
  }

  private resolveReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
      return returnUrl;
    }
    return '/eventos';
  }
}
