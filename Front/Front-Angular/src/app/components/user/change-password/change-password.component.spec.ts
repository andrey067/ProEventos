import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AccountService } from '../../../services/account.service';
import { ChangePasswordComponent } from './change-password.component';

describe('ChangePasswordComponent', () => {
  async function setup() {
    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AccountService,
          useValue: {
            changePassword: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders change password fields', async () => {
    await setup();
    const fixture = TestBed.createComponent(ChangePasswordComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Alterar senha');
    expect(compiled.querySelector('input[formControlName="currentPassword"]')).toBeTruthy();
    expect(compiled.querySelector('input[formControlName="confirmPassword"]')).toBeTruthy();
  });

  it('marks form invalid when passwords do not match', async () => {
    await setup();
    const fixture = TestBed.createComponent(ChangePasswordComponent);
    const accountService = TestBed.inject(AccountService);

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      currentPassword: 'old',
      newPassword: 'new1',
      confirmPassword: 'new2',
    });
    fixture.componentInstance.form.markAllAsTouched();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.hasError('passwordMismatch')).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'As senhas não coincidem.',
    );

    fixture.componentInstance.submit();
    expect(accountService.changePassword).not.toHaveBeenCalled();
  });

  it('submits when passwords match', async () => {
    await setup();
    const fixture = TestBed.createComponent(ChangePasswordComponent);
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.changePassword).mockReturnValue(of(undefined));

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      currentPassword: 'old',
      newPassword: 'new1',
      confirmPassword: 'new1',
    });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.form.hasError('passwordMismatch')).toBe(false);
    expect(accountService.changePassword).toHaveBeenCalledWith({
      currentPassword: 'old',
      newPassword: 'new1',
    });
    expect(fixture.componentInstance.success).toBe('Senha alterada com sucesso.');
  });

  it('shows error when changePassword fails', async () => {
    await setup();
    const fixture = TestBed.createComponent(ChangePasswordComponent);
    const accountService = TestBed.inject(AccountService);
    vi.mocked(accountService.changePassword).mockReturnValue(
      throwError(() => ({
        error: { description: 'Senha atual incorreta.' },
        status: 400,
      })),
    );

    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      currentPassword: 'wrong',
      newPassword: 'new1',
      confirmPassword: 'new1',
    });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.error).toBe('Senha atual incorreta.');
  });
});
