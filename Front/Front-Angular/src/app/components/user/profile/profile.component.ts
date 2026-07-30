import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AccountService } from '../../../services/account.service';
import { LoadingSpinnerComponent } from '../../common/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { apiErrorMessage } from '../../../shared/api-error-message';
import { createRedeGroup } from '../../../forms/schemas/evento-form.factory';
import {
  FUNCAO_OPTIONS,
  TITULO_OPTIONS,
  Funcao,
  RedeSocial,
  Titulo,
  UserProfile,
} from '../../../models';
import { RedeSocialService } from '../../../services/rede-social.service';
import {
  alertAnimation,
  pageEnterAnimation,
  panelEnterAnimation,
  SkeletonShimmerComponent,
} from '../../../shared/motion';

const PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="#e5e7eb" width="120" height="120"/><circle cx="60" cy="46" r="22" fill="#9ca3af"/><ellipse cx="60" cy="100" rx="36" ry="28" fill="#9ca3af"/></svg>`,
  );

function passwordMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value ?? '';
  const confirm = group.get('confirmePassword')?.value ?? '';
  if (!password && !confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-profile',
  imports: [
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    SkeletonShimmerComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  animations: [pageEnterAnimation, alertAnimation, panelEnterAnimation],
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly accountService = inject(AccountService);
  private readonly redeSocialService = inject(RedeSocialService);

  readonly tituloOptions = TITULO_OPTIONS;
  readonly funcaoOptions = FUNCAO_OPTIONS;
  readonly placeholder = PLACEHOLDER;

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

  redesForm = this.fb.group({
    redes: this.fb.array<FormGroup>([]),
  });

  snapshot: UserProfile | null = null;
  imgBroken = false;
  loading = true;
  saving = false;
  redesLoading = false;
  savingRedes = false;
  error: string | null = null;
  success: string | null = null;
  redesError: string | null = null;
  redesSuccess: string | null = null;
  pendingRedeDelete: number | null = null;

  get redes(): FormArray<FormGroup> {
    return this.redesForm.get('redes') as FormArray<FormGroup>;
  }

  get isPalestrante(): boolean {
    const funcao = this.form.get('funcao')?.value ?? this.snapshot?.funcao;
    return funcao === 'Palestrante';
  }

  get photoSrc(): string {
    if (this.imgBroken || !this.snapshot?.imagemURL) return this.placeholder;
    return this.snapshot.imagemURL;
  }

  get deleteRedeMessage(): string {
    if (this.pendingRedeDelete === null) return '';
    const nome = this.redes.at(this.pendingRedeDelete)?.get('nome')?.value || 'esta rede';
    return `Deseja excluir a rede "${nome}"?`;
  }

  ngOnInit(): void {
    this.accountService.getProfile().subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.loading = false;
      },
      error: () => {
        this.error = 'Não foi possível carregar o perfil.';
        this.loading = false;
      },
    });
  }

  applyProfile(profile: UserProfile): void {
    this.snapshot = profile;
    this.imgBroken = false;
    this.form.reset({
      titulo: profile.titulo ?? 'NaoInformado',
      primeiroNome: profile.primeiroNome ?? '',
      ultimoNome: profile.ultimoNome ?? '',
      email: profile.email,
      telefone: profile.telefone ?? '',
      funcao: profile.funcao ?? 'Participante',
      descricao: profile.descricao ?? '',
      password: '',
      confirmePassword: '',
    });

    if (profile.funcao === 'Palestrante') {
      this.loadRedes();
    } else {
      this.setRedes([]);
    }
  }

  cancelEdit(): void {
    if (this.snapshot) this.applyProfile(this.snapshot);
    this.error = null;
    this.success = null;
    this.redesError = null;
    this.redesSuccess = null;
  }

  onImgError(): void {
    this.imgBroken = true;
  }

  addRede(): void {
    this.redes.push(createRedeGroup(this.fb, 0));
  }

  askDeleteRede(index: number): void {
    this.pendingRedeDelete = index;
  }

  cancelDeleteRede(): void {
    this.pendingRedeDelete = null;
  }

  confirmDeleteRede(): void {
    const index = this.pendingRedeDelete;
    this.pendingRedeDelete = null;
    if (index === null) return;
    this.deleteRedeAt(index);
  }

  saveRedes(): void {
    this.redesForm.updateValueAndValidity();
    if (this.redesForm.invalid) {
      this.redes.markAllAsTouched();
      return;
    }

    this.savingRedes = true;
    this.redesError = null;
    this.redesSuccess = null;

    const redes = this.redes.getRawValue() as RedeSocial[];
    this.redeSocialService.saveMine(redes).subscribe({
      next: (saved) => {
        this.setRedes(saved);
        this.redesSuccess = 'Redes sociais salvas com sucesso.';
        this.savingRedes = false;
      },
      error: (err) => {
        this.redesError = apiErrorMessage(err.error, 'Erro ao salvar redes sociais.');
        this.savingRedes = false;
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

    const raw = this.form.getRawValue();
    this.accountService
      .updateProfile({
        userName: this.snapshot?.userName,
        email: raw.email!,
        primeiroNome: raw.primeiroNome!,
        ultimoNome: raw.ultimoNome!,
        titulo: raw.titulo as Titulo,
        funcao: raw.funcao as Funcao,
        telefone: raw.telefone!,
        descricao: raw.descricao!,
        ...(raw.password ? { password: raw.password } : {}),
      })
      .subscribe({
        next: (profile) => {
          this.applyProfile(profile);
          this.success = 'Perfil atualizado com sucesso.';
          this.saving = false;
        },
        error: (err) => {
          this.error = apiErrorMessage(err.error, 'Erro ao atualizar perfil.');
          this.saving = false;
        },
      });
  }

  private loadRedes(): void {
    this.redesLoading = true;
    this.redesError = null;
    this.redeSocialService.getMine().subscribe({
      next: (redes) => {
        this.setRedes(redes);
        this.redesLoading = false;
      },
      error: () => {
        this.redesError = 'Não foi possível carregar redes sociais.';
        this.redesLoading = false;
      },
    });
  }

  private deleteRedeAt(index: number): void {
    const group = this.redes.at(index);
    if (!group) return;

    const redeId = Number(group.get('id')?.value ?? 0);

    if (redeId > 0) {
      this.redeSocialService.deleteMine(redeId).subscribe({
        next: () => {
          this.redes.removeAt(index);
          this.redesSuccess = 'Rede social excluída.';
        },
        error: () => {
          this.redesError = 'Erro ao excluir rede social.';
        },
      });
      return;
    }

    this.redes.removeAt(index);
    this.redesSuccess = 'Rede social removida.';
  }

  private setRedes(redes: RedeSocial[]): void {
    const array = this.fb.array(
      redes.map((rede) => {
        const group = createRedeGroup(this.fb, 0);
        group.patchValue({
          id: rede.id,
          nome: rede.nome,
          url: rede.url,
          eventoId: 0,
        });
        return group;
      }),
    );
    this.redesForm.setControl('redes', array);
  }
}
