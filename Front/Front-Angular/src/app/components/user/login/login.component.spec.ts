import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { LoginComponent } from './login.component';
import { AccountService } from '../../../services/account.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  async function setup(returnUrl: string | null = null) {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AccountService,
          useValue: {
            login: vi.fn(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'returnUrl' ? returnUrl : null),
              },
            },
          },
        },
      ],
    }).compileComponents();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders login form fields', async () => {
    await setup();
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Login');
    expect(compiled.querySelector('input[formControlName="userName"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="password"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Entrar');
  });

  it('submits credentials via AccountService', async () => {
    await setup();
    const fixture = TestBed.createComponent(LoginComponent);
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.login).mockReturnValue(
      of({ token: 't', userName: 'u', email: 'a@b.com', nome: 'Nome' }),
    );

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ userName: 'u', password: 'p' });
    fixture.componentInstance.submit();

    expect(accountService.login).toHaveBeenCalledWith({ userName: 'u', password: 'p' });
  });

  it('navigates to returnUrl after successful login', async () => {
    await setup('/eventos/new');
    const fixture = TestBed.createComponent(LoginComponent);
    const accountService = TestBed.inject(AccountService);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.mocked(accountService.login).mockReturnValue(
      of({ token: 't', userName: 'u', email: 'a@b.com', nome: 'Nome' }),
    );

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ userName: 'u', password: 'p' });
    fixture.componentInstance.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/eventos/new');
  });

  it('falls back to /eventos when returnUrl is missing', async () => {
    await setup(null);
    const fixture = TestBed.createComponent(LoginComponent);
    const accountService = TestBed.inject(AccountService);
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.mocked(accountService.login).mockReturnValue(
      of({ token: 't', userName: 'u', email: 'a@b.com', nome: 'Nome' }),
    );

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ userName: 'u', password: 'p' });
    fixture.componentInstance.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/eventos');
  });

  it('shows error on failed login', async () => {
    await setup();
    const fixture = TestBed.createComponent(LoginComponent);
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.login).mockReturnValue(
      throwError(() => ({
        error: { description: 'Credenciais inválidas.' },
        status: 401,
      })),
    );

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ userName: 'u', password: 'p' });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error).toBe('Credenciais inválidas.');
  });

  it('falls back when error body has no description', async () => {
    await setup();
    const fixture = TestBed.createComponent(LoginComponent);
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.login).mockReturnValue(throwError(() => new Error('fail')));

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ userName: 'u', password: 'p' });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error).toContain('inválidos');
  });
});
