import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AccountService } from '../../../services/account.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AccountService,
          useValue: {
            register: vi.fn(),
            registerPalestrante: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders register form fields', async () => {
    await setup();
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Cadastro');
    expect(compiled.querySelector('input[formControlName="nome"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="asPalestrante"]')).toBeTruthy();
  });

  it('registers as regular user by default', async () => {
    await setup();
    const fixture = TestBed.createComponent(RegisterComponent);
    const accountService = TestBed.inject(AccountService);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.mocked(accountService.register).mockReturnValue(
      of({ token: 't', userName: 'u', email: 'a@b.com', nome: 'Nome' }),
    );

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      nome: 'Nome',
      userName: 'u',
      email: 'a@b.com',
      password: 'p',
      asPalestrante: false,
      miniCurriculo: '',
      telefone: '',
      imagemURL: '',
    });
    fixture.componentInstance.submit();

    expect(accountService.register).toHaveBeenCalledWith({
      nome: 'Nome',
      userName: 'u',
      email: 'a@b.com',
      password: 'p',
    });
    expect(accountService.registerPalestrante).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/eventos']);
  });

  it('registers as palestrante when checkbox is checked', async () => {
    await setup();
    const fixture = TestBed.createComponent(RegisterComponent);
    const accountService = TestBed.inject(AccountService);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.mocked(accountService.registerPalestrante).mockReturnValue(
      of({ token: 't', userName: 'u', email: 'a@b.com', nome: 'Nome', palestranteId: 1 }),
    );

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      nome: 'Nome',
      userName: 'u',
      email: 'a@b.com',
      password: 'p',
      asPalestrante: true,
      miniCurriculo: 'Dev',
      telefone: '11999999999',
      imagemURL: 'https://img.test/p.jpg',
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.asPalestrante).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('textarea[formControlName="miniCurriculo"]'),
    ).toBeTruthy();

    fixture.componentInstance.submit();

    expect(accountService.registerPalestrante).toHaveBeenCalledWith({
      nome: 'Nome',
      userName: 'u',
      email: 'a@b.com',
      password: 'p',
      miniCurriculo: 'Dev',
      telefone: '11999999999',
      imagemURL: 'https://img.test/p.jpg',
    });
    expect(accountService.register).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/eventos']);
  });

  it('shows error on failed palestrante register', async () => {
    await setup();
    const fixture = TestBed.createComponent(RegisterComponent);
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.registerPalestrante).mockReturnValue(
      throwError(() => ({
        error: { description: 'Usuário já existe.' },
        status: 400,
      })),
    );

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      nome: 'Nome',
      userName: 'u',
      email: 'a@b.com',
      password: 'p',
      asPalestrante: true,
      miniCurriculo: '',
      telefone: '',
      imagemURL: '',
    });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error).toBe('Usuário já existe.');
  });
});
