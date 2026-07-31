import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AccountService } from '../../../services/account.service';
import { PalestranteService } from '../../../services/palestrante.service';
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
          provide: PalestranteService,
          useValue: {
            getMe: vi.fn().mockReturnValue(
              of({ id: 1, nome: '', email: '', telefone: '', imagemURL: '', miniCurriculo: '' }),
            ),
            update: vi.fn(),
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
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('input[formControlName="telefone"]'),
    ).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('textarea[formControlName="descricao"]'),
    ).toBeTruthy();
  });

  it('shows error when profile load fails', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.error).toBe('Erro ao carregar perfil.');
    expect(fixture.componentInstance.loading).toBe(false);
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

  it('applySnapshot handles optional profile fields', async () => {
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

    expect(fixture.componentInstance.cardView?.primeiroNome).toBe('Nome');
    expect(fixture.componentInstance.photoSrc).toContain('data:image/svg+xml');
  });

  it('updates card nome/descricao live when perfil tab emits formPreview', async () => {
    await setup();
    const account = TestBed.inject(AccountService);
    vi.mocked(account.getProfile).mockReturnValue(of(baseProfile));
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onFormPreview({
      primeiroNome: 'Live',
      ultimoNome: 'Nome',
      descricao: 'Bio ao vivo',
      funcao: 'Participante',
    });
    await fixture.whenStable();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Live Nome');
    expect(text).toContain('Bio ao vivo');
  });

  it('hides Palestrante and Rede Social tabs when funcao is Participante', async () => {
    await setup();
    const account = TestBed.inject(AccountService);
    vi.mocked(account.getProfile).mockReturnValue(of(baseProfile));
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="tablist"]')).toBeTruthy();
    expect(el.textContent).toContain('Perfil');
    expect(el.querySelector('[data-tab="palestrante"]')).toBeNull();
    expect(el.querySelector('[data-tab="rede-social"]')).toBeNull();
  });

  it('shows extra tabs when formPreview sets funcao Palestrante', async () => {
    await setup();
    const account = TestBed.inject(AccountService);
    vi.mocked(account.getProfile).mockReturnValue(of(baseProfile));
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onFormPreview({
      primeiroNome: 'Nome',
      ultimoNome: 'Sobrenome',
      descricao: 'Bio',
      funcao: 'Palestrante',
    });
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-tab="palestrante"]')).toBeTruthy();
    expect(el.querySelector('[data-tab="rede-social"]')).toBeTruthy();
  });

  it('shows Palestrante and Rede Social tabs when profile is Palestrante', async () => {
    await setup();
    const account = TestBed.inject(AccountService);
    vi.mocked(account.getProfile).mockReturnValue(of(palestranteProfile));
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-tab="palestrante"]')).toBeTruthy();
    expect(el.querySelector('[data-tab="rede-social"]')).toBeTruthy();
  });

  it('does not show redes section for Participante', async () => {
    await setup();
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.getProfile).mockReturnValue(of(baseProfile));

    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.ehPalestrante).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Salvar Redes');
  });

  it('loads palestrante getMe when user becomes Palestrante', async () => {
    await setup();
    const account = TestBed.inject(AccountService);
    const palestrante = TestBed.inject(PalestranteService);
    vi.mocked(account.getProfile).mockReturnValue(of(baseProfile));
    vi.mocked(palestrante.getMe).mockReturnValue(
      of({ id: 1, nome: 'A', email: '', telefone: '', imagemURL: '', miniCurriculo: '' }),
    );
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.onFormPreview({
      primeiroNome: 'N',
      ultimoNome: 'S',
      descricao: 'D',
      funcao: 'Palestrante',
    });
    fixture.componentInstance.selectTab('palestrante');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(palestrante.getMe).toHaveBeenCalled();
  });

  it.skip('loads and saves redes for Palestrante', async () => {
    // Task 4
  });

  it.skip('deletes persisted rede via deleteMine after confirmation', async () => {
    // Task 4
  });
});
