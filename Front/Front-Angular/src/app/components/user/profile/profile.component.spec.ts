import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AccountService } from '../../../services/account.service';
import { RedeSocialService } from '../../../services/rede-social.service';
import { ProfileComponent } from './profile.component';

const baseProfile = {
  userName: 'u',
  email: 'a@b.com',
  nome: 'Nome Sobrenome',
  primeiroNome: 'Nome',
  ultimoNome: 'Sobrenome',
  titulo: 'NaoInformado' as const,
  funcao: 'Participante' as const,
  telefone: '11988887777',
  descricao: 'Bio do usuário',
  imagemURL: 'https://images.unsplash.com/photo-1?w=200',
  eventosMinistrados: 0,
  eventosParticipados: 0,
};

const palestranteProfile = {
  ...baseProfile,
  funcao: 'Palestrante' as const,
};

describe('ProfileComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AccountService,
          useValue: {
            getProfile: vi.fn(),
            updateProfile: vi.fn(),
          },
        },
        {
          provide: RedeSocialService,
          useValue: {
            getMine: vi.fn(),
            saveMine: vi.fn(),
            deleteMine: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('loads telefone and descricao into the form', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.loading).toBe(false);
    expect(fixture.componentInstance.form.getRawValue()).toEqual(
      expect.objectContaining({
        primeiroNome: 'Nome',
        ultimoNome: 'Sobrenome',
        email: 'a@b.com',
        telefone: '11988887777',
        descricao: 'Bio do usuário',
      }),
    );
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('input[formControlName="telefone"]'),
    ).toBeTruthy();
  });

  it('saves telefone and descricao via updateProfile', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));
    vi.mocked(accountService.updateProfile).mockReturnValue(
      of({
        ...baseProfile,
        telefone: '11911112222',
        descricao: 'Nova bio',
      }),
    );

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({
      telefone: '11911112222',
      descricao: 'Nova bio',
    });
    fixture.componentInstance.submit();

    expect(accountService.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        primeiroNome: 'Nome',
        ultimoNome: 'Sobrenome',
        userName: 'u',
        email: 'a@b.com',
        telefone: '11911112222',
        descricao: 'Nova bio',
      }),
    );
    expect(fixture.componentInstance.success).toBe('Perfil atualizado com sucesso.');
  });

  it('shows error when profile load fails', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(throwError(() => new Error('fail')));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Não foi possível carregar o perfil.');
    expect(fixture.componentInstance.loading).toBe(false);
  });

  it('shows error when save fails', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));
    vi.mocked(accountService.updateProfile).mockReturnValue(
      throwError(() => new Error('fail')),
    );

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.submit();
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao atualizar perfil.');
  });

  it('cancelEdit restores profile snapshot', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ ultimoNome: 'Alterado' });
    fixture.componentInstance.cancelEdit();

    expect(fixture.componentInstance.form.get('ultimoNome')?.value).toBe('Sobrenome');
    expect(fixture.componentInstance.error).toBeNull();
  });

  it('onImgError uses placeholder when image fails', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onImgError();
    expect(fixture.componentInstance.photoSrc).toContain('data:image/svg+xml');
  });

  it('does not submit when form is invalid', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ primeiroNome: '' });
    fixture.componentInstance.submit();

    expect(accountService.updateProfile).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.get('primeiroNome')?.touched).toBe(true);
  });

  it('submits password when provided', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));
    vi.mocked(accountService.updateProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({
      password: 'novaSenha1',
      confirmePassword: 'novaSenha1',
    });
    fixture.componentInstance.submit();

    expect(accountService.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'novaSenha1' }),
    );
  });

  it('rejects mismatched passwords', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({
      password: 'a',
      confirmePassword: 'b',
    });
    fixture.componentInstance.submit();

    expect(accountService.updateProfile).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.errors?.['passwordMismatch']).toBe(true);
  });

  it('applyProfile handles optional profile fields', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(
      of({
        userName: 'u',
        email: 'a@b.com',
        nome: 'Nome',
        primeiroNome: 'Nome',
        ultimoNome: 'Sobrenome',
        eventosMinistrados: 1,
        eventosParticipados: 2,
      } as typeof baseProfile),
    );

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.form.get('titulo')?.value).toBe('NaoInformado');
    expect(fixture.componentInstance.form.get('telefone')?.value).toBe('');
    expect(fixture.componentInstance.photoSrc).toContain('data:image/svg+xml');
  });

  it('cancelEdit restores snapshot and clears messages', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ ultimoNome: 'Alterado' });
    fixture.componentInstance.error = 'erro';
    fixture.componentInstance.success = 'ok';
    fixture.componentInstance.cancelEdit();

    expect(fixture.componentInstance.form.get('ultimoNome')?.value).toBe('Sobrenome');
    expect(fixture.componentInstance.error).toBeNull();
    expect(fixture.componentInstance.success).toBeNull();
  });

  it('onImgError uses placeholder even when imagemURL exists', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onImgError();
    expect(fixture.componentInstance.photoSrc).toContain('data:image/svg+xml');
  });

  it('shows generic error when save fails without api body', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));
    vi.mocked(accountService.updateProfile).mockReturnValue(
      throwError(() => new Error('network')),
    );

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.submit();
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao atualizar perfil.');
  });

  it('does not submit when form is invalid', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ email: '' });
    fixture.componentInstance.submit();

    expect(accountService.updateProfile).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.touched).toBe(true);
  });

  it('does not show redes section for Participante', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.isPalestrante).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Salvar Redes');
  });

  it('loads and saves redes for Palestrante', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    const redeSocialService = TestBed.inject(RedeSocialService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(palestranteProfile));
    vi.mocked(redeSocialService.getMine).mockReturnValue(
      of([{ id: 1, nome: 'GitHub', url: 'https://github.com/me' }]),
    );
    vi.mocked(redeSocialService.saveMine).mockReturnValue(
      of([{ id: 1, nome: 'GitHub', url: 'https://github.com/updated' }]),
    );

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.isPalestrante).toBe(true);
    expect(redeSocialService.getMine).toHaveBeenCalled();
    expect(fixture.componentInstance.redes.length).toBe(1);

    fixture.componentInstance.redes.at(0)?.patchValue({
      url: 'https://github.com/updated',
    });
    fixture.componentInstance.saveRedes();
    await fixture.whenStable();

    expect(redeSocialService.saveMine).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          nome: 'GitHub',
          url: 'https://github.com/updated',
        }),
      ]),
    );
    expect(fixture.componentInstance.redesSuccess).toBe('Redes sociais salvas com sucesso.');
  });

  it('deletes persisted rede via deleteMine after confirmation', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    const redeSocialService = TestBed.inject(RedeSocialService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(palestranteProfile));
    vi.mocked(redeSocialService.getMine).mockReturnValue(
      of([{ id: 5, nome: 'LinkedIn', url: 'https://linkedin.com/in/me' }]),
    );
    vi.mocked(redeSocialService.deleteMine).mockReturnValue(of({ message: 'Removida' }));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.askDeleteRede(0);
    fixture.componentInstance.confirmDeleteRede();
    await fixture.whenStable();

    expect(redeSocialService.deleteMine).toHaveBeenCalledWith(5);
    expect(fixture.componentInstance.redes.length).toBe(0);
  });
});
