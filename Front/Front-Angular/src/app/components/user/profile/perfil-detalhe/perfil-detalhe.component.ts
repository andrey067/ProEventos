import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AccountService } from '../../../../services/account.service';
import { apiErrorMessage } from '../../../../shared/api-error-message';
import {
  FUNCAO_OPTIONS,
  TITULO_OPTIONS,
  Funcao,
  Titulo,
  UserProfile,
} from '../../../../models';

export type ProfileFormPreview = {
  primeiroNome: string;
  ultimoNome: string;
  descricao: string;
  funcao: Funcao;
};

function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value ?? '';
  const confirm = group.get('confirmePassword')?.value ?? '';
  if (!password && !confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-perfil-detalhe',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './perfil-detalhe.component.html',
})
export class PerfilDetalheComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);

  @Input({ required: true }) profile!: UserProfile;
  @Output() formPreview = new EventEmitter<ProfileFormPreview>();
  @Output() saved = new EventEmitter<UserProfile>();
  @Output() cancelled = new EventEmitter<void>();

  readonly tituloOptions = TITULO_OPTIONS;
  readonly funcaoOptions = FUNCAO_OPTIONS;

  form = this.fb.group(
    {
      titulo: ['NaoInformado' as Titulo, Validators.required],
      primeiroNome: ['', Validators.required],
      ultimoNome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      funcao: ['Participante' as Funcao, Validators.required],
      descricao: ['', Validators.required],
      password: [''],
      confirmePassword: [''],
    },
    { validators: passwordMatch },
  );

  saving = false;
  error: string | null = null;
  success: string | null = null;

  ngOnInit(): void {
    this.applyProfile(this.profile);
    this.form.valueChanges.subscribe(() => this.emitPreview());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profile'] && !changes['profile'].firstChange && this.profile) {
      this.applyProfile(this.profile);
    }
  }

  private emitPreview(): void {
    const v = this.form.getRawValue();
    this.formPreview.emit({
      primeiroNome: v.primeiroNome ?? '',
      ultimoNome: v.ultimoNome ?? '',
      descricao: v.descricao ?? '',
      funcao: (v.funcao ?? 'Participante') as Funcao,
    });
  }

  private applyProfile(p: UserProfile): void {
    this.form.reset(
      {
        titulo: p.titulo ?? 'NaoInformado',
        primeiroNome: p.primeiroNome ?? '',
        ultimoNome: p.ultimoNome ?? '',
        email: p.email,
        telefone: p.telefone ?? '',
        funcao: p.funcao ?? 'Participante',
        descricao: p.descricao ?? '',
        password: '',
        confirmePassword: '',
      },
      { emitEvent: false },
    );
    this.error = null;
    this.success = null;
  }

  cancelEdit(): void {
    this.applyProfile(this.profile);
    this.cancelled.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving = true;
    this.error = null;
    this.success = null;
    const payload: Parameters<AccountService['updateProfile']>[0] = {
      userName: this.profile.userName,
      email: v.email!,
      primeiroNome: v.primeiroNome!,
      ultimoNome: v.ultimoNome!,
      titulo: v.titulo as Titulo,
      funcao: v.funcao as Funcao,
      telefone: v.telefone!,
      descricao: v.descricao!,
    };
    if (v.password) payload.password = v.password;

    this.accountService.updateProfile(payload).subscribe({
      next: (updated) => {
        this.saving = false;
        this.success = 'Perfil atualizado.';
        this.saved.emit(updated);
      },
      error: (err) => {
        this.saving = false;
        this.error = apiErrorMessage(err.error, 'Erro ao salvar perfil.');
      },
    });
  }
}
