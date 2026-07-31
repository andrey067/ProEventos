import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { AccountService } from '../../../../services/account.service';
import { PerfilDetalheComponent } from './perfil-detalhe.component';

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

describe('PerfilDetalheComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [PerfilDetalheComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AccountService,
          useValue: {
            getProfile: vi.fn(),
            updateProfile: vi.fn(),
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
    const fixture = TestBed.createComponent(PerfilDetalheComponent);
    fixture.componentRef.setInput('profile', baseProfile);
    fixture.detectChanges();
    await fixture.whenStable();

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

  it('emits formPreview on value change', async () => {
    await setup();
    const fixture = TestBed.createComponent(PerfilDetalheComponent);
    fixture.componentRef.setInput('profile', baseProfile);
    fixture.detectChanges();
    await fixture.whenStable();

    const emitSpy = vi.spyOn(fixture.componentInstance.formPreview, 'emit');
    emitSpy.mockClear();

    fixture.componentInstance.form.patchValue({ primeiroNome: 'Live' });
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        primeiroNome: 'Live',
        ultimoNome: 'Sobrenome',
        descricao: 'Bio do usuário',
        funcao: 'Participante',
      }),
    );
  });

  it('saves telefone and descricao via updateProfile', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.updateProfile).mockReturnValue(
      of({
        ...baseProfile,
        telefone: '11911112222',
        descricao: 'Nova bio',
      }),
    );

    const fixture = TestBed.createComponent(PerfilDetalheComponent);
    fixture.componentRef.setInput('profile', baseProfile);
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
    expect(fixture.componentInstance.success).toBe('Perfil atualizado.');
  });

  it('shows error when save fails', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.updateProfile).mockReturnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(PerfilDetalheComponent);
    fixture.componentRef.setInput('profile', baseProfile);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.submit();
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao salvar perfil.');
  });

  it('cancelEdit restores profile snapshot', async () => {
    await setup();
    const fixture = TestBed.createComponent(PerfilDetalheComponent);
    fixture.componentRef.setInput('profile', baseProfile);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ ultimoNome: 'Alterado' });
    fixture.componentInstance.cancelEdit();

    expect(fixture.componentInstance.form.get('ultimoNome')?.value).toBe('Sobrenome');
    expect(fixture.componentInstance.error).toBeNull();
  });

  it('does not submit when form is invalid', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    const fixture = TestBed.createComponent(PerfilDetalheComponent);
    fixture.componentRef.setInput('profile', baseProfile);
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
    vi.mocked(accountService.updateProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(PerfilDetalheComponent);
    fixture.componentRef.setInput('profile', baseProfile);
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
    const fixture = TestBed.createComponent(PerfilDetalheComponent);
    fixture.componentRef.setInput('profile', baseProfile);
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

  it('handles optional profile fields', async () => {
    await setup();
    const fixture = TestBed.createComponent(PerfilDetalheComponent);
    fixture.componentRef.setInput('profile', {
      userName: 'u',
      email: 'a@b.com',
      nome: 'Nome',
      primeiroNome: 'Nome',
      ultimoNome: 'Sobrenome',
      eventosMinistrados: 1,
      eventosParticipados: 2,
    } as typeof baseProfile);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.form.get('titulo')?.value).toBe('NaoInformado');
    expect(fixture.componentInstance.form.get('telefone')?.value).toBe('');
  });

  it('reapplies profile when @Input profile changes after first change', async () => {
    await setup();
    const fixture = TestBed.createComponent(PerfilDetalheComponent);
    fixture.componentRef.setInput('profile', baseProfile);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.form.patchValue({ primeiroNome: 'Editado' });
    fixture.componentRef.setInput('profile', {
      ...baseProfile,
      primeiroNome: 'Novo',
      ultimoNome: 'Perfil',
      descricao: 'Outra bio',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.form.get('primeiroNome')?.value).toBe('Novo');
    expect(fixture.componentInstance.form.get('descricao')?.value).toBe('Outra bio');
  });

  it('emits empty strings when preview fields are nullish', async () => {
    await setup();
    const fixture = TestBed.createComponent(PerfilDetalheComponent);
    fixture.componentRef.setInput('profile', baseProfile);
    fixture.detectChanges();
    await fixture.whenStable();

    const emitSpy = vi.spyOn(fixture.componentInstance.formPreview, 'emit');
    emitSpy.mockClear();
    fixture.componentInstance.form.patchValue({
      primeiroNome: null,
      ultimoNome: null,
      descricao: null,
      funcao: null,
    });
    fixture.detectChanges();

    expect(emitSpy).toHaveBeenCalledWith({
      primeiroNome: '',
      ultimoNome: '',
      descricao: '',
      funcao: 'Participante',
    });
  });
});
