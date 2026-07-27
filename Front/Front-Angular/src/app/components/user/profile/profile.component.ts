import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { apiErrorMessage } from '../../../shared/api-error-message';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);

  form = this.fb.group({
    nome: ['', Validators.required],
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  loading = true;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  ngOnInit(): void {
    this.accountService.getProfile().subscribe({
      next: (profile) => {
        this.form.patchValue(profile);
        this.loading = false;
      },
      error: () => {
        this.error = 'Não foi possível carregar o perfil.';
        this.loading = false;
      },
    });
  }

  submit(): void {
    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = null;
    this.success = null;

    this.accountService.updateProfile(this.form.getRawValue() as {
      nome: string;
      userName: string;
      email: string;
    }).subscribe({
      next: () => {
        this.success = 'Perfil atualizado com sucesso.';
        this.saving = false;
      },
      error: (err) => {
        this.error = apiErrorMessage(err.error, 'Erro ao atualizar perfil.');
        this.saving = false;
      },
    });
  }
}
