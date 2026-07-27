import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavComponent } from './nav.component';
import { AuthTokenService } from '../../services/auth-token.service';
import { AccountService } from '../../services/account.service';

describe('NavComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthTokenService,
          useValue: { isAuthenticated: vi.fn(() => false) },
        },
        {
          provide: AccountService,
          useValue: { logout: vi.fn() },
        },
      ],
    }).compileComponents();
  });

  it('should render navigation links for guests', () => {
    const fixture = TestBed.createComponent(NavComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('ProEventos');
    expect(compiled.textContent).toContain('Eventos');
    expect(compiled.textContent).toContain('Palestrantes');
    expect(compiled.textContent).toContain('Login');
    expect(compiled.textContent).toContain('Cadastro');
  });

  it('should render session links when authenticated', () => {
    const authToken = TestBed.inject(AuthTokenService);
    vi.mocked(authToken.isAuthenticated).mockReturnValue(true);

    const fixture = TestBed.createComponent(NavComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Perfil');
    expect(compiled.textContent).toContain('Sair');
  });
});
