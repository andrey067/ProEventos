import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { AccountService } from '../../../services/account.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  beforeEach(async () => {
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
      ],
    }).compileComponents();
  });

  it('renders login form fields', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Login');
    expect(compiled.querySelector('input[formControlName="userName"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="password"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Entrar');
  });

  it('submits credentials via AccountService', () => {
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

  it('shows error on failed login', () => {
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

  it('falls back when error body has no description', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.login).mockReturnValue(throwError(() => new Error('fail')));

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({ userName: 'u', password: 'p' });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error).toContain('inválidos');
  });
});
